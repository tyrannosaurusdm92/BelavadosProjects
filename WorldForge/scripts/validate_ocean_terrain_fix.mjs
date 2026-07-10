import fs from 'node:fs';
import crypto from 'node:crypto';
import { compileTerrainFromSources, smoothElevationGrid } from '../js/terrain-fusion.js';
import { WorldModel, worldOptionsForPreset } from '../js/procedural.js';
import { MarineEcosystem } from '../js/immersive-systems.js';

const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),checks=[];
const check=(name,ok,details={})=>checks.push({name,ok:Boolean(ok),...details});

// Ambiguous parchment-like source: the target-water classifier must still make a coherent ocean.
const w=256,h=128,gray=new Float32Array(w*h),water=new Float32Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const nx=x/w,ny=y/h,continental=Math.sin(nx*Math.PI*6)*.18+Math.cos(ny*Math.PI*4)*.16+Math.sin((nx+ny)*Math.PI*3)*.12;
  gray[y*w+x]=.58+continental;water[y*w+x]=.12; // deliberately no useful blue-water signal
}
const compiled=await compileTerrainFromSources({surface:{width:w,height:h,gray,water}},{minElevationM:-11000,maxElevationM:9000,targetWaterPercent:68,maxNeighborDeltaM:380,slopeIterations:32});
check('adaptive sea coverage survives ambiguous art',compiled.diagnostics.classifiedWaterCoveragePercent>55&&compiled.diagnostics.classifiedWaterCoveragePercent<80,{coverage:compiled.diagnostics.classifiedWaterCoveragePercent,target:compiled.diagnostics.targetWaterCoveragePercent});
check('terrain has both land and seabed',compiled.diagnostics.minMeters<-250&&compiled.diagnostics.maxMeters>250,{min:compiled.diagnostics.minMeters,max:compiled.diagnostics.maxMeters});
check('no spike edges after slope limiting',compiled.diagnostics.remainingSpikeEdges===0&&compiled.diagnostics.maxNeighborDeltaMeters<430,{maxNeighborDeltaMeters:compiled.diagnostics.maxNeighborDeltaMeters,remainingSpikeEdges:compiled.diagnostics.remainingSpikeEdges});
check('water mask preserved',compiled.waterMask?.length===w*h&&compiled.waterMask.some(v=>v>.7)&&compiled.waterMask.some(v=>v<.3));

const impulse=new Float32Array(96*48);impulse.fill(-1200);impulse[24*96+48]=9000;
const smoothed=smoothElevationGrid(impulse,96,48,{minElevationM:-11000,maxElevationM:9000,maxNeighborDeltaM:300,slopeIterations:36});
check('single-pixel elevation impulse is removed',smoothed.diagnostics.remainingSpikeEdges===0&&smoothed.diagnostics.maxNeighborDeltaMeters<305,{maxNeighborDeltaMeters:smoothed.diagnostics.maxNeighborDeltaMeters,center:smoothed.values[24*96+48]});

const baseOpts=worldOptionsForPreset('earth',93714,67),baseline=new WorldModel({...baseOpts,features:[]}),withPin=new WorldModel({...baseOpts,features:[{name:'Settlement pin',type:'capital settlement pin',lat:0,lon:0,elevation_m:9000}]});
const a=baseline.elevationAt(0,0),b=withPin.elevationAt(0,0);
check('settlement/pin overlays cannot deform terrain',Math.abs(a-b)<1e-6,{baseline:a,withPin:b});
const withMountain=new WorldModel({...baseOpts,features:[{name:'Broad range',type:'mountain range',lat:0,lon:0,elevation_m:7000,influence_lat:8,influence_lon:8}]});
const center=withMountain.elevationAt(0,0),near=withMountain.elevationAt(1,0),far=withMountain.elevationAt(20,0);
check('geological features deform broadly rather than as pins',center>near&&near>far&&Math.abs(center-near)<3500,{center,near,far});

const marine=new MarineEcosystem(baseline).buildScene({lat:12,lon:44},{biomes:[{name:'Underwater with reefs'}]},1450);
check('full marine ecosystem object count',marine.objects.length>=1600,{objects:marine.objects.length});
check('marine life rendered as geometry, not pin sprites',marine.objects.every(o=>o.renderAsPoint===false)&&marine.mesh.positions.length/3>9000,{meshVertices:marine.mesh.positions.length/3,meshTriangles:marine.mesh.indices.length/3});
const zones=new Set(marine.objects.map(o=>o.details?.zone).filter(Boolean));
check('all ocean ecological zones present',['reef','shelf','slope','abyss','trench'].every(z=>zones.has(z)),{zones:[...zones]});

const app=read('js/app.js'),renderer=read('js/renderer.js'),procedural=read('js/procedural.js'),standalone=read('js/standalone-exporter.js'),index=read('index.html');
check('bundled catalog is not injected as every-world points',app.includes('worldSettlements=[]')&&app.includes('function makePlanetFeatures(){')&&/function makePlanetFeatures\(\)\{[\s\S]*?return \[\];[\s\S]*?\}/.test(app));
check('point overlays default off',renderer.includes('features:false')&&index.includes('id="toggle-features" type="checkbox"')&&!index.includes('id="toggle-features" type="checkbox" checked'));
check('weather uses cloud shader rather than point-pin shader',renderer.includes('CLOUD_FS')&&renderer.includes('this.programs.weather'));
check('renderer builds separate ocean mesh from water mask',renderer.includes('model.waterAt?model.waterAt')&&renderer.includes('this.ocean={vao:ovao'));
check('standalone ocean does not restore generic point life',standalone.includes("renderer.setLocalScene(terrain,null,'underwater'"));
check('standalone exports preserve water mask',standalone.includes('waterMaskU8'));
check('terrain feature deformation excludes overlay types',procedural.includes('overlay=/pin|marker|settlement'));

const endpoint='https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec',active=[app,read('js/backend-lock.js'),read('config/backend_lock.json'),read('creator_core/backend-sync.js')].join('\n'),urls=[...active.matchAll(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g)].map(m=>m[0]);
check('single locked backend remains unchanged',new Set(urls).size===1&&urls[0]===endpoint,{found:[...new Set(urls)],sha256:crypto.createHash('sha256').update(endpoint).digest('hex')});

const report={schema:'worldforge.ocean-terrain-correction-validation.v1',generatedAtUtc:new Date().toISOString(),ok:checks.every(x=>x.ok),checks};
fs.writeFileSync(new URL('../docs/OCEAN_TERRAIN_CORRECTION_VALIDATION.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.ok)process.exit(1);
