import { clamp, degToRad, lerp, smoothstep, seededRandom } from './math.js';

const BIOMES = [
  {name:'Deep ocean', color:[0.015,0.08,0.19]},
  {name:'Ocean Surface - floating settlement', color:[0.05,0.42,0.55]},
  {name:'Ocean Surface floating settlement', color:[0.05,0.42,0.55]},
  {name:'Underwater with reefs', color:[0.02,0.32,0.42]},
  {name:'Underwater without reefs', color:[0.015,0.12,0.25]},
  {name:'Ocean with reefs', color:[0.02,0.28,0.37]},
  {name:'Beach and reefs with water', color:[0.42,0.68,0.55]},
  {name:'Beach and grass with water', color:[0.66,0.69,0.38]},
  {name:'Marshes and swamps', color:[0.18,0.35,0.20]},
  {name:'Grassland', color:[0.32,0.56,0.22]},
  {name:'Prairie', color:[0.56,0.63,0.28]},
  {name:'Farming', color:[0.48,0.55,0.20]},
  {name:'Partial forest', color:[0.18,0.43,0.20]},
  {name:'Deep forest', color:[0.055,0.27,0.15]},
  {name:'Rainforest', color:[0.03,0.40,0.20]},
  {name:'Treetops - treehouses', color:[0.12,0.46,0.22]},
  {name:'Mountain range', color:[0.39,0.36,0.34]},
  {name:'Valley', color:[0.30,0.46,0.25]},
  {name:'Tundra', color:[0.48,0.56,0.54]},
  {name:'Ice cap', color:[0.86,0.94,0.98]},
  {name:'Volcanic field', color:[0.22,0.16,0.14]},
  {name:'Deep cavern', color:[0.16,0.13,0.17]},
  {name:'Hybrid tree and forest floor', color:[0.14,0.39,0.18]},
  {name:'Hybrid farming forest grassland', color:[0.42,0.52,0.20]},
];

export const biomeCatalog = BIOMES;

function hash2(x, y, seed) {
  let n = Math.imul((x|0) ^ (seed|0), 0x27d4eb2d) ^ Math.imul(y|0, 0x165667b1);
  n = Math.imul(n ^ (n >>> 15), 1 | n);
  n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
  return ((n ^ (n >>> 14)) >>> 0) / 4294967295;
}
function fade(t) { return t*t*(3-2*t); }
function noise2(x, y, seed) {
  const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy;
  const a=hash2(ix,iy,seed), b=hash2(ix+1,iy,seed), c=hash2(ix,iy+1,seed), d=hash2(ix+1,iy+1,seed);
  return lerp(lerp(a,b,fade(fx)), lerp(c,d,fade(fx)), fade(fy))*2-1;
}
function fbm(x, y, seed, octaves=5) {
  let f=1, a=.5, s=0, norm=0;
  for(let i=0;i<octaves;i++){ s += noise2(x*f,y*f,seed+i*1013)*a; norm+=a; f*=2.03; a*=.5; }
  return s/norm;
}
function ridge(x){ return 1-Math.abs(x); }
function lonDelta(a,b){ let d=Math.abs(a-b)%360; return Math.min(d,360-d); }
function gaussianGeo(lat, lon, cLat, cLon, rLat, rLon) {
  const a=(lat-cLat)/rLat, b=lonDelta(lon,cLon)/rLon;
  return Math.exp(-(a*a+b*b)*1.6);
}

const EARTH_CONTINENTS = [
  [46,-104,31,38,1.10], [14,-91,25,20,.82], [-14,-60,37,25,1.05], [-43,-67,21,15,.65],
  [51,22,24,31,.72], [10,22,39,25,1.08], [41,83,34,54,1.22], [16,103,23,23,.78],
  [-25,135,27,32,.82], [-74,20,18,80,1.25], [72,-42,18,18,.65], [35,138,10,10,.28],
  [-4,120,13,17,.28], [64,136,17,31,.48]
];
const EARTH_RANGES = [
  [29,84,9,30,1.0], [35,-113,11,18,.72], [-20,-70,24,8,.88], [47,10,7,13,.58],
  [32,52,9,20,.48], [-5,145,9,17,.55], [-42,172,7,7,.42], [60,-145,9,16,.5],
  [5,37,16,8,.48], [43,142,8,9,.38]
];

