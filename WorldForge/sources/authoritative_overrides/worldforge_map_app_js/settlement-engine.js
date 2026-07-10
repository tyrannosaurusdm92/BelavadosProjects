import { biomeCatalog, makeLifePoints, makeLocalTerrain } from './procedural.js';
import { seededRandom } from './math.js';

const WATER_RE = /ocean|underwater|reef|beach|water|marsh|swamp|floating|coast|river|lake|delta/i;
const CAVE_RE = /cave|cavern|deep mountain|subsurface|underworld/i;

function seedFrom(value='worldforge'){
  let h=2166136261;
  for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
  return h>>>0;
}
function colorForBiome(name){
  return biomeCatalog.find(b=>b.name===name)?.color || [.38,.48,.31];
}
function tint(c,scale=1,add=0){return c.map(v=>Math.max(0,Math.min(1,v*scale+add)));}
function pushBox(out,x,y,z,w,h,d,color){
  const i=out.positions.length/3;
  const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  out.positions.push(x0,y0,z0,x1,y0,z0,x1,y1,z0,x0,y1,z0, x0,y0,z1,x1,y0,z1,x1,y1,z1,x0,y1,z1);
  for(let n=0;n<8;n++)out.colors.push(...color);
  out.indices.push(
    i,i+1,i+2,i,i+2,i+3, i+4,i+6,i+5,i+4,i+7,i+6,
    i,i+4,i+5,i,i+5,i+1, i+3,i+2,i+6,i+3,i+6,i+7,
    i+1,i+5,i+6,i+1,i+6,i+2, i,i+3,i+7,i,i+7,i+4
  );
}
function finalizeMesh(out){return {positions:new Float32Array(out.positions),colors:new Float32Array(out.colors),indices:new Uint32Array(out.indices)};}
function typeCount(type){
  const t=String(type).toLowerCase();
  if(t.includes('capital'))return 190;
  if(t.includes('city'))return 145;
  if(t.includes('town'))return 92;
  if(t.includes('village'))return 52;
  return 70;
}
function environmentFor(record){
  const biomeText=(record.biomes||[]).join(' ');
  const anchor=String(record.anchorMode||'');
  const pin=String(record.pinPlacement||'');
  if(/underwater|subsurface.*water|deep-ocean/i.test(`${anchor} ${pin} ${biomeText}`))return 'underwater';
  if(CAVE_RE.test(`${anchor} ${pin} ${biomeText} ${record.terrainRole||''}`))return 'cave';
  if(/floating/i.test(`${pin} ${biomeText}`))return 'floating';
  return 'surface';
}
function makeRoads(out,baseY,color){
  for(let i=-2;i<=2;i++){
    pushBox(out,i*5.2,baseY-.03,0,1.0,.05,27,color);
    pushBox(out,0,baseY-.025,i*5.2,27,.05,1.0,color);
  }
}
function makeSettlementStructures(record,profile){
  const rnd=seededRandom(seedFrom(record.id));
  const env=environmentFor(record),primary=record.primaryBiome||profile?.biomes?.[0]?.name||'Grassland';
  const base=colorForBiome(primary),out={positions:[],colors:[],indices:[]};
  const count=typeCount(record.type),baseY=env==='underwater'?-2.7:env==='floating'?.35:env==='cave'?-.25:.05;
  makeRoads(out,baseY,tint(base,.35,.08));
  const districts=Math.max(4,Math.round(Math.sqrt(count)/2));
  let placed=0;
  for(let ring=1;placed<count&&ring<districts+5;ring++){
    const spots=Math.max(8,ring*10);
    for(let j=0;j<spots&&placed<count;j++){
      if(rnd()<.12)continue;
      const a=j/spots*Math.PI*2+(rnd()-.5)*.12;
      const r=ring*1.55+rnd()*1.1;
      const x=Math.cos(a)*r,z=Math.sin(a)*r;
      if(Math.abs(x)<1.3||Math.abs(z)<1.3)continue;
      let w=.35+rnd()*.65,d=.35+rnd()*.65,h=.35+rnd()*1.8;
      if(/treehouse|treetops/i.test(primary)){w*=.75;d*=.75;h=1.3+rnd()*2.8;}
      if(env==='underwater'){w*=1.25;d*=1.25;h=.5+rnd()*1.3;}
      if(env==='cave'){w*=1.4;d*=1.4;h=.45+rnd()*1.05;}
      const y=baseY+(env==='floating'?(rnd()-.5)*.08:(env==='surface'?Math.max(0,Math.sin(x*.22)*.11+Math.cos(z*.2)*.08):0));
      const col=tint(base,.72+rnd()*.38,.02+rnd()*.04);
      pushBox(out,x,y,z,w,h,d,col);placed++;
      if(/treehouse|treetops/i.test(primary))pushBox(out,x,y-.6,z,.12,.7,.12,tint(base,.45,0));
    }
  }
  // Civic center, transit hubs, and vertical landmark.
  pushBox(out,0,baseY,0,2.4,env==='underwater'?1.5:2.8,2.4,tint(base,1.25,.08));
  pushBox(out,3.7,baseY,3.7,2.8,.4,1.7,[.22,.34,.42]);
  pushBox(out,-3.7,baseY,-3.7,2.8,.55,1.7,[.35,.28,.18]);
  if((record.transportation||[]).some(x=>/skyship/i.test(x)))pushBox(out,-4.8,baseY,4.6,2.8,.22,2.8,[.26,.54,.64]);
  if((record.transportation||[]).some(x=>/portal/i.test(x)))pushBox(out,4.9,baseY,-4.7,1.7,3.4,.45,[.57,.28,.82]);
  if(env==='floating'){
    for(let i=-2;i<=2;i++)pushBox(out,i*4.7,baseY-.18,(i%2)*4.5,4.1,.18,3.8,[.18,.32,.38]);
  }
  return finalizeMesh(out);
}
function objectRecord({id,name,type,description,position,color,size=9,velocity=null,bounds=null,source=null,details={}}){
  return {id,name,type,description,position:new Float32Array(position),color,size,velocity:velocity?new Float32Array(velocity):null,bounds,source,details};
}
function makeSettlementObjects(record,npcData,weatherSnapshot){
  const rnd=seededRandom(seedFrom(`${record.id}:objects`)),env=environmentFor(record),objects=[];
  const baseY=env==='underwater'?-1.3:env==='floating'?1.1:env==='cave'?.45:.55;
  const npcs=(npcData?.npcs||[]).slice(0,90);
  npcs.forEach((npc,i)=>{
    const a=rnd()*Math.PI*2,r=1.5+rnd()*12;
    objects.push(objectRecord({
      id:npc.id||`${record.id}:npc:${i}`,name:npc.name||`Resident ${i+1}`,type:'NPC / resident',
      description:[npc.race,npc.role,npc.sourceType].filter(Boolean).join(' · ')||'LifeSimulator resident',
      position:[Math.cos(a)*r,baseY,Math.sin(a)*r],color:[.52+.35*rnd(),.72+.2*rnd(),.35+.45*rnd()],size:7+rnd()*4,
      velocity:[(rnd()-.5)*.035,0,(rnd()-.5)*.035],bounds:[14,4,14],source:'canonical settlement NPC file',
      details:{race:npc.race,genderIdentity:npc.genderIdentity,pronounSet:npc.pronounSet,trackable:npc.trackable,homeLocation:npc.homeLocation,sourceType:npc.sourceType}
    }));
  });
  if(env==='underwater'||env==='floating'||WATER_RE.test((record.biomes||[]).join(' '))){
    const species=['reef ray','lantern whale','silverfin school','glass shark','moon jelly','ribbon eel','coral turtle','deep-sea squid'];
    for(let i=0;i<48;i++){
      const sp=species[i%species.length],under=env==='underwater';
      objects.push(objectRecord({id:`${record.id}:creature:${i}`,name:`${sp[0].toUpperCase()+sp.slice(1)} ${i+1}`,type:'Sea creature',description:`A simulated ${sp} moving with local currents.`,position:[(rnd()-.5)*27,under?-2.5+rnd()*7:-.6+rnd()*2.2,(rnd()-.5)*27],color:[.18+rnd()*.5,.55+rnd()*.38,.64+rnd()*.34],size:8+rnd()*10,velocity:[(rnd()-.5)*.12,(rnd()-.5)*.025,(rnd()-.5)*.12],bounds:[14,under?5:2.4,14],source:'Abyssal Atelier integration'}));
    }
  }
  const weatherCount=weatherSnapshot?.intensity>0.45?24:12;
  for(let i=0;i<weatherCount;i++)objects.push(objectRecord({id:`${record.id}:weather:${i}`,name:`${weatherSnapshot?.name||record.weatherName||'Weather'} cell ${i+1}`,type:'Weather system',description:weatherSnapshot?.summary||record.climateBelt||'Animated local weather cell.',position:[(rnd()-.5)*25,5+rnd()*3,(rnd()-.5)*25],color:[.67+rnd()*.2,.78+rnd()*.18,.92+rnd()*.08],size:13+rnd()*15,velocity:[.015+weatherSnapshot?.windSpeed*0.0006,0,(rnd()-.5)*.02],bounds:[15,10,15],source:'Planetary 3D Weather integration'}));
  const landform=record.landformAtlas||{};
  const volcano=landform['Volcano / vent / caldera'];
  if(volcano)objects.push(objectRecord({id:`${record.id}:volcano`,name:volcano,type:'Volcano / geothermal feature',description:`Canonical province landform associated with ${record.province}.`,position:[7,.8,-7],color:[1,.22,.04],size:18,source:'canonical topography weather data',details:{terrainRole:record.terrainRole,terrainFact:record.terrainFact}}));
  objects.push(objectRecord({id:`${record.id}:civic`,name:`${record.name} civic center`,type:'Settlement landmark',description:`Central focus point for ${record.name}.`,position:[0,baseY+2.9,0],color:[1,.84,.28],size:17,source:'WorldForge procedural settlement mesh'}));
  return objects;
}

