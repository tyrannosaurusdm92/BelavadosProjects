(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.BelavadosTerrainCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smoothstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
  const hexToRgb=hex=>{const v=String(hex||'').replace('#','');return [parseInt(v.slice(0,2),16)||0,parseInt(v.slice(2,4),16)||0,parseInt(v.slice(4,6),16)||0]};
  const rgbKey=(r,g,b)=>[r,g,b].map(v=>clamp(Math.round(v),0,255).toString(16).padStart(2,'0')).join('').toUpperCase();
  const luminance=(r,g,b)=>(.2126*r+.7152*g+.0722*b)/255;
  const wrapX=(x,w)=>(x%w+w)%w;

  function makeIndex(topography){
    const rulesByKey=new Map(),rulesByPath=new Map();
    (topography.regionRules||[]).forEach(rule=>{
      rulesByKey.set(Number(rule.key),rule);
      if(!rulesByPath.has(rule.biomePath)) rulesByPath.set(rule.biomePath,[]);
      rulesByPath.get(rule.biomePath).push(rule);
    });
    rulesByPath.forEach(rules=>rules.sort((a,b)=>Number(a.bandId)-Number(b.bandId)));
    const biomes=(topography.biomes||[]).map((biome,index)=>({
      ...biome,index,
      dominantRgb:hexToRgb(biome.dominantRealismHex),
      previewRgb:hexToRgb(biome.previewColor)
    }));
    return {rulesByKey,rulesByPath,biomes,topHexes:topography.topHexes||{}};
  }

  function nearestBiome(r,g,b,index){
    let best=null,bestDistance=Infinity;
    for(const biome of index.biomes){
      const [dr,dg,db]=biome.dominantRgb,[pr,pg,pb]=biome.previewRgb;
      const dominant=(r-dr)**2*1.1+(g-dg)**2*1.25+(b-db)**2*.9;
      const preview=(r-pr)**2*1.1+(g-pg)**2*1.25+(b-pb)**2*.9;
      const distance=Math.min(dominant,preview*.72);
      if(distance<bestDistance){bestDistance=distance;best=biome;}
    }
    return best||index.biomes[0];
  }

  function chooseFallbackRule(biome,lum,index){
    const rules=index.rulesByPath.get(biome.path)||[];
    if(!rules.length) return null;
    if(rules.length===1) return rules[0];
    const water=biome.group==='Ocean'||/water|reef/i.test(biome.category);
    const position=water?1-smoothstep((lum-.03)/.38):smoothstep((lum-.04)/.62);
    return rules[clamp(Math.floor(position*rules.length),0,rules.length-1)];
  }

  function ruleHeight(rule,biome,lum,noise){
    const path=String(biome?.path||rule?.biomePath||''),category=String(biome?.category||rule?.biomeCategory||''),band=Number(rule?.bandId||0);
    if(/Deep cavern/i.test(path+category)){
      const ground=lerp(1250,4200,smoothstep((lum-.04)/.55));
      return {surface:ground,subsurface:Math.max(180,Math.abs(Number(rule?.zMean||-3172.8))),kind:2};
    }
    if(/Ocean Surface floating settlement/i.test(path+category)){
      if(band>=6) return {surface:lerp(-8200,-5200,smoothstep((lum-.02)/.24))+noise*110,subsurface:0,kind:0};
      if(band===5) return {surface:lerp(-4700,-420,smoothstep((lum-.03)/.34))+noise*85,subsurface:0,kind:0};
      return {surface:lerp(-180,-8,smoothstep((lum-.08)/.42)),subsurface:0,kind:0};
    }
    const zMin=Number(rule?.zMin||0),zMean=Number(rule?.zMean||0),zMax=Number(rule?.zMax||0);
    if(zMin===zMax) return {surface:zMin,subsurface:0,kind:zMin<0?0:1};
    if(zMean<0||zMax<=0){
      const t=smoothstep((.62-lum)/.57), ranged=lerp(zMax,zMin,t), surface=lerp(zMean,ranged,.6)+noise*Math.min(90,Math.abs(zMax-zMin)*.035);
      return {surface,subsurface:0,kind:0};
    }
    const t=smoothstep((lum-.035)/.64),ranged=lerp(zMin,zMax,t),surface=lerp(zMean,ranged,.58)+noise*Math.min(75,Math.abs(zMax-zMin)*.025);
    return {surface,subsurface:0,kind:1};
  }

  function classifyImage(imageData,topography){
    const index=makeIndex(topography),n=imageData.width*imageData.height,elevations=new Float32Array(n),subsurfaceDepths=new Float32Array(n),biomeIndices=new Uint16Array(n),kinds=new Uint8Array(n),mountains=new Uint8Array(n),abyss=new Uint8Array(n),colors=new Uint8Array(n*3); let exactHexMatches=0;
    for(let i=0;i<n;i++){
      const base=i*4,r=imageData.data[base],g=imageData.data[base+1],b=imageData.data[base+2],lum=luminance(r,g,b),key=rgbKey(r,g,b),hit=index.topHexes[key];
      let rule=null,biome=null;
      if(hit){rule=index.rulesByKey.get(Number(hit[0]))||null;biome=index.biomes.find(x=>x.path===rule?.biomePath)||null;exactHexMatches++;}
      if(!biome) biome=nearestBiome(r,g,b,index);
      if(!rule) rule=chooseFallbackRule(biome,lum,index);
      const hash=((i*1664525+(r<<16)+(g<<8)+b+1013904223)>>>0)/4294967295-.5,result=ruleHeight(rule,biome,lum,hash);
      elevations[i]=result.surface;subsurfaceDepths[i]=result.subsurface;biomeIndices[i]=biome?.index||0;kinds[i]=result.kind;
      const label=(biome?.path||'')+' '+(rule?.bandName||'');mountains[i]=/Mountain range|surface_summit|surface_highland/i.test(label)?1:0;abyss[i]=result.kind===0&&(/abyssal|Underwater without reefs/i.test(label))?1:0;
      colors[i*3]=r;colors[i*3+1]=g;colors[i*3+2]=b;
    }
    return {width:imageData.width,height:imageData.height,elevations,subsurfaceDepths,biomeIndices,kinds,mountains,abyss,colors,exactHexMatches,index};
  }

  function localMedianDenoise(values,kinds,w,h,limit){
    const source=new Float32Array(values),sample=[],radius=1;let corrections=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x;sample.length=0;
      for(let oy=-radius;oy<=radius;oy++){const yy=clamp(y+oy,0,h-1);for(let ox=-radius;ox<=radius;ox++){const xx=wrapX(x+ox,w),j=yy*w+xx;if(kinds[j]===kinds[i]||kinds[i]===2)sample.push(source[j]);}}
      sample.sort((a,b)=>a-b);const median=sample[Math.floor(sample.length/2)]??source[i],delta=source[i]-median;
      if(Math.abs(delta)>limit){values[i]=median+Math.sign(delta)*limit;corrections++;}
    }
    return corrections;
  }

  function bilateralSmooth(values,kinds,w,h,radius,passes,rangeScale){
    let current=new Float32Array(values),next=new Float32Array(values.length);
    for(let pass=0;pass<passes;pass++){
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const i=y*w+x,center=current[i];let total=0,weights=0;
        for(let oy=-radius;oy<=radius;oy++){const yy=clamp(y+oy,0,h-1);for(let ox=-radius;ox<=radius;ox++){
          const xx=wrapX(x+ox,w),j=yy*w+xx,spatial=1/(1+ox*ox+oy*oy),same=kinds[i]===kinds[j]||kinds[i]===2||kinds[j]===2,classWeight=same?1:.2,range=Math.exp(-Math.abs(current[j]-center)/Math.max(1,rangeScale)),weight=spatial*classWeight*(.28+.72*range);
          total+=current[j]*weight;weights+=weight;
        }}
        next[i]=weights?total/weights:center;
      }
      const swap=current;current=next;next=swap;
    }
    values.set(current);
  }

  function distanceWrapped(x1,y1,x2,y2,w){const dx=Math.min(Math.abs(x1-x2),w-Math.abs(x1-x2)),dy=y1-y2;return Math.hypot(dx,dy);}
  function findExtreme(values,mask,highest){let best=-1,bestValue=highest?-Infinity:Infinity;for(let i=0;i<values.length;i++){if(!mask[i])continue;if((highest&&values[i]>bestValue)||(!highest&&values[i]<bestValue)){best=i;bestValue=values[i];}}return best;}
  function spreadExtreme(values,kinds,w,h,index,target,cellSlope,highest,locks){
    if(index<0)return false;const cx=index%w,cy=Math.floor(index/w),radius=Math.ceil(Math.abs(target)/Math.max(1,cellSlope))+(highest?4:6),plateau=highest?1.8:2.6;
    for(let y=Math.max(0,cy-radius);y<=Math.min(h-1,cy+radius);y++)for(let dx=-radius;dx<=radius;dx++){
      const x=wrapX(cx+dx,w),i=y*w+x,d=distanceWrapped(x,y,cx,cy,w);if(d>radius)continue;
      const desired=highest?target-Math.max(0,d-plateau)*cellSlope*.82:target+Math.max(0,d-plateau)*cellSlope*.82;
      if((highest&&values[i]<desired)||(!highest&&values[i]>desired)) values[i]=desired;
      if(d<=plateau*.72)locks[i]=1;
    }
    values[index]=target;locks[index]=1;return true;
  }

  function slopeLimit(values,w,h,limit,locks,minZ,maxZ,maxIterations){
    let clamps=0;
    function pair(a,b){
      const diff=values[a]-values[b],amount=Math.abs(diff)-limit;if(amount<=.0001)return false;const sign=Math.sign(diff);
      if(locks[a]&&!locks[b]) values[b]=values[a]-sign*limit;
      else if(locks[b]&&!locks[a]) values[a]=values[b]+sign*limit;
      else if(!locks[a]&&!locks[b]){values[a]-=sign*amount*.5;values[b]+=sign*amount*.5;}
      else return false;
      values[a]=clamp(values[a],minZ,maxZ);values[b]=clamp(values[b],minZ,maxZ);clamps++;return true;
    }
    for(let iteration=0;iteration<maxIterations;iteration++){
      let changed=false;
      if(iteration%2===0){
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;changed=pair(i,y*w+wrapX(x+1,w))||changed;if(y<h-1)changed=pair(i,(y+1)*w+x)||changed;}
      }else{
        for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;changed=pair(i,y*w+wrapX(x-1,w))||changed;if(y>0)changed=pair(i,(y-1)*w+x)||changed;}
      }
      if(!changed)break;
    }
    return clamps;
  }

  function diagnostics(values,w,h,limit){
    let min=Infinity,max=-Infinity,sum=0,sum2=0,maxNeighborDelta=0,spikeCount=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x,v=values[i];min=Math.min(min,v);max=Math.max(max,v);sum+=v;sum2+=v*v;
      const right=values[y*w+wrapX(x+1,w)],down=values[Math.min(h-1,y+1)*w+x],delta=Math.max(Math.abs(v-right),Math.abs(v-down));maxNeighborDelta=Math.max(maxNeighborDelta,delta);if(delta>limit*1.002)spikeCount++;
    }
    const mean=sum/values.length,variance=Math.max(0,sum2/values.length-mean*mean);
    return {minMeters:min,maxMeters:max,meanMeters:mean,standardDeviationMeters:Math.sqrt(variance),maxNeighborDeltaMeters:maxNeighborDelta,remainingSpikeEdges:spikeCount};
  }

  function buildHeightfield(imageData,topography,options={}){
    if(!imageData||!imageData.data||!imageData.width||!imageData.height)throw new Error('A non-empty ImageData-like source is required.');
    const classified=classifyImage(imageData,topography),w=classified.width,h=classified.height,values=new Float32Array(classified.elevations),limits=topography.globalLimitsMeters||{lowest:-8200,highest:5200};
    const referenceSlope=clamp(Number(options.maxSlopeMeters)||650,120,1800),cellSlope=referenceSlope*(128/w),radius=clamp(Math.round(Number(options.smoothingRadius)||2),1,6),passes=clamp(Math.round(Number(options.smoothingPasses)||4),1,10);
    const outlierCorrections=localMedianDenoise(values,classified.kinds,w,h,cellSlope*1.75);
    bilateralSmooth(values,classified.kinds,w,h,radius,passes,cellSlope*2.4);
    const locks=new Uint8Array(values.length),highestIndex=findExtreme(classified.elevations,classified.mountains,true),lowestIndex=findExtreme(classified.elevations,classified.abyss,false);
    const anchoredHighest=spreadExtreme(values,classified.kinds,w,h,highestIndex,Number(limits.highest),cellSlope,true,locks),anchoredLowest=spreadExtreme(values,classified.kinds,w,h,lowestIndex,Number(limits.lowest),cellSlope,false,locks);
    const slopeClamps=slopeLimit(values,w,h,cellSlope,locks,Number(limits.lowest),Number(limits.highest),Math.max(192,Math.ceil(Math.max(w,h)*9)));
    const stats=diagnostics(values,w,h,cellSlope);
    return {
      width:w,height:h,elevations:values,rawElevations:classified.elevations,subsurfaceDepths:classified.subsurfaceDepths,biomeIndices:classified.biomeIndices,kinds:classified.kinds,colors:classified.colors,
      diagnostics:{...stats,cellSlopeLimitMeters:cellSlope,referenceSlopeLimitMeters:referenceSlope,smoothingRadius:radius,smoothingPasses:passes,outlierCorrections,slopeClamps,exactHexMatches:classified.exactHexMatches,exactHexMatchPercent:classified.exactHexMatches/values.length*100,anchoredHighest,anchoredLowest,globalLimitsMeters:limits}
    };
  }

  function rle(values,precision=1){
    const out=[];if(!values.length)return out;let value=Number(values[0].toFixed(precision)),count=1;
    for(let i=1;i<values.length;i++){const next=Number(values[i].toFixed(precision));if(next===value)count++;else{out.push([value,count]);value=next;count=1;}}out.push([value,count]);return out;
  }

  return {buildHeightfield,makeIndex,diagnostics,rle,version:'2.0.0-spike-safe'};
});