export class WorldModel {
  constructor(options={}) {
    this.name = options.name || 'Procedural Earth';
    this.preset = options.preset || 'earth';
    this.seed = Number(options.seed ?? 93714);
    this.radiusKm = Number(options.radiusKm ?? 6371);
    this.waterPercent = Number(options.waterPercent ?? 67);
    this.seaLevelM = Number(options.seaLevelM ?? 0);
    this.maxElevationM = Number(options.maxElevationM ?? 9000);
    this.minElevationM = Number(options.minElevationM ?? -11000);
    this.features = options.features || [];
    this.heightmap = null;
    this.profile = null;
    this.random = seededRandom(this.seed);
  }
  setHeightmap(map){ this.heightmap=map; }
  setProfile(profile){ this.profile=profile; }
  sampleHeightmap(lat,lon){
    const h=this.heightmap;
    if(!h) return null;
    const u=((lon+180)/360)*(h.width-1), v=((90-lat)/180)*(h.height-1);
    const x0=Math.floor(u), y0=Math.floor(v), x1=Math.min(h.width-1,x0+1), y1=Math.min(h.height-1,y0+1);
    const tx=u-x0, ty=v-y0;
    const i=(x,y)=>h.values[y*h.width+x];
    const val=lerp(lerp(i(x0,y0),i(x1,y0),tx),lerp(i(x0,y1),i(x1,y1),tx),ty);
    return lerp(h.minElevationM, h.maxElevationM, val);
  }
  baseField(lat,lon){
    const x=(lon+180)/55, y=(lat+90)/48;
    const n=fbm(x,y,this.seed,6), detail=fbm(x*4.2,y*4.2,this.seed+77,4);
    if(this.preset==='earth'){
      let c=-.72;
      for(const [clat,clon,rlat,rlon,w] of EARTH_CONTINENTS) c += gaussianGeo(lat,lon,clat,clon,rlat,rlon)*w;
      c += n*.31 + detail*.06;
      return c;
    }
    const waterBias=(this.waterPercent-50)/50;
    let c=n*.92 + fbm(x*.35,y*.35,this.seed+431,5)*.58 - waterBias*.68;
    if(this.preset==='oceanic') c-=.42;
    if(this.preset==='verdant') c+=.12;
    if(this.preset==='volcanic') c+=ridge(fbm(x*1.8,y*1.8,this.seed+99,4))*.18-.08;
    return c;
  }
  elevationAt(lat,lon){
    const hm=this.sampleHeightmap(lat,lon);
    if(hm!==null) return hm;
    const field=this.baseField(lat,lon);
    const shoreThreshold=this.preset==='earth' ? 0 : .02;
    let elevation;
    if(field>shoreThreshold){
      const inland=smoothstep(shoreThreshold,1.2,field);
      const x=(lon+180)/23, y=(lat+90)/23;
      const rugged=ridge(fbm(x,y,this.seed+200,5));
      elevation=80 + inland*2800 + Math.pow(rugged,4)*inland*1800;
      if(this.preset==='earth'){
        let ranges=0;
        for(const [clat,clon,rlat,rlon,w] of EARTH_RANGES) ranges=Math.max(ranges,gaussianGeo(lat,lon,clat,clon,rlat,rlon)*w);
        elevation+=Math.pow(ranges,1.6)*6200;
      }
      if(this.preset==='volcanic') elevation+=Math.pow(ridge(fbm(x*1.4,y*1.4,this.seed+910,4)),8)*4200;
    } else {
      const depth=smoothstep(shoreThreshold,-1.3,field);
      const trench=Math.pow(ridge(fbm((lon+180)/17,(lat+90)/17,this.seed+500,5)),10);
      elevation=-40-depth*5600-trench*depth*3900;
    }
    for(const f of this.features){
      if(typeof f.lat!=='number'||typeof f.lon!=='number'||typeof f.elevation_m!=='number') continue;
      const influence=gaussianGeo(lat,lon,f.lat,f.lon,f.influence_lat||2.2,f.influence_lon||2.2);
      if(influence>.002) elevation=lerp(elevation,f.elevation_m,Math.pow(influence,2.3));
    }
    return clamp(elevation,this.minElevationM,this.maxElevationM);
  }
  climateAt(lat,lon,elevation=this.elevationAt(lat,lon)){
    const equator=1-Math.abs(lat)/90;
    const seasonal=fbm((lon+180)/40,(lat+90)/40,this.seed+800,4);
    let temperature=34*equator-12*(1-equator)-Math.max(0,elevation)*.0062+seasonal*5;
    let moisture=.47+fbm((lon+180)/31,(lat+90)/31,this.seed+990,5)*.38;
    if(elevation<0) moisture=.95;
    moisture=clamp(moisture,0,1);
    return {temperature,moisture};
  }
  biomeAt(lat,lon,elevation=this.elevationAt(lat,lon)){
    const {temperature,moisture}=this.climateAt(lat,lon,elevation);
    let name;
    if(elevation < -2500) name='Deep ocean';
    else if(elevation < -25) name=temperature>18&&moisture>.75?'Ocean with reefs':'Deep ocean';
    else if(elevation < 45) name=moisture>.72?'Beach and reefs with water':'Beach and grass with water';
    else if(Math.abs(lat)>73) name='Ice cap';
    else if(elevation>4200||temperature<-8) name='Ice cap';
    else if(elevation>2300) name='Mountain range';
    else if(moisture>.82&&temperature>21) name='Rainforest';
    else if(moisture>.76&&elevation<500) name='Marshes and swamps';
    else if(moisture>.63) name='Deep forest';
    else if(moisture>.48) name='Partial forest';
    else if(moisture>.32) name='Grassland';
    else name='Prairie';
    if(this.preset==='volcanic'&&elevation>800&&fbm(lon/18,lat/18,this.seed+44,3)>.47) name='Volcanic field';
    const biome=BIOMES.find(b=>b.name===name)||BIOMES[5];
    return {...biome,temperature,moisture};
  }
  describeAt(lat,lon){
    const elevation=this.elevationAt(lat,lon), biome=this.biomeAt(lat,lon,elevation);
    return {lat,lon,elevation,biome:biome.name,temperature:biome.temperature,moisture:biome.moisture,color:biome.color};
  }
  serialize(){
    return {
      schema:'worlddepth.world.v1', name:this.name, preset:this.preset, seed:this.seed, radius_km:this.radiusKm,
      water_percent:this.waterPercent, sea_level_m:this.seaLevelM, min_elevation_m:this.minElevationM,
      max_elevation_m:this.maxElevationM, features:this.features, active_settlement_profile:this.profile?.name||null
    };
  }
}

