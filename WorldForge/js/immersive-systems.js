import { seededRandom, clamp } from './math.js';

function seedFrom(value='worldforge'){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function point(id,name,type,description,position,color,size,velocity,bounds,details={}){return{id,name,type,description,position:new Float32Array(position),color,size,velocity:velocity?new Float32Array(velocity):null,bounds,details,source:'WorldForge Immersive Systems'};}

export class PatternedWeatherSystem{
  constructor(simulation){this.simulation=simulation;this.patterns=[];this.lastKey='';}
  pattern(record,date=this.simulation.date(),horizon='daily'){
    const dayOfYear=Math.floor((Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(date.getUTCFullYear(),0,0))/86400000);
    const week=Math.floor(dayOfYear/7),month=date.getUTCMonth(),year=date.getUTCFullYear();
    const latitude=Number(record?.lat)||0,water=(record?.biomes||[]).some(x=>/ocean|water|reef|coast|marsh|swamp/i.test(x)),mountain=(record?.biomes||[]).some(x=>/mountain|valley|cavern/i.test(x));
    const seasonalPhase=Math.cos((dayOfYear/365.2422*Math.PI*2)+(latitude<0?Math.PI:0));
    const annualTemp=(water?19:23)-Math.abs(latitude)*.32+(latitude>=0?1:-1)*seasonalPhase*(water?5:13)-(mountain?9:0);
    const dailyRnd=seededRandom(seedFrom(`${record?.id}:d:${year}:${dayOfYear}`)),weeklyRnd=seededRandom(seedFrom(`${record?.id}:w:${year}:${week}`)),monthlyRnd=seededRandom(seedFrom(`${record?.id}:m:${year}:${month}`)),annualRnd=seededRandom(seedFrom(`${record?.id}:y:${year}`));
    const monsoon=Math.max(0,Math.sin((month/12*Math.PI*2)+(record?.lon||0)/180*Math.PI));
    const moisture=clamp((water?.72:.38)+(monthlyRnd()-.5)*.28+monsoon*.22,0,1);
    const pressure=1013+(weeklyRnd()-.5)*38-seasonalPhase*5;
    const stormCycle=(Math.sin((dayOfYear+seedFrom(record?.id)%31)/9.7)+1)/2;
    const intensity=clamp(.08+stormCycle*.42+moisture*.3+(dailyRnd()-.5)*.28,0,1);
    const wind=4+weeklyRnd()*34+intensity*38+(mountain?10:0);
    const precip=clamp((moisture-.35)*135+intensity*42+(dailyRnd()-.5)*18,0,100);
    const temp=annualTemp+(dailyRnd()-.5)*7;
    const kind=temp<-2?(precip>35?'Snow system':'Cold clear interval'):intensity>.77?'Severe storm front':intensity>.55?'Rain and thunder band':moisture>.72?'Fog and low cloud bank':wind>38?'Wind line':'Stable weather interval';
    const duration={daily:1,weekly:7,monthly:30,annual:365}[horizon]||1;
    return{name:record?.weatherName||kind,horizon,durationDays:duration,intensity,temperatureC:temp,windSpeed:wind,precipitationChance:precip,pressureHpa:pressure,seasonalPhase,dayOfYear,week,month:month+1,year,summary:`${record?.climateBelt||'Planetary climate'} · ${kind}. ${Math.round(temp)} °C, ${Math.round(wind)} km/h winds, ${Math.round(precip)}% precipitation, ${Math.round(pressure)} hPa. This value is deterministic for the same world date and location.`};
  }
  worldCells(catalog){
    const groups=new Map();for(const s of catalog?.settlements||[]){if(!groups.has(s.province))groups.set(s.province,[]);groups.get(s.province).push(s);}const cells=[];
    for(const [province,list] of groups){const r=list[0],snap=this.pattern(r,this.simulation.date(),'weekly');cells.push({id:`pattern-weather:${province}`,name:r.weatherName||`${province} weather`,type:'weather system',lat:list.reduce((a,b)=>a+Number(b.lat||0),0)/list.length,lon:list.reduce((a,b)=>a+Number(b.lon||0),0)/list.length,elevation_m:9000+snap.intensity*5000,description:snap.summary,province,intensity:snap.intensity,drift:(seedFrom(province)%2001-1000)/28000,weatherPattern:snap});}return cells;
  }
}

export class MarineEcosystem{
  constructor(model){this.model=model;}
  build(focus,profile={},count=1450){
    const rnd=seededRandom(seedFrom(`${this.model.seed}:${focus.lat}:${focus.lon}:marine`)),objects=[];const names={reef:['coral turtle','reef ray','parrotfish school','sea horse','reef shark','anemone colony','giant clam'],shelf:['silverfin school','kelp grazer','seal','coastal dolphin','squid','sturgeon'],slope:['lantern whale','swordfish','glass shark','ribbon eel','jelly bloom'],abyss:['anglerfish','vampire squid','giant isopod','abyssal ray','siphonophore','vent crab'],trench:['hadal snailfish','amphipod swarm','trench eel','blind octopus','vent tube worm']};
    for(let i=0;i<count;i++){
      const x=(rnd()-.5)*28,z=(rnd()-.5)*28;const normalizedDepth=rnd();let zone=normalizedDepth<.18?'reef':normalizedDepth<.42?'shelf':normalizedDepth<.68?'slope':normalizedDepth<.88?'abyss':'trench';if(!(profile?.biomes||[]).some(b=>/reef/i.test(b.name||b))&&zone==='reef')zone='shelf';
      const y=5.1-normalizedDepth*9.3+(rnd()-.5)*.6,species=names[zone][Math.floor(rnd()*names[zone].length)],school=/school|swarm|bloom|colony/i.test(species);const speed=zone==='trench'?.018:zone==='abyss'?.03:zone==='slope'?.055:.09;
      objects.push(point(`marine:${i}`,`${species[0].toUpperCase()+species.slice(1)} ${i+1}`,'Sea creature',`${species} occupying the ${zone} ecological band between the moving water column and mapped seabed.`,[x,y,z],zone==='reef'?[.35+rnd()*.5,.7+rnd()*.25,.55+rnd()*.35]:zone==='trench'?[.32,.62+rnd()*.25,.86]:[.18+rnd()*.45,.5+rnd()*.4,.68+rnd()*.3],school?4+rnd()*5:7+rnd()*12,[(rnd()-.5)*speed,(rnd()-.5)*speed*.18,(rnd()-.5)*speed],[14,5.2,14],{zone,trophicLevel:1+Math.floor(rnd()*5),depthBand:normalizedDepth,currentAffinity:rnd(),plateContext:normalizedDepth>.75?'oceanic plate / trench':'continental shelf to oceanic slope'}));
    }
    for(let i=0;i<130;i++){const x=(rnd()-.5)*27,z=(rnd()-.5)*27,zone=i<55?'reef':i<95?'shelf':'abyss';objects.push(point(`marine-flora:${i}`,zone==='reef'?`Coral colony ${i+1}`:zone==='shelf'?`Kelp stand ${i+1}`:`Vent ecosystem ${i+1}`,'Marine ecosystem producer',`Stationary ${zone} habitat supporting local food webs.`,[x,zone==='abyss'?-3.3:-2.7+rnd()*1.1,z],zone==='reef'?[.85,.35+rnd()*.4,.55]:zone==='shelf'?[.12,.54+rnd()*.3,.2]:[.65,.78,.82],5+rnd()*10,null,null,{zone,primaryProducer:true}));}
    return objects;
  }
}

export class CaveExplorerSystem{
  constructor(caveData){this.data=caveData;}
  points(){
    const stations=this.data?.stations||[];return stations.map((s,i)=>point(`cave-station:${i}`,s.name||`Cavern chamber ${i+1}`,i===0?'Cave entrance':'Cavern chamber',`Surveyed chamber ${i+1}; width ${s.width||2.4}, height ${s.height||2}.`,[Number(s.x)||0,Number(s.z??s.y)||0,Number(s.y??s.z)||0],[.72,.55,.9],10,null,null,{stationIndex:i,width:s.width,height:s.height,connections:s.connections||[]}));
  }
}

export class VolcanoSystem{
  constructor(simulation){this.simulation=simulation;}
  state(feature){
    const d=this.simulation.date(),day=Math.floor(d.getTime()/86400000),rnd=seededRandom(seedFrom(`${feature?.id||feature?.name}:${Math.floor(day/7)}`));const cycle=7+Math.floor(rnd()*180),phase=((day+seedFrom(feature?.name)%cycle)%cycle)/cycle,activity=clamp(Math.pow(Math.sin(phase*Math.PI),8)*(0.35+rnd()*.65),0,1);return{cycleDays:cycle,phase,activity,erupting:activity>.62,plumeHeightM:activity*18000,lavaFlowKm:activity*12,summary:activity>.82?'Major eruptive pulse':activity>.62?'Active eruption':activity>.3?'Elevated unrest':'Background geothermal activity'};
  }
}
