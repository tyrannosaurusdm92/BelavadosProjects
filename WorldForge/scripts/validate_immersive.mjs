import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { WorldModel } from '../js/procedural.js';
import { WorldSimulation } from '../js/simulation-engine.js';
import { PatternedWeatherSystem, MarineEcosystem, CaveExplorerSystem, VolcanoSystem } from '../js/immersive-systems.js';
import { buildStandaloneHTMLForValidation } from '../js/standalone-exporter.js';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const checks=[];const check=(name,ok,details={})=>checks.push({name,ok:Boolean(ok),...details});
const endpoint='https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec';

const sim=new WorldSimulation();sim.startedAt=new Date('2026-07-10T00:00:00Z');sim.worldMinutes=0;
const record={id:'test:reef',name:'Validation Reef',lat:24.5,lon:-70.2,biomes:['Underwater with reefs','Beach and reefs with water'],climateBelt:'Subtropical marine'};
const weather=new PatternedWeatherSystem(sim);
const a=weather.pattern(record,sim.date(),'annual'),b=weather.pattern(record,sim.date(),'annual');
check('deterministic annual weather',JSON.stringify(a)===JSON.stringify(b),{dayOfYear:a.dayOfYear,intensity:a.intensity,pressureHpa:a.pressureHpa});
const c=weather.pattern(record,new Date('2026-10-10T00:00:00Z'),'annual');
check('seasonal weather changes by date',a.temperatureC!==c.temperatureC||a.precipitationChance!==c.precipitationChance,{julyTemperature:a.temperatureC,octoberTemperature:c.temperatureC});

const model=new WorldModel({name:'Validation World',preset:'earth',seed:93714,features:[]});
const marine=new MarineEcosystem(model).build({lat:24.5,lon:-70.2},{biomes:[{name:'Underwater with reefs'}]},1450);
const zones=new Set(marine.map(x=>x.details?.zone).filter(Boolean));
check('marine ecosystem population',marine.length>=1500,{objects:marine.length,zones:[...zones]});
check('marine ecological depth zones',['reef','shelf','slope','abyss','trench'].every(x=>zones.has(x)),{zones:[...zones]});

const cave=JSON.parse(read('data/caves/sample_cave.json'));
const cavePoints=new CaveExplorerSystem(cave).points();
check('clickable cave survey stations',cavePoints.length===cave.stations.length,{stations:cave.stations.length,clickableObjects:cavePoints.length});
const volcano=new VolcanoSystem(sim).state({id:'volcano:test',name:'Test Caldera'});
check('deterministic volcano cycle',volcano.cycleDays>=7&&volcano.cycleDays<=186&&volcano.activity>=0&&volcano.activity<=1,volcano);

const index=read('index.html'),app=read('js/app.js'),renderer=read('js/renderer.js'),absorber=read('js/source-absorber.js');
for(const id of ['export-standalone-globe','export-standalone-settlement','browse-folder','absorbed-modules','reset-camera'])check(`UI control #${id}`,index.includes(`id="${id}"`));
check('surface UV texture shader',renderer.includes('uSurfaceMap')&&renderer.includes('vUv')&&renderer.includes('setSurfaceTexture'));
check('source repository absorption',absorber.includes('ingestCSS')&&absorber.includes('ingestJS')&&absorber.includes('ingestHTML')&&absorber.includes('controlsFromData'));
check('living ocean wired to scene',app.includes("marineSystem").valueOf()&&app.includes("scene==='underwater'"));
check('cave explorer wired to scene',app.includes('CaveExplorerSystem')&&app.includes('setCaveScene'));
check('center globe wired',app.includes("$('#reset-camera').addEventListener('click',()=>renderer.resetCamera())"));

const textFiles=['js/backend-lock.js','config/backend_lock.json','creator_core/backend-sync.js','manifest.json','docs/manifest.json'];
const found=new Set();for(const f of textFiles)for(const m of read(f).matchAll(/https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/g))found.add(m[0]);
check('single locked backend endpoint',found.size===1&&found.has(endpoint),{found:[...found]});
const expectedHash=crypto.createHash('sha256').update(endpoint).digest('hex');
const lock=JSON.parse(read('config/backend_lock.json'));check('backend lock checksum',lock.endpointSha256===expectedHash,{expectedHash,actual:lock.endpointSha256});

const sources={math:read('js/math.js'),procedural:read('js/procedural.js'),renderer:read('js/renderer.js'),settlement:read('js/settlement-engine.js'),simulation:read('js/simulation-engine.js'),immersive:read('js/immersive-systems.js')};
const html=buildStandaloneHTMLForValidation({name:'Validation World',payload:{name:'Validation',features:[],weather_systems:[],geojson_lines:[]},sources,cave,focus:{lat:0,lon:0}},'globe');
const bootstrap=html.match(/<script type="module">([\s\S]*)<\/script>/)?.[1]||'';
let captured='';try{let src=bootstrap.replace(/import\(mainUrl\)\.catch\([\s\S]*?\);\s*$/,'globalThis.__CAPTURED_MAIN__=main;');const context=vm.createContext({Blob,URL,console,window:{}});new vm.Script(src).runInContext(context);captured=context.__CAPTURED_MAIN__||'';new vm.SourceTextModule(captured,{context:vm.createContext({})});check('standalone WebGL module graph compiles',captured.includes('WorldRenderer')&&captured.includes('MarineEcosystem'),{htmlBytes:Buffer.byteLength(html),mainBytes:Buffer.byteLength(captured)});}catch(error){check('standalone WebGL module graph compiles',false,{error:error.message});}
check('standalone HTML under 24 MiB without user imagery',Buffer.byteLength(html)<24*1024*1024,{htmlBytes:Buffer.byteLength(html)});

const report={schema:'worldforge.immersive-validation.v3',generatedAtUtc:new Date().toISOString(),ok:checks.every(x=>x.ok),checks};
fs.writeFileSync(new URL('../docs/IMMERSIVE_VALIDATION_REPORT.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));if(!report.ok)process.exit(1);