export function worldOptionsForPreset(preset,seed,waterPercent){
  const common={preset,seed,waterPercent:Number(waterPercent)};
  if(preset==='earth') return {...common,name:'Earth — geological demonstration',radiusKm:6371,waterPercent:67,minElevationM:-11000,maxElevationM:9000};
  if(preset==='verdant') return {...common,name:'Verdant exoplanet',radiusKm:7340,waterPercent:58,minElevationM:-9200,maxElevationM:11800};
  if(preset==='oceanic') return {...common,name:'Pelagic ocean world',radiusKm:5820,waterPercent:88,minElevationM:-15500,maxElevationM:6200};
  if(preset==='volcanic') return {...common,name:'Volcanic tectonic world',radiusKm:6810,waterPercent:42,minElevationM:-9700,maxElevationM:14800};
  return {...common,name:`Custom world ${seed}`,radiusKm:6371,minElevationM:-12000,maxElevationM:12000};
}

export function makeLocalTerrain(model, focus, mode='local', profile=null, resolution=128){
  const size=30, verts=[], colors=[], indices=[];
  const biomeNames=profile?.biomes?.map(b=>b.name)||[];
  for(let z=0;z<=resolution;z++){
    for(let x=0;x<=resolution;x++){
      const px=(x/resolution-.5)*size, pz=(z/resolution-.5)*size;
      const lat=focus.lat+pz*.018, lon=focus.lon+px*.018/Math.max(.25,Math.cos(degToRad(focus.lat)));
      let elev=model.elevationAt(lat,lon);
      const localNoise=fbm(px/9,pz/9,model.seed+1700,5)*320 + fbm(px/2.2,pz/2.2,model.seed+1800,3)*40;
      if(mode==='underwater') elev=Math.min(-200,elev)-localNoise*.7;
      else elev=elev+localNoise;
      const center=model.elevationAt(focus.lat,focus.lon);
      let y=(elev-center)/260;
      if(mode==='underwater') y=(elev+Math.abs(Math.min(-200,center)))/300-4.5;
      const b=model.biomeAt(lat,lon,elev);
      let color=b.color;
      if(biomeNames.length){
        const t=(fbm(px/6,pz/6,model.seed+2200,4)+1)/2;
        const chosen=biomeCatalog.find(v=>v.name===biomeNames[Math.min(biomeNames.length-1,Math.floor(t*biomeNames.length))]);
        if(chosen) color=chosen.color;
      }
      verts.push(px,y,pz); colors.push(...color);
    }
  }
  for(let z=0;z<resolution;z++) for(let x=0;x<resolution;x++){
    const a=z*(resolution+1)+x,b=a+1,c=a+resolution+1,d=c+1;
    indices.push(a,c,b,b,c,d);
  }
  return {positions:new Float32Array(verts),colors:new Float32Array(colors),indices:new Uint32Array(indices),size,centerElevation:model.elevationAt(focus.lat,focus.lon)};
}

