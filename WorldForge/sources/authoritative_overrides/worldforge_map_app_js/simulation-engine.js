import { seededRandom } from './math.js';

function seedFrom(value='sim'){
  let h=0;for(const ch of String(value))h=(Math.imul(h,31)+ch.charCodeAt(0))>>>0;return h;
}
export class WorldSimulation {
  constructor(){
    this.worldMinutes=0;this.speed=1;this.running=true;this.startedAt=new Date('2026-01-01T00:00:00Z');this.lastNow=performance.now();
  }
  setSpeed(v){this.speed=Math.max(0,Number(v)||0);this.running=this.speed>0;}
  tick(now=performance.now()){
    const dt=Math.min(1,(now-this.lastNow)/1000);this.lastNow=now;if(this.running)this.worldMinutes+=dt*this.speed;return dt;
  }
  date(){return new Date(this.startedAt.getTime()+this.worldMinutes*60000);}
  label(){return this.date().toISOString().replace('T',' ').slice(0,16)+' UTC';}
  snapshot(record,horizon='daily'){
    const day=Math.floor(this.worldMinutes/1440),rnd=seededRandom(seedFrom(`${record?.id||'world'}:${day}:${horizon}`));
    const water=(record?.biomes||[]).some(x=>/ocean|water|reef|marsh|swamp|beach/i.test(x));
    const mountain=(record?.biomes||[]).some(x=>/mountain|cavern|valley/i.test(x));
    const names=[record?.weatherName||'Regional weather','Clear interval','Wind line','Rain band','Thunder cell','Fog bank'];
    const intensity=.18+rnd()*.8,temperature=(water?18:mountain?9:22)+(rnd()-.5)*14,wind=4+rnd()*54,precip=Math.max(0,(intensity-.35)*120);
    const duration={daily:1,weekly:7,monthly:30,annual:365}[horizon]||1;
    return {name:names[Math.floor(rnd()*names.length)],horizon,durationDays:duration,intensity,temperatureC:temperature,windSpeed:wind,precipitationChance:Math.min(100,precip),summary:`${record?.climateBelt||'Generated planetary climate'}; ${Math.round(temperature)} °C, ${Math.round(wind)} km/h winds, ${Math.round(Math.min(100,precip))}% precipitation chance across the ${horizon} model.`};
  }
  buildWorldWeather(catalog){
    const groups=new Map();
    for(const s of catalog.settlements){if(!groups.has(s.province))groups.set(s.province,[]);groups.get(s.province).push(s);}
    const out=[];
    for(const [province,list] of groups){
      const lat=list.reduce((a,b)=>a+Number(b.lat||0),0)/list.length,lon=list.reduce((a,b)=>a+Number(b.lon||0),0)/list.length;
      const r=list[0],snap=this.snapshot(r,'weekly');
      out.push({id:`weather:${province}`,name:r.weatherName||`${province} weather`,type:'weather system',lat,lon,elevation_m:11000,description:snap.summary,province,intensity:snap.intensity,drift:(seedFrom(province)%1000/1000-.5)*.025});
    }
    return out;
  }
  updateWeatherFeatures(features,dt){
    if(!features?.length||!this.speed)return false;
    for(const f of features){f.lon=((Number(f.lon)+f.drift*dt*Math.sqrt(this.speed)+540)%360)-180;f.lat=Math.max(-82,Math.min(82,Number(f.lat)+Math.sin(this.worldMinutes/8000+seedFrom(f.id))*dt*.002));}
    return true;
  }
  lifePayload(record,npcData,selectedObject){
    return {schema:'worldforge.lifesimulator.sync.v2',generatedAtUtc:new Date().toISOString(),simulatedWorldTimeUtc:this.date().toISOString(),settlement:record,npcCount:npcData?.npcCount||npcData?.npcs?.length||0,npcs:npcData?.npcs||[],selectedObject:selectedObject?{id:selectedObject.id,name:selectedObject.name,type:selectedObject.type,details:selectedObject.details}:null};
  }
}