export function profileFromSettlement(record){
  return {name:`${record.name} — ${record.province}`,settlementId:record.id,biomes:(record.biomes||[record.primaryBiome||'Grassland']).slice(0,3).map(name=>({name})),blending:{terrainRule:record.terrainRule,waterAtlas:record.waterAtlas,anchorMode:record.anchorMode}};
}
export function settlementEnvironment(record){return environmentFor(record);}
export function buildSettlementScene(record,npcData,model,weatherSnapshot){
  const profile=profileFromSettlement(record),focus={lat:Number(record.lat)||0,lon:Number(record.lon)||0},environment=environmentFor(record);
  const terrainMode=environment==='underwater'?'underwater':'local';
  const terrain=makeLocalTerrain(model,focus,terrainMode,profile,144);
  terrain.hasWater=environment==='underwater'||environment==='floating'||WATER_RE.test((record.biomes||[]).join(' '));
  const life=makeLifePoints(model,focus,terrainMode,profile,environment==='underwater'?1100:760);
  const structures=makeSettlementStructures(record,profile);
  const objects=makeSettlementObjects(record,npcData,weatherSnapshot);
  return {profile,focus,environment,terrain,life,structures,objects,waterLevel:environment==='underwater'?5.4:(terrain.hasWater?0:-999)};
}
