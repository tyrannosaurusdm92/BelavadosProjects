(function (global) {
  'use strict';
  const U = global.WeatherCreatorUtils;

  const FIELD_DEFAULTS = {
    elevation: 0,
    ocean: 0,
    moisture: 0.5,
    roughness: 0.35,
    albedo: 0.3,
    volcanic: 0,
    geothermal: 0.1,
    ice: 0
  };

  class GeologyGrid {
    constructor(width = 180, height = 90) {
      this.width = width;
      this.height = height;
      this.size = width * height;
      this.fields = {};
      Object.keys(FIELD_DEFAULTS).forEach(k => {
        this.fields[k] = new Float32Array(this.size);
        this.fields[k].fill(FIELD_DEFAULTS[k]);
      });
      this.biome = new Array(this.size).fill('unknown');
      this.sourceName = 'Procedural Earth';
      this.seed = 1337;
    }

    index(lat, lon) { return U.latLonToIndex(lat, lon, this.width, this.height); }
    coords(i) { return U.indexToLatLon(i, this.width, this.height); }
    get(lat, lon, field) { return this.fields[field][this.index(lat, lon)]; }
    set(lat, lon, field, value) { this.fields[field][this.index(lat, lon)] = value; }
    sample(lat, lon) {
      const i = this.index(lat, lon);
      const o = { index: i, lat, lon, biome: this.biome[i] };
      for (const key of Object.keys(this.fields)) o[key] = this.fields[key][i];
      return o;
    }

    async generatePreset(preset, planet, maskSource) {
      this.seed = Math.floor(Math.random() * 900000) + 1000;
      if (preset === 'earth') {
        await this.generateEarth(maskSource, planet);
      } else {
        this.generateProcedural(preset, planet);
      }
      return this;
    }

    async generateEarth(maskSource, planet) {
      let pixels = null;
      try {
        const img = await U.loadImage(maskSource);
        const c = document.createElement('canvas');
        c.width = this.width; c.height = this.height;
        const ctx = c.getContext('2d', {willReadFrequently:true});
        ctx.drawImage(img, 0, 0, this.width, this.height);
        pixels = ctx.getImageData(0, 0, this.width, this.height).data;
      } catch (err) {
        console.warn('Earth mask failed to load; using procedural continents.', err);
      }
      const oceanTarget = (planet.oceanPercent ?? 71) / 100;
      for (let i = 0; i < this.size; i++) {
        const {lat, lon} = this.coords(i);
        const x = (lon + 180) / 360, y = (90 - lat) / 180;
        let land;
        if (pixels) {
          const p = i * 4;
          const lum = (pixels[p] + pixels[p+1] + pixels[p+2]) / 765;
          land = lum < 0.55;
        } else {
          const continent = U.fbm(x * 3.1, y * 2.1, this.seed, 6) + 0.19 * Math.sin(lon * 0.035 + Math.sin(lat * 0.05));
          land = continent > 0.55 + (oceanTarget - 0.6) * 0.32;
        }
        const n1 = U.fbm(x * 9, y * 6, this.seed + 21, 5);
        const n2 = U.fbm(x * 24, y * 15, this.seed + 44, 4);
        const ridge = Math.pow(Math.abs(n1 - 0.5) * 2, 2.7);
        const poleIce = U.smoothstep(64, 87, Math.abs(lat));
        if (land) {
          let elev = 80 + Math.pow(n1, 2.5) * 1700 + ridge * 2200 + (n2 - 0.5) * 350;
          // recognizable large mountain belts without hard-coding exact topography
          const andes = Math.exp(-Math.pow((lon + 72) / 8, 2)) * U.smoothstep(-55, -5, lat) * (1-U.smoothstep(5,20,lat));
          const himalaya = Math.exp(-Math.pow((lon - 82) / 23, 2) - Math.pow((lat - 31) / 10, 2));
          const rockies = Math.exp(-Math.pow((lon + 113) / 12, 2) - Math.pow((lat - 43) / 24, 2));
          elev += 3300 * Math.max(andes, himalaya, rockies);
          this.fields.elevation[i] = U.clamp(elev, -300, 7800);
          this.fields.ocean[i] = 0;
          const subtropicalDry = Math.exp(-Math.pow((Math.abs(lat)-26)/12,2));
          this.fields.moisture[i] = U.clamp(0.86 - subtropicalDry * 0.58 + (n2-0.5)*0.35 - elev/15000, 0.05, 1);
          this.fields.roughness[i] = U.clamp(0.18 + elev/5200 + ridge*0.45, 0.08, 1);
          this.fields.albedo[i] = U.clamp(0.18 + poleIce*0.48 + (1-this.fields.moisture[i])*0.12 + elev/25000, 0.12, 0.82);
          this.fields.volcanic[i] = U.clamp(Math.max(andes, himalaya*0.25) * 0.55 + ridge*0.18, 0, 1);
          this.fields.geothermal[i] = U.clamp(0.07 + this.fields.volcanic[i]*0.45, 0, 1);
          this.fields.ice[i] = poleIce * U.clamp((elev+500)/4000,0.2,1);
          this.biome[i] = poleIce > 0.55 ? 'polar' : elev > 3000 ? 'alpine' : this.fields.moisture[i] < 0.22 ? 'desert' : Math.abs(lat)<18 ? 'tropical' : this.fields.moisture[i]>0.67 ? 'forest' : 'temperate';
        } else {
          const basin = 900 + Math.pow(1-n1, 1.5)*4700 + n2*900;
          this.fields.elevation[i] = -U.clamp(basin, 80, 7200);
          this.fields.ocean[i] = 1;
          this.fields.moisture[i] = 1;
          this.fields.roughness[i] = U.clamp(0.12 + ridge*0.38, 0.05, 0.65);
          this.fields.albedo[i] = 0.07 + poleIce*0.5;
          this.fields.volcanic[i] = U.clamp(ridge*0.38,0,1);
          this.fields.geothermal[i] = U.clamp(0.08 + ridge*0.42,0,1);
          this.fields.ice[i] = poleIce;
          this.biome[i] = poleIce > 0.6 ? 'sea-ice' : Math.abs(lat)<25 ? 'tropical-ocean' : 'ocean';
        }
      }
      this.sourceName = 'Earth default + procedural geological detail';
    }

    generateProcedural(preset, planet) {
      const targetOcean = (planet.oceanPercent ?? 55)/100;
      const settings = {
        arid: {ocean:0.18, threshold:0.42, heat:1.18, moisture:0.2, ice:0.15},
        ocean: {ocean:0.92, threshold:0.73, heat:1.0, moisture:1, ice:0.5},
        ice: {ocean:0.62, threshold:0.57, heat:0.58, moisture:0.72, ice:1.0},
        tidallyLocked: {ocean:targetOcean, threshold:0.54, heat:0.9, moisture:0.53, ice:0.65},
        volcanic: {ocean:0.38, threshold:0.48, heat:1.2, moisture:0.34, ice:0.05},
        alien: {ocean:targetOcean, threshold:0.55, heat:1.05, moisture:0.58, ice:0.35},
        custom: {ocean:targetOcean, threshold:0.55, heat:1, moisture:0.55, ice:0.4}
      }[preset] || {ocean:targetOcean, threshold:0.55, heat:1, moisture:0.55, ice:0.4};
      const threshold = settings.threshold + (settings.ocean - 0.55)*0.24;
      for (let i=0;i<this.size;i++) {
        const {lat,lon}=this.coords(i);
        const x=(lon+180)/360, y=(90-lat)/180;
        let continental = U.fbm(x*3.3, y*2.4, this.seed, 6);
        continental += 0.08*Math.sin(x*Math.PI*8 + Math.sin(y*6));
        if (preset === 'tidallyLocked') continental += 0.1*Math.cos(U.degToRad(lon));
        const land = continental > threshold;
        const fine=U.fbm(x*18,y*10,this.seed+200,5);
        const ridge=Math.pow(Math.abs(U.fbm(x*7,y*4,this.seed+90,5)-0.5)*2,2.2);
        const pole=U.smoothstep(55,88,Math.abs(lat))*settings.ice;
        if (land) {
          const elev=U.clamp(100+Math.pow(fine,2.1)*2600+ridge*3300,0,9800);
          this.fields.elevation[i]=elev;
          this.fields.ocean[i]=0;
          let moisture=U.clamp(settings.moisture + (fine-0.5)*0.46 - Math.exp(-Math.pow((Math.abs(lat)-28)/14,2))*0.35,0.02,1);
          if (preset==='tidallyLocked') moisture*=U.clamp(0.55+0.55*Math.cos(U.degToRad(lon)),0.1,1);
          this.fields.moisture[i]=moisture;
          this.fields.roughness[i]=U.clamp(0.12+elev/6500+ridge*0.35,0.05,1);
          this.fields.albedo[i]=U.clamp(0.14+(1-moisture)*0.22+pole*0.55,0.08,0.9);
          this.fields.volcanic[i]=U.clamp(ridge*(preset==='volcanic'?0.95:0.42),0,1);
          this.fields.geothermal[i]=U.clamp(0.07+this.fields.volcanic[i]*(preset==='volcanic'?0.8:0.4),0,1);
          this.fields.ice[i]=pole*U.clamp(0.25+elev/5000,0,1);
          this.biome[i]=pole>0.55?'ice':elev>3600?'alpine':moisture<0.2?'desert':Math.abs(lat)<20&&moisture>0.65?'alien-rainforest':'continental';
        } else {
          this.fields.elevation[i]=-U.clamp(350+(1-fine)*6200+ridge*650,50,10500);
          this.fields.ocean[i]=1;
          this.fields.moisture[i]=1;
          this.fields.roughness[i]=U.clamp(0.06+ridge*0.5,0.03,0.8);
          this.fields.albedo[i]=U.clamp(0.06+pole*0.62,0.04,0.8);
          this.fields.volcanic[i]=U.clamp(ridge*(preset==='volcanic'?0.8:0.35),0,1);
          this.fields.geothermal[i]=U.clamp(0.08+this.fields.volcanic[i]*0.6,0,1);
          this.fields.ice[i]=pole;
          this.biome[i]=pole>0.62?'sea-ice':'alien-ocean';
        }
      }
      this.sourceName = `Procedural ${preset} world`;
    }

    paint(lat, lon, field, radiusDeg, strength, mode='add') {
      const latStep=180/this.height, lonStep=360/this.width;
      const ry=Math.ceil(radiusDeg/latStep), rx=Math.ceil(radiusDeg/lonStep);
      const cY=Math.floor((90-lat)/180*this.height), cX=Math.floor((lon+180)/360*this.width);
      for(let dy=-ry;dy<=ry;dy++) for(let dx=-rx;dx<=rx;dx++) {
        const y=cY+dy; if(y<0||y>=this.height) continue;
        const x=U.mod(cX+dx,this.width);
        const cell=this.coords(y*this.width+x);
        const dLat=(cell.lat-lat), dLon=U.wrapLon(cell.lon-lon)*Math.cos(U.degToRad(lat));
        const d=Math.hypot(dLat,dLon);
        if(d>radiusDeg) continue;
        const fall=Math.pow(1-d/radiusDeg,1.7), i=y*this.width+x;
        let v=this.fields[field][i];
        if(mode==='set') v=U.lerp(v,strength,fall);
        else if(mode==='subtract') v-=strength*fall;
        else v+=strength*fall;
        const ranges={elevation:[-12000,12000],ocean:[0,1],moisture:[0,1],roughness:[0,1],albedo:[0,1],volcanic:[0,1],geothermal:[0,1],ice:[0,1]};
        const r=ranges[field]||[-1e9,1e9];
        this.fields[field][i]=U.clamp(v,r[0],r[1]);
        if(field==='ocean') {
          if(this.fields.ocean[i]>.5 && this.fields.elevation[i]>0) this.fields.elevation[i]=-250;
          if(this.fields.ocean[i]<=.5 && this.fields.elevation[i]<0) this.fields.elevation[i]=100;
        }
      }
    }

    async applyHeightmap(imageSource, options={}) {
      const img = typeof imageSource === 'string' ? await U.loadImage(imageSource) : imageSource;
      const c=document.createElement('canvas'); c.width=this.width;c.height=this.height;
      const ctx=c.getContext('2d',{willReadFrequently:true}); ctx.drawImage(img,0,0,this.width,this.height);
      const d=ctx.getImageData(0,0,this.width,this.height).data;
      const min=options.minElevation ?? -8000, max=options.maxElevation ?? 8000;
      for(let i=0;i<this.size;i++) {
        const p=i*4, lum=(d[p]+d[p+1]+d[p+2])/765;
        const elev=U.lerp(min,max,lum);
        this.fields.elevation[i]=elev;
        this.fields.ocean[i]=elev<0?1:0;
      }
      this.sourceName='Imported heightmap';
    }

    applyGeoJSON(data) {
      const features=data.type==='FeatureCollection'?data.features:(data.type==='Feature'?[data]:[]);
      let applied=0;
      const propsToFields = props => ({
        elevation: props.elevationM ?? props.elevation ?? props.height ?? props.depthM,
        ocean: props.ocean ?? props.water,
        moisture: props.moisture ?? props.soilMoisture,
        roughness: props.roughness ?? props.terrainRoughness,
        albedo: props.albedo,
        volcanic: props.volcanic ?? props.volcanism,
        geothermal: props.geothermal ?? props.geothermalFlux,
        ice: props.ice ?? props.iceCover
      });
      const applyAt=(i,props)=>{
        const map=propsToFields(props||{});
        for(const [k,v] of Object.entries(map)) if(v!==undefined&&Number.isFinite(Number(v))) {
          this.fields[k][i]=Number(v);
          if(k==='elevation' && props.depthM!==undefined && Number(v)>0) this.fields[k][i]=-Number(v);
        }
        if(props?.biome) this.biome[i]=String(props.biome);
        if(map.ocean===undefined && map.elevation!==undefined) this.fields.ocean[i]=this.fields.elevation[i]<0?1:0;
      };
      for(const feature of features) {
        const g=feature.geometry, p=feature.properties||{};
        if(!g) continue;
        if(g.type==='Point') {
          const [lon,lat]=g.coordinates; const i=this.index(lat,lon); applyAt(i,p); applied++;
        } else if(g.type==='MultiPoint') {
          for(const [lon,lat] of g.coordinates){applyAt(this.index(lat,lon),p);applied++;}
        } else {
          const polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
          for(let i=0;i<this.size;i++) {
            const {lat,lon}=this.coords(i);
            if(polygons.some(poly=>pointInPolygon([lon,lat],poly))) {applyAt(i,p);applied++;}
          }
        }
      }
      this.sourceName=`Imported GeoJSON (${features.length} features)`;
      return applied;
    }

    renderMap(canvas, overlayField='elevation') {
      const ctx=canvas.getContext('2d');
      const w=canvas.width=this.width, h=canvas.height=this.height;
      const img=ctx.createImageData(w,h), d=img.data;
      const tempRamp=[[0,[18,42,105]],[.35,[30,110,175]],[.5,[30,135,75]],[.7,[155,120,65]],[.9,[210,205,190]],[1,[255,255,255]]];
      for(let i=0;i<this.size;i++) {
        let rgb;
        const elev=this.fields.elevation[i], ocean=this.fields.ocean[i]>.5;
        if(overlayField==='elevation') {
          if(ocean) rgb=U.colorRamp([[0,[4,10,35]],[.45,[7,45,98]],[1,[38,128,170]]],U.clamp((elev+8000)/8000,0,1));
          else rgb=U.colorRamp(tempRamp,U.clamp((elev+200)/7000,0,1));
        } else {
          const v=this.fields[overlayField]?.[i] ?? 0;
          rgb=U.colorRamp([[0,[12,20,48]],[.3,[22,84,120]],[.55,[42,188,135]],[.75,[245,200,75]],[1,[235,65,70]]],v);
        }
        const p=i*4;d[p]=rgb[0];d[p+1]=rgb[1];d[p+2]=rgb[2];d[p+3]=255;
      }
      ctx.putImageData(img,0,0);
    }

    serialize() {
      const roundArray=a=>Array.from(a,v=>Math.round(v*1000)/1000);
      const fields={}; for(const k of Object.keys(this.fields)) fields[k]=roundArray(this.fields[k]);
      return {width:this.width,height:this.height,sourceName:this.sourceName,seed:this.seed,fields,biome:this.biome};
    }
    load(data) {
      if(!data||!data.fields) throw new Error('Not a geology grid.');
      if(data.width!==this.width||data.height!==this.height) throw new Error(`Grid must be ${this.width}×${this.height}.`);
      for(const k of Object.keys(this.fields)) if(data.fields[k]) this.fields[k].set(data.fields[k]);
      if(Array.isArray(data.biome)&&data.biome.length===this.size) this.biome=data.biome.slice();
      this.sourceName=data.sourceName||'Imported project geology'; this.seed=data.seed||this.seed;
    }
  }

  function pointInRing(point, ring) {
    let inside=false; const [x,y]=point;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      const hit=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi||1e-12)+xi);
      if(hit) inside=!inside;
    }
    return inside;
  }
  function pointInPolygon(point, rings) {
    if(!rings?.length||!pointInRing(point,rings[0])) return false;
    for(let i=1;i<rings.length;i++) if(pointInRing(point,rings[i])) return false;
    return true;
  }

  global.GeologyGrid=GeologyGrid;
})(window);