export function makeLifePoints(model, focus, mode='local', profile=null, count=850){
  const rnd=seededRandom(model.seed+Math.floor((focus.lat+90)*1000)+Math.floor((focus.lon+180)*1000));
  const positions=[],colors=[],sizes=[],velocities=[];
  for(let i=0;i<count;i++){
    const x=(rnd()-.5)*28,z=(rnd()-.5)*28;
    if(mode==='underwater'){
      const y=-3.7+rnd()*5.2;
      positions.push(x,y,z); colors.push(.22+rnd()*.35,.65+rnd()*.25,.72+rnd()*.25); sizes.push(3+rnd()*7); velocities.push((rnd()-.5)*.15,(rnd()-.5)*.04,(rnd()-.5)*.15);
    }else{
      const y=-.1+rnd()*.7;
      positions.push(x,y,z);
      const forest=profile?.biomes?.some(b=>/forest|rainforest|tree/i.test(b.name));
      if(forest) colors.push(.05+rnd()*.08,.28+rnd()*.25,.09+rnd()*.08);
      else colors.push(.35+rnd()*.28,.55+rnd()*.3,.13+rnd()*.12);
      sizes.push(2+rnd()*5); velocities.push(0,0,0);
    }
  }
  return {positions:new Float32Array(positions),colors:new Float32Array(colors),sizes:new Float32Array(sizes),velocities:new Float32Array(velocities)};
}

export function makeCaveMesh(cave, radialSegments=10){
  const pts=cave.stations.map(s=>[s.x,s.z??s.y,s.y??s.z]);
  const positions=[],colors=[],indices=[];
  const rings=[];
  for(let i=0;i<pts.length;i++){
    const p=pts[i], prev=pts[Math.max(0,i-1)], next=pts[Math.min(pts.length-1,i+1)];
    const tx=next[0]-prev[0], ty=next[1]-prev[1], tz=next[2]-prev[2];
    const len=Math.hypot(tx,ty,tz)||1, t=[tx/len,ty/len,tz/len];
    let up=Math.abs(t[1])>.9?[1,0,0]:[0,1,0];
    let sx=up[1]*t[2]-up[2]*t[1], sy=up[2]*t[0]-up[0]*t[2], sz=up[0]*t[1]-up[1]*t[0];
    const sl=Math.hypot(sx,sy,sz)||1; sx/=sl;sy/=sl;sz/=sl;
    const ux=t[1]*sz-t[2]*sy,uy=t[2]*sx-t[0]*sz,uz=t[0]*sy-t[1]*sx;
    const ring=[]; const width=cave.stations[i].width||2.4, height=cave.stations[i].height||2.0;
    for(let r=0;r<radialSegments;r++){
      const a=r/radialSegments*Math.PI*2, ca=Math.cos(a),sa=Math.sin(a);
      positions.push(p[0]+sx*ca*width+ux*sa*height,p[1]+sy*ca*width+uy*sa*height,p[2]+sz*ca*width+uz*sa*height);
      const shade=.18+.16*Math.sin(a)*.5+.08*(i/pts.length); colors.push(shade*.9,shade*.78,shade*.65);
      ring.push(i*radialSegments+r);
    }
    rings.push(ring);
  }
  for(let i=0;i<rings.length-1;i++) for(let r=0;r<radialSegments;r++){
    const rn=(r+1)%radialSegments,a=rings[i][r],b=rings[i][rn],c=rings[i+1][r],d=rings[i+1][rn];
    indices.push(a,c,b,b,c,d);
  }
  return {positions:new Float32Array(positions),colors:new Float32Array(colors),indices:new Uint32Array(indices)};
}
