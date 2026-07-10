(function (global) {
  'use strict';
  const U=global.WeatherCreatorUtils;

  const PLANET_PRESETS={
    earth:{name:'Earth',preset:'earth',radiusKm:6371,gravity:9.81,rotationHours:24,yearDays:365.2422,axialTilt:23.44,pressureBar:1,greenhouse:1,albedo:0.30,oceanPercent:71,magneticField:1,geothermal:1,stellarFlux:1,eccentricity:0.0167},
    arid:{name:'Cinder',preset:'arid',radiusKm:7150,gravity:10.6,rotationHours:29,yearDays:468,axialTilt:11,pressureBar:0.72,greenhouse:1.15,albedo:0.38,oceanPercent:18,magneticField:0.65,geothermal:1.3,stellarFlux:1.08,eccentricity:0.07},
    ocean:{name:'Pelagia',preset:'ocean',radiusKm:6900,gravity:10.2,rotationHours:19,yearDays:302,axialTilt:28,pressureBar:1.7,greenhouse:1.12,albedo:0.25,oceanPercent:92,magneticField:1.4,geothermal:1.1,stellarFlux:0.96,eccentricity:0.02},
    ice:{name:'Cryost',preset:'ice',radiusKm:5800,gravity:8.7,rotationHours:32,yearDays:610,axialTilt:41,pressureBar:0.86,greenhouse:0.82,albedo:0.62,oceanPercent:62,magneticField:0.9,geothermal:1.4,stellarFlux:0.68,eccentricity:0.11},
    tidallyLocked:{name:'Terminus',preset:'tidallyLocked',radiusKm:7600,gravity:12.5,rotationHours:720,yearDays:30,axialTilt:2,pressureBar:2.2,greenhouse:1.2,albedo:0.28,oceanPercent:54,magneticField:0.35,geothermal:1.15,stellarFlux:0.88,eccentricity:0.01},
    volcanic:{name:'Vulcara',preset:'volcanic',radiusKm:6400,gravity:10.1,rotationHours:16,yearDays:280,axialTilt:9,pressureBar:1.35,greenhouse:1.38,albedo:0.22,oceanPercent:38,magneticField:1.8,geothermal:2.6,stellarFlux:1.02,eccentricity:0.04},
    alien:{name:'Viridion',preset:'alien',radiusKm:8300,gravity:13.2,rotationHours:38,yearDays:512,axialTilt:31,pressureBar:1.9,greenhouse:1.25,albedo:0.27,oceanPercent:57,magneticField:2.4,geothermal:1.35,stellarFlux:0.91,eccentricity:0.08}
  };

  class WeatherEngine {
    constructor(geology, planet=PLANET_PRESETS.earth) {
      this.geology=geology;
      this.planet={...planet};
      this.size=geology.size;
      this.simTimeDays=80;
      this.epoch=new Date(Date.UTC(2026,0,1,12,0,0));
      this.fields={};
      ['temperature','pressure','humidity','cloud','precip','snow','windU','windV','windSpeed','storm','dust','aurora','visibility'].forEach(k=>this.fields[k]=new Float32Array(this.size));
      this.observations=[];
      this.events=[];
      this.lastUpdate=-1;
      this.update(true);
    }

    setPlanet(planet) { this.planet={...this.planet,...planet}; this.update(true); }
    getDate(days=this.simTimeDays) { return new Date(this.epoch.getTime()+days*86400000); }
    setDate(date) { this.simTimeDays=(date.getTime()-this.epoch.getTime())/86400000; this.update(true); }
    advanceDays(days) { this.simTimeDays+=days; this.update(); }
    index(lat,lon){return this.geology.index(lat,lon);}

    getAstronomy(timeDays=this.simTimeDays) {
      const p=this.planet;
      const year= Math.max(1,p.yearDays||365);
      const yearPhase=U.mod(timeDays,year)/year;
      const orbitAngle=yearPhase*Math.PI*2;
      const distanceFactor=(1-(p.eccentricity||0)**2)/(1+(p.eccentricity||0)*Math.cos(orbitAngle));
      const declination=U.degToRad(p.axialTilt||0)*Math.sin(orbitAngle-1.38);
      const rotationPhase=U.mod(timeDays*24/Math.max(1,p.rotationHours||24),1);
      return {yearPhase,orbitAngle,distanceFactor,declination,rotationPhase};
    }

    update(force=false) {
      const bucket=Math.floor(this.simTimeDays*24*2)/2;
      if(!force&&bucket===this.lastUpdate) return;
      this.lastUpdate=bucket;
      const p=this.planet,g=this.geology,f=this.fields,astro=this.getAstronomy();
      const time=this.simTimeDays;
      const pressureBase=1013.25*Math.max(0.04,p.pressureBar||1);
      const rotFactor=U.clamp(24/Math.max(4,p.rotationHours||24),0.05,3);
      const greenhouseOffset=33*((p.greenhouse||1)-0.48);
      const globalRadiative=-18+33*(p.greenhouse||1)+(Math.pow(Math.max(0.1,p.stellarFlux||1),0.25)-1)*80;
      const flux=(p.stellarFlux||1)/(astro.distanceFactor*astro.distanceFactor);
      const slowLock=(p.preset==='tidallyLocked'||(p.rotationHours||24)>300);

      for(let i=0;i<this.size;i++) {
        const {lat,lon}=g.coords(i), latR=U.degToRad(lat), lonR=U.degToRad(lon);
        const elev=g.fields.elevation[i], ocean=g.fields.ocean[i], moistGround=g.fields.moisture[i], albedo=U.clamp(g.fields.albedo[i]*(p.albedo||.3)/.3,0.03,.92);
        const rough=g.fields.roughness[i], volcano=g.fields.volcanic[i], geothermal=g.fields.geothermal[i];
        let hourAngle;
        if(slowLock) hourAngle=lonR;
        else hourAngle=lonR+astro.rotationPhase*Math.PI*2-Math.PI;
        const cosZenith=Math.sin(latR)*Math.sin(astro.declination)+Math.cos(latR)*Math.cos(astro.declination)*Math.cos(hourAngle);
        const daylight=U.clamp(cosZenith,0,1);
        const dailyMean=Math.max(0.05, Math.cos(latR-astro.declination)*0.58);
        const oceanModeration=U.lerp(1,0.28,ocean);
        const seasonWave=Math.sin(astro.orbitAngle-1.38)*(lat>=0?1:-1);
        const seasonal=seasonWave*(8+Math.abs(lat)*0.16)*(1-ocean*.67)*Math.sin(U.degToRad(Math.min(90,Math.abs(lat))));
        const diurnal=(daylight-dailyMean)*18*oceanModeration*U.clamp(24/Math.max(8,p.rotationHours||24),.25,1.8);
        const latitudeCooling=7-0.18*Math.abs(lat)-0.0008*Math.abs(lat)**2;
        const lapse=-(elev>0?elev:0)*0.0061;
        const iceCooling=-g.fields.ice[i]*17;
        const radiative=(flux-1)*34-(albedo-(p.albedo||.3))*28;
        const synoptic=(U.fbm((lon+time*8)/42,(lat+time*1.7)/28,731,4)-.5)*8;
        const weekly=(U.noise2(lon/55+time/6.5,lat/38,900)-.5)*6;
        let temp=globalRadiative+latitudeCooling+seasonal+diurnal+lapse+iceCooling+radiative+synoptic+weekly+geothermal*(p.geothermal||1)*2.6;
        if(slowLock) temp+= (daylight-.35)*58*oceanModeration;
        if(p.preset==='arid') temp+=7;
        if(p.preset==='ice') temp-=13;
        if(p.preset==='volcanic') temp+=volcano*4-greenhouseOffset*.02;
        temp=U.clamp(temp,-105,82);

        const planetaryWave=Math.sin(lonR*3+time*.16+Math.sin(latR*4))*7 + Math.sin(latR*6-time*.09)*4;
        const thermalLow=-(temp-(globalRadiative+latitudeCooling))*(1-ocean*.35)*1.8;
        const altitudePressure=pressureBase*Math.exp(-Math.max(0,elev)/8500);
        let pressure=altitudePressure+planetaryWave+thermalLow+(U.fbm(lon/32+time*.08,lat/24,22,4)-.5)*16;
        pressure=U.clamp(pressure,pressureBase*.35,pressureBase*1.18);

        const evap=U.clamp((temp+20)/55,0,1)*(0.25+ocean*.75);
        const dryBelt=Math.exp(-Math.pow((Math.abs(lat)-28)/11,2))*0.34;
        const humidNoise=(U.fbm((lon-time*2.1)/24,(lat+time*.3)/17,133,5)-.5)*.34;
        let humidity=U.clamp(0.16+moistGround*.56+evap*.38-dryBelt+humidNoise,0.015,1);
        if(temp<-25) humidity*=.68;
        if(p.preset==='arid') humidity*=.6;
        humidity=U.clamp(humidity*(p.humidityMultiplier||1),0.01,1);

        const hadley= Math.sin(latR*3)*17*rotFactor;
        const polarJet=Math.exp(-Math.pow((Math.abs(lat)-50)/13,2))*34*rotFactor*(lat>=0?1:1);
        const trade=-Math.cos(latR)*12*rotFactor*(Math.abs(lat)<32?1:0);
        const pGradX=(U.noise2((lon+2+time*1.5)/29,lat/24,401)-U.noise2((lon-2+time*1.5)/29,lat/24,401))*35;
        const pGradY=(U.noise2((lon+time*1.5)/29,(lat+2)/24,401)-U.noise2((lon+time*1.5)/29,(lat-2)/24,401))*28;
        const coriolis=Math.max(.12,Math.abs(Math.sin(latR))*rotFactor);
        let windU=(hadley+polarJet+trade+pGradY/coriolis)*(1-rough*.34);
        let windV=(-pGradX/coriolis+Math.sin(lonR*2+time*.13)*4)*(1-rough*.28);
        if(slowLock){windU+=-Math.sin(lonR)*23;windV+=-Math.sin(latR)*8;}
        const windSpeed=U.clamp(Math.hypot(windU,windV),0,120);

        const uplift=U.clamp(rough*windSpeed/45 + Math.max(0,elev)/9000,0,1);
        const convergence=U.clamp((1015*(p.pressureBar||1)-pressure)/35,0,1);
        let cloud=U.clamp((humidity-.46)*1.65+uplift*.28+convergence*.35+(U.noise2(lon/18+time*.55,lat/13,17)-.5)*.28,0,1);
        const convective=U.clamp((temp-18)/24,0,1)*humidity*convergence;
        let precip=U.clamp((cloud-.56)*13 + convective*7 + uplift*humidity*3.2,0,28);
        if(ocean>.5&&cloud<.6) precip*=.65;
        const snow=temp<1?precip*U.clamp((2-temp)/16,.15,1):0;
        if(snow>0) precip*=.24;
        const instability=U.clamp((temp+8)/45,0,1)*humidity;
        const shear=U.clamp(Math.abs(windU-windV)/48,0,1);
        let storm=U.clamp((convergence*.42+instability*.32+shear*.25+cloud*.18-.32)*(p.storminess||1),0,1);
        if(Math.abs(lat)<7) storm*=.45;
        const dust=U.clamp(((1-moistGround)*(1-ocean)*windSpeed/45*(temp>5?1:.3)+volcano*.25)*(p.aerosol||1),0,1);
        const magnetic=(p.magneticField||1);
        const solarPulse=.55+.45*Math.sin(time*.071)+.18*Math.sin(time*.39);
        const aurora=U.clamp(U.smoothstep(54,78,Math.abs(lat))*magnetic*.62*solarPulse*(1-cloud*.4),0,1);
        const visibility=U.clamp(50-cloud*19-precip*1.4-dust*32-humidity*5,0.2,50);

        f.temperature[i]=temp;f.pressure[i]=pressure;f.humidity[i]=humidity;f.cloud[i]=cloud;f.precip[i]=precip;f.snow[i]=snow;
        f.windU[i]=windU;f.windV[i]=windV;f.windSpeed[i]=windSpeed;f.storm[i]=storm;f.dust[i]=dust;f.aurora[i]=aurora;f.visibility[i]=visibility;
      }
      this.applyObservations();
      this.events=this.detectEvents();
    }

    applyObservations() {
      if(!this.observations.length) return;
      const f=this.fields;
      for(const obs of this.observations) {
        const center=this.geology.index(obs.lat,obs.lon), c=this.geology.coords(center);
        for(let i=0;i<this.size;i++) {
          const p=this.geology.coords(i),dLat=p.lat-c.lat,dLon=U.wrapLon(p.lon-c.lon)*Math.cos(U.degToRad(c.lat));
          const d=Math.hypot(dLat,dLon); if(d>obs.radiusDeg) continue;
          const w=Math.exp(-d*d/(obs.radiusDeg*obs.radiusDeg*.35))*obs.weight;
          for(const [key,value] of Object.entries(obs.values)) if(f[key]&&Number.isFinite(value)) f[key][i]=U.lerp(f[key][i],value,w);
        }
      }
    }

    assimilateGeoJSON(data) {
      const features=data.type==='FeatureCollection'?data.features:(data.type==='Feature'?[data]:[]);
      let count=0;
      for(const ft of features) {
        if(ft.geometry?.type!=='Point') continue;
        const [lon,lat]=ft.geometry.coordinates,p=ft.properties||{},values={};
        const aliases={temperature:['temperatureC','temperature','tempC'],pressure:['pressureHpa','pressure'],humidity:['humidity'],cloud:['cloud','cloudCover'],precip:['precipMmHr','precipitation'],snow:['snowMmHr','snow'],windU:['windU'],windV:['windV'],storm:['stormRisk']};
        for(const [k,names] of Object.entries(aliases)) for(const n of names) if(p[n]!==undefined){values[k]=Number(p[n]);break;}
        if(values.humidity>1) values.humidity/=100;
        if(values.cloud>1) values.cloud/=100;
        this.observations.push({lat,lon,values,radiusDeg:Number(p.radiusDeg||8),weight:U.clamp(Number(p.weight||.82),0,1)});count++;
      }
      this.update(true); return count;
    }

    clearObservations(){this.observations=[];this.update(true);}

    sample(lat,lon) {
      const i=this.index(lat,lon),o={index:i,lat,lon,date:this.getDate(),geology:this.geology.sample(lat,lon)};
      for(const k of Object.keys(this.fields)) o[k]=this.fields[k][i];
      o.condition=this.conditionFrom(o);
      return o;
    }

    conditionFrom(o) {
      if(o.storm>.72&&o.snow>0.5)return 'blizzard';
      if(o.storm>.72)return 'severe storm';
      if(o.dust>.62)return 'dust storm';
      if(o.snow>1)return 'snow';
      if(o.precip>5)return 'heavy rain';
      if(o.precip>.2)return 'rain';
      if(o.cloud>.75)return 'overcast';
      if(o.cloud>.38)return 'partly cloudy';
      if(o.aurora>.65)return 'clear with aurora';
      return 'clear';
    }

    detectEvents() {
      const candidates=[],events=[],f=this.fields,g=this.geology;
      for(let y=1;y<g.height-1;y+=2) for(let x=0;x<g.width;x+=2) {
        const i=y*g.width+x,p=g.coords(i);let type=null,severity=0;
        if(f.storm[i]>.46){type=f.snow[i]>.6?'Blizzard':'Cyclonic storm';severity=U.clamp((f.storm[i]-.35)/.55,0,1);}
        else if(f.dust[i]>.38){type='Dust / ash outbreak';severity=U.clamp((f.dust[i]-.28)/.65,0,1);}
        else if(f.precip[i]>5.5){type='Extreme precipitation';severity=U.clamp(f.precip[i]/18,0,1);}
        else if(f.aurora[i]>.12&&f.cloud[i]<.78){type='Auroral oval';severity=U.clamp(f.aurora[i]/.75,0,1);}
        if(type)candidates.push({id:`${type}-${x}-${y}`,type,severity,lat:p.lat,lon:p.lon,temperature:f.temperature[i],wind:f.windSpeed[i]});
      }
      candidates.sort((a,b)=>b.severity-a.severity);
      for(const c of candidates){
        const near=events.some(e=>Math.hypot(e.lat-c.lat,U.wrapLon(e.lon-c.lon)*Math.cos(U.degToRad(c.lat)))<13);
        if(!near)events.push(c);if(events.length>=18)break;
      }
      return events;
    }

    sampleAtTime(lat,lon,timeDays) {
      const p=this.planet,g=this.geology,i=this.index(lat,lon),geo=g.sample(lat,lon),astro=this.getAstronomy(timeDays);
      const latR=U.degToRad(lat),lonR=U.degToRad(lon),ocean=geo.ocean,elev=geo.elevation,rough=geo.roughness;
      const slowLock=p.preset==='tidallyLocked'||(p.rotationHours||24)>300;
      const rotationPhase=U.mod(timeDays*24/Math.max(1,p.rotationHours||24),1);
      const hourAngle=slowLock?lonR:lonR+rotationPhase*Math.PI*2-Math.PI;
      const cosZenith=Math.sin(latR)*Math.sin(astro.declination)+Math.cos(latR)*Math.cos(astro.declination)*Math.cos(hourAngle);
      const daylight=U.clamp(cosZenith,0,1),dailyMean=Math.max(.05,Math.cos(latR-astro.declination)*.58);
      const seasonWave=Math.sin(astro.orbitAngle-1.38)*(lat>=0?1:-1);
      const seasonal=seasonWave*(8+Math.abs(lat)*.16)*(1-ocean*.67)*Math.sin(U.degToRad(Math.min(90,Math.abs(lat))));
      const diurnal=(daylight-dailyMean)*18*U.lerp(1,.28,ocean)*U.clamp(24/Math.max(8,p.rotationHours||24),.25,1.8);
      const flux=(p.stellarFlux||1)/(astro.distanceFactor*astro.distanceFactor);
      const globalRadiative=-18+33*(p.greenhouse||1)+(Math.pow(Math.max(.1,p.stellarFlux||1),.25)-1)*80;
      const latCooling=7-.18*Math.abs(lat)-.0008*Math.abs(lat)**2;
      const weatherNoise=(U.fbm((lon+timeDays*8)/42,(lat+timeDays*1.7)/28,731,4)-.5)*8+(U.noise2(lon/55+timeDays/6.5,lat/38,900)-.5)*6;
      let temperature=globalRadiative+latCooling+seasonal+diurnal-Math.max(0,elev)*.0061+(flux-1)*34-(geo.albedo-(p.albedo||.3))*28-geo.ice*17+geo.geothermal*(p.geothermal||1)*2.6+weatherNoise;
      if(slowLock)temperature+=(daylight-.35)*58*U.lerp(1,.28,ocean);
      if(p.preset==='arid')temperature+=7;if(p.preset==='ice')temperature-=13;
      temperature=U.clamp(temperature,-105,82);
      const basePressure=1013.25*Math.max(.04,p.pressureBar||1),wave=Math.sin(lonR*3+timeDays*.16+Math.sin(latR*4))*7+Math.sin(latR*6-timeDays*.09)*4;
      const pressure=U.clamp(basePressure*Math.exp(-Math.max(0,elev)/8500)+wave-(temperature-globalRadiative-latCooling)*1.3,basePressure*.35,basePressure*1.18);
      const evap=U.clamp((temperature+20)/55,0,1)*(.25+ocean*.75),dry=Math.exp(-Math.pow((Math.abs(lat)-28)/11,2))*.34;
      let humidity=U.clamp(.16+geo.moisture*.56+evap*.38-dry+(U.fbm((lon-timeDays*2.1)/24,(lat+timeDays*.3)/17,133,5)-.5)*.34,.015,1)*(p.humidityMultiplier||1);humidity=U.clamp(humidity,.01,1);
      const rot=U.clamp(24/Math.max(4,p.rotationHours||24),.05,3),hadley=Math.sin(latR*3)*17*rot,jet=Math.exp(-Math.pow((Math.abs(lat)-50)/13,2))*34*rot,trade=-Math.cos(latR)*12*rot*(Math.abs(lat)<32?1:0);
      const windU=(hadley+jet+trade+(U.noise2((lon+timeDays*1.5)/29,(lat+2)/24,401)-U.noise2((lon+timeDays*1.5)/29,(lat-2)/24,401))*34)*(1-rough*.34);
      const windV=((U.noise2((lon+2+timeDays*1.5)/29,lat/24,401)-U.noise2((lon-2+timeDays*1.5)/29,lat/24,401))*-30+Math.sin(lonR*2+timeDays*.13)*4)*(1-rough*.28);
      const windSpeed=U.clamp(Math.hypot(windU,windV),0,120),convergence=U.clamp((1015*(p.pressureBar||1)-pressure)/35,0,1),uplift=U.clamp(rough*windSpeed/45+Math.max(0,elev)/9000,0,1);
      const cloud=U.clamp((humidity-.46)*1.65+uplift*.28+convergence*.35+(U.noise2(lon/18+timeDays*.55,lat/13,17)-.5)*.28,0,1);
      const convective=U.clamp((temperature-18)/24,0,1)*humidity*convergence;
      let precip=U.clamp((cloud-.56)*13+convective*7+uplift*humidity*3.2,0,28),snow=temperature<1?precip*U.clamp((2-temperature)/16,.15,1):0;if(snow>0)precip*=.24;
      const storm=U.clamp((convergence*.42+U.clamp((temperature+8)/45,0,1)*humidity*.32+U.clamp(Math.abs(windU-windV)/48,0,1)*.25+cloud*.18-.32)*(p.storminess||1),0,1);
      const aurora=U.clamp(U.smoothstep(54,78,Math.abs(lat))*(p.magneticField||1)*.62*(.55+.45*Math.sin(timeDays*.071))*(1-cloud*.4),0,1);
      const dust=U.clamp(((1-geo.moisture)*(1-ocean)*windSpeed/45*(temperature>5?1:.3)+geo.volcanic*.25)*(p.aerosol||1),0,1);
      const visibility=U.clamp(50-cloud*19-precip*1.4-dust*32-humidity*5,.2,50);
      const out={lat,lon,date:this.getDate(timeDays),geology:geo,temperature,pressure,humidity,cloud,precip,snow,windU,windV,windSpeed,storm,dust,aurora,visibility};out.condition=this.conditionFrom(out);return out;
    }

    forecastAt(lat,lon,period='daily') {
      const configs={daily:{count:24,step:1/24,label:(d,i)=>`${String(d.getUTCHours()).padStart(2,'0')}:00`},weekly:{count:7,step:1,label:d=>d.toLocaleDateString(undefined,{weekday:'short'})},monthly:{count:30,step:1,label:(d,i)=>`${i+1}`},annual:{count:12,step:Math.max(1,this.planet.yearDays/12),label:d=>d.toLocaleDateString(undefined,{month:'short'})}};
      const cfg=configs[period]||configs.daily,start=this.simTimeDays,points=[];
      for(let i=0;i<cfg.count;i++) {
        const t=start+i*cfg.step,s=this.sampleAtTime(lat,lon,t),d=this.getDate(t);
        points.push({date:d.toISOString(),label:cfg.label(d,i),temperature:s.temperature,pressure:s.pressure,humidity:s.humidity,cloud:s.cloud,precip:s.precip,snow:s.snow,windSpeed:s.windSpeed,storm:s.storm,condition:s.condition});
      }
      return {period,lat,lon,generatedAt:this.getDate().toISOString(),points};
    }

    globalStats() {
      const f=this.fields,g=this.geology; let t=0,p=0,h=0,c=0,r=0,w=0,s=0,total=0;
      for(let i=0;i<this.size;i++){const lat=g.coords(i).lat,weight=Math.max(.001,Math.cos(U.degToRad(lat)));total+=weight;t+=f.temperature[i]*weight;p+=f.pressure[i]*weight;h+=f.humidity[i]*weight;c+=f.cloud[i]*weight;r+=f.precip[i]*weight;w+=f.windSpeed[i]*weight;s+=f.storm[i]*weight;}
      return {temperature:t/total,pressure:p/total,humidity:h/total,cloud:c/total,precip:r/total,windSpeed:w/total,storm:s/total,eventCount:this.events.length};
    }

    exportSnapshot(stride=3) {
      const features=[];
      for(let y=0;y<this.geology.height;y+=stride)for(let x=0;x<this.geology.width;x+=stride){
        const i=y*this.geology.width+x,p=this.geology.coords(i);
        features.push({type:'Feature',properties:{temperatureC:+this.fields.temperature[i].toFixed(2),pressureHpa:+this.fields.pressure[i].toFixed(2),humidity:+this.fields.humidity[i].toFixed(3),cloud:+this.fields.cloud[i].toFixed(3),precipMmHr:+this.fields.precip[i].toFixed(2),snowMmHr:+this.fields.snow[i].toFixed(2),windU:+this.fields.windU[i].toFixed(2),windV:+this.fields.windV[i].toFixed(2),stormRisk:+this.fields.storm[i].toFixed(3),condition:this.conditionFrom(Object.fromEntries(Object.keys(this.fields).map(k=>[k,this.fields[k][i]])))},geometry:{type:'Point',coordinates:[p.lon,p.lat]}});
      }
      return {type:'FeatureCollection',name:`${this.planet.name} weather snapshot`,simulationDate:this.getDate().toISOString(),features};
    }
  }

  global.WeatherEngine=WeatherEngine;
  global.PLANET_PRESETS=PLANET_PRESETS;
})(window);
