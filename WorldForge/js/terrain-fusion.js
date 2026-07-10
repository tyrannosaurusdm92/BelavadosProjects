import { clamp, lerp, smoothstep } from './math.js';

const DEFAULT_MAX_WIDTH = 1024;
const DEFAULT_MAX_HEIGHT = 512;

function sampledPercentiles(values, low=0.02, high=0.98){
  const step=Math.max(1,Math.floor(values.length/65536)),sample=[];
  for(let i=0;i<values.length;i+=step){const v=values[i];if(Number.isFinite(v))sample.push(v);}
  sample.sort((a,b)=>a-b);
  if(!sample.length)return[0,1];
  return [sample[Math.floor((sample.length-1)*low)],sample[Math.floor((sample.length-1)*high)]];
}
function normalizeRobust(values){
  const [lo,hi]=sampledPercentiles(values);const range=Math.max(1e-6,hi-lo),out=new Float32Array(values.length);
  for(let i=0;i<values.length;i++)out[i]=clamp((values[i]-lo)/range,0,1);
  return{values:out,low:lo,high:hi};
}
function thresholdForCoverage(values,targetFraction){
  const step=Math.max(1,Math.floor(values.length/131072)),sample=[];for(let i=0;i<values.length;i+=step){const v=values[i];if(Number.isFinite(v))sample.push(v);}sample.sort((a,b)=>a-b);if(!sample.length)return .5;const target=clamp(Number(targetFraction)||.67,.02,.98),index=Math.floor((sample.length-1)*(1-target));return sample[clamp(index,0,sample.length-1)];
}
function calibrateWaterCoverage(score,w,h,targetFraction){
  const threshold=thresholdForCoverage(score,targetFraction),range=sampledPercentiles(score,.15,.85),spread=Math.max(.035,(range[1]-range[0])*.12),out=new Float32Array(score.length);
  for(let i=0;i<out.length;i++)out[i]=smoothstep(threshold-spread,threshold+spread,score[i]);
  return{values:blur(out,w,h,2,2),threshold,spread};
}
function wrapX(x,w){return(x%w+w)%w;}
function blurPass(src,w,h,radius){
  if(radius<=0)return new Float32Array(src);
  const tmp=new Float32Array(src.length),out=new Float32Array(src.length),diam=radius*2+1;
  for(let y=0;y<h;y++){
    let sum=0;for(let k=-radius;k<=radius;k++)sum+=src[y*w+wrapX(k,w)];
    for(let x=0;x<w;x++){tmp[y*w+x]=sum/diam;sum+=src[y*w+wrapX(x+radius+1,w)]-src[y*w+wrapX(x-radius,w)];}
  }
  for(let x=0;x<w;x++){
    let sum=0;for(let k=-radius;k<=radius;k++)sum+=tmp[clamp(k,0,h-1)*w+x];
    for(let y=0;y<h;y++){out[y*w+x]=sum/diam;sum+=tmp[clamp(y+radius+1,0,h-1)*w+x]-tmp[clamp(y-radius,0,h-1)*w+x];}
  }
  return out;
}
function blur(src,w,h,radius,passes=1){let out=new Float32Array(src);for(let p=0;p<passes;p++)out=blurPass(out,w,h,radius);return out;}
function resampleScalar(src,sw,sh,dw,dh){
  if(sw===dw&&sh===dh)return new Float32Array(src);const out=new Float32Array(dw*dh);
  for(let y=0;y<dh;y++){const v=(y+.5)/dh*sh-.5,y0=clamp(Math.floor(v),0,sh-1),y1=clamp(y0+1,0,sh-1),ty=v-y0;
    for(let x=0;x<dw;x++){const u=(x+.5)/dw*sw-.5,x0=wrapX(Math.floor(u),sw),x1=wrapX(x0+1,sw),tx=u-Math.floor(u),a=lerp(src[y0*sw+x0],src[y0*sw+x1],tx),b=lerp(src[y1*sw+x0],src[y1*sw+x1],tx);out[y*dw+x]=lerp(a,b,ty);}}
  return out;
}
function terrainDiagnostics(values,w,h,maxDelta){
  let min=Infinity,max=-Infinity,sum=0,maxNeighborDelta=0,spikeEdges=0,water=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,v=values[i];min=Math.min(min,v);max=Math.max(max,v);sum+=v;if(v<0)water++;const r=values[y*w+wrapX(x+1,w)],d=values[Math.min(h-1,y+1)*w+x],delta=Math.max(Math.abs(v-r),Math.abs(v-d));maxNeighborDelta=Math.max(maxNeighborDelta,delta);if(delta>maxDelta*1.01)spikeEdges++;}
  return{minMeters:min,maxMeters:max,meanMeters:sum/values.length,maxNeighborDeltaMeters:maxNeighborDelta,remainingSpikeEdges:spikeEdges,waterCoveragePercent:water/values.length*100};
}
function slopeLimit(values,w,h,maxDelta,iterations=20){
  let current=new Float32Array(values),next=new Float32Array(values.length),clamps=0;
  for(let pass=0;pass<iterations;pass++){
    let changed=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x,neighbors=[y*w+wrapX(x-1,w),y*w+wrapX(x+1,w),Math.max(0,y-1)*w+x,Math.min(h-1,y+1)*w+x];
      let lo=-Infinity,hi=Infinity;for(const n of neighbors){lo=Math.max(lo,current[n]-maxDelta);hi=Math.min(hi,current[n]+maxDelta);}const v=clamp(current[i],lo,hi);next[i]=v;if(Math.abs(v-current[i])>.01){changed++;clamps++;}
    }
    const swap=current;current=next;next=swap;if(!changed)break;
  }
  return{values:current,clamps};
}
function waterProbabilityFromRGBA(rgba){
  const n=rgba.length/4,out=new Float32Array(n);
  for(let i=0;i<n;i++){const r=rgba[i*4]/255,g=rgba[i*4+1]/255,b=rgba[i*4+2]/255,a=rgba[i*4+3]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),sat=max-min,blueDominance=b-Math.max(r,g),cyan=Math.min(g,b)-r*.55,darkOcean=(1-max)*Math.max(0,blueDominance+.12),p=clamp(.12+blueDominance*2.35+cyan*1.2+darkOcean*.9-sat*.12,0,1);out[i]=lerp(.5,p,a);}
  return out;
}
function grayscaleFromRGBA(rgba){const out=new Float32Array(rgba.length/4);for(let i=0;i<out.length;i++)out[i]=(rgba[i*4]*.2126+rgba[i*4+1]*.7152+rgba[i*4+2]*.0722)/255;return out;}
function reliefFromSurface(map,w,h,maxElevation,minElevation,waterOverride=null){
  const lum=normalizeRobust(map.gray).values,water=blur(waterOverride||map.water,w,h,3,2),broad=blur(lum,w,h,9,2),medium=blur(lum,w,h,3,2),out=new Float32Array(w*h);
  for(let i=0;i<out.length;i++){
    const land=1-smoothstep(.43,.60,water[i]),sea=smoothstep(.48,.67,water[i]);
    const ridge=clamp(Math.abs(medium[i]-broad[i])*6.5,0,1),landShape=clamp(.18+broad[i]*.52+ridge*.65,0,1),depthShape=clamp(.08+water[i]*.55+(1-broad[i])*.37,0,1);
    out[i]=land*Math.pow(landShape,1.55)*maxElevation*.72-sea*Math.pow(depthShape,1.35)*Math.abs(minElevation)*.78;
  }
  return{elevation:out,water};
}
function roleElevation(map,role,maxElevation,minElevation){
  const norm=normalizeRobust(map.gray).values,out=new Float32Array(norm.length);
  if(role==='depth'){
    for(let i=0;i<out.length;i++){const d=1-norm[i];out[i]=-Math.pow(clamp(d,0,1),1.35)*Math.abs(minElevation);}
  }else{
    for(let i=0;i<out.length;i++)out[i]=Math.pow(norm[i],1.42)*maxElevation;
  }
  return{norm,elevation:out};
}
function chooseOutputSize(maps,maxWidth,maxHeight){
  const dims=maps.filter(Boolean).map(m=>[m.width,m.height]);if(!dims.length)return[512,256];let [w,h]=dims.reduce((a,b)=>a[0]*a[1]>=b[0]*b[1]?a:b);const ratio=w/Math.max(1,h);if(ratio<1.5||ratio>2.5){w=Math.min(maxWidth,1024);h=Math.round(w/2);}const scale=Math.min(1,maxWidth/w,maxHeight/h);return[Math.max(64,Math.round(w*scale)),Math.max(32,Math.round(h*scale))];
}
export async function decodeTerrainImage(blob,{maxWidth=DEFAULT_MAX_WIDTH,maxHeight=DEFAULT_MAX_HEIGHT}={}){
  const bmp=await createImageBitmap(blob),scale=Math.min(1,maxWidth/bmp.width,maxHeight/bmp.height),w=Math.max(2,Math.round(bmp.width*scale)),h=Math.max(2,Math.round(bmp.height*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true,alpha:false});ctx.drawImage(bmp,0,0,w,h);const image=ctx.getImageData(0,0,w,h);return{width:w,height:h,rgba:image.data,gray:grayscaleFromRGBA(image.data),water:waterProbabilityFromRGBA(image.data)};
}
export async function compileTerrainFromSources(sources={},options={}){
  const maxElevation=Number(options.maxElevationM??9000),minElevation=Number(options.minElevationM??-11000),decoded={};
  for(const role of ['surface','height','depth','topography'])if(sources[role])decoded[role]=sources[role].gray? sources[role] : await decodeTerrainImage(sources[role],options);
  const maps=Object.values(decoded),[w,h]=chooseOutputSize(maps,options.maxWidth||DEFAULT_MAX_WIDTH,options.maxHeight||DEFAULT_MAX_HEIGHT);
  const rs={};for(const [role,m] of Object.entries(decoded))rs[role]={width:w,height:h,gray:resampleScalar(m.gray,m.width,m.height,w,h),water:resampleScalar(m.water,m.width,m.height,w,h)};
  let elevation=new Float32Array(w*h),waterMask=new Float32Array(w*h);const targetWater=clamp(Number(options.targetWaterPercent??67)/100,.02,.98);let waterCalibration={threshold:null,spread:null};
  if(rs.surface){
    const lum=normalizeRobust(rs.surface.gray).values,broadLum=blur(lum,w,h,8,2),score=new Float32Array(w*h);for(let i=0;i<score.length;i++)score[i]=clamp(rs.surface.water[i]*.78+(1-broadLum[i])*.22,0,1);
    waterCalibration=calibrateWaterCoverage(score,w,h,targetWater);waterMask=waterCalibration.values;
  }else if(rs.height||rs.topography){
    const n=normalizeRobust((rs.height||rs.topography).gray).values,score=new Float32Array(n.length);for(let i=0;i<n.length;i++)score[i]=1-n[i];waterCalibration=calibrateWaterCoverage(score,w,h,targetWater);waterMask=waterCalibration.values;
  }else if(rs.depth){
    const n=normalizeRobust(rs.depth.gray).values,score=new Float32Array(n.length);for(let i=0;i<n.length;i++)score[i]=1-n[i];waterCalibration=calibrateWaterCoverage(score,w,h,targetWater);waterMask=waterCalibration.values;
  }else waterMask.fill(targetWater);
  const hMap=rs.height||rs.topography,dMap=rs.depth;
  if(hMap||dMap){
    const land=hMap?roleElevation(hMap,'height',maxElevation,minElevation):null,depth=dMap?roleElevation(dMap,'depth',maxElevation,minElevation):null,broadWater=blur(waterMask,w,h,7,2);
    for(let i=0;i<elevation.length;i++){
      const water=clamp((waterMask[i]*.72+broadWater[i]*.28),0,1),landWeight=1-smoothstep(.43,.60,water),seaWeight=smoothstep(.48,.66,water);
      let lv=land?land.elevation[i]:Math.max(0,(1-water)*maxElevation*.18),dv=depth?depth.elevation[i]:-Math.pow(water,.9)*Math.abs(minElevation)*(.18+.62*broadWater[i]);
      if(hMap&&!rs.surface&&!dMap&&land.norm[i]<.10){dv=-Math.abs(minElevation)*(.16+.65*(1-land.norm[i]/.10));}
      elevation[i]=lv*landWeight+dv*seaWeight;
    }
  }else if(rs.surface){({elevation,water:waterMask}=reliefFromSurface(rs.surface,w,h,maxElevation,minElevation,waterMask));}
  else throw new Error('No usable surface, height, depth, or topography image was supplied.');

  const fine=blur(elevation,w,h,1,1),medium=blur(elevation,w,h,3,2),broad=blur(elevation,w,h,8,2),merged=new Float32Array(elevation.length);
  for(let i=0;i<merged.length;i++){
    const water=waterMask[i],shore=Math.abs(water-.5),detailWeight=clamp(shore*3.2,0.18,1);let v=elevation[i]*.34+fine[i]*.31+medium[i]*.23+broad[i]*.12;
    v=lerp(medium[i]*.65+broad[i]*.35,v,detailWeight);const coastFade=clamp(Math.abs(water-.5)*7.5,0,1);if(coastFade<1)v*=coastFade;merged[i]=clamp(v,minElevation,maxElevation);
  }
  const maxDelta=clamp(Number(options.maxNeighborDeltaM)||Math.round(620*512/w),160,900),limited=slopeLimit(merged,w,h,maxDelta,Number(options.slopeIterations)||24);
  const softened=blur(limited.values,w,h,1,1),finalPass=slopeLimit(softened,w,h,maxDelta,10),final=finalPass.values,finalWater=blur(waterMask,w,h,2,1);for(let i=0;i<final.length;i++){final[i]=clamp(final[i],minElevation,maxElevation);if(final[i]<-35)finalWater[i]=Math.max(finalWater[i],.62);else if(final[i]>35)finalWater[i]=Math.min(finalWater[i],.38);}
  let classifiedWater=0;for(const v of finalWater)if(v>.5)classifiedWater++;
  const diagnostics={...terrainDiagnostics(final,w,h,maxDelta),targetWaterCoveragePercent:targetWater*100,classifiedWaterCoveragePercent:classifiedWater/finalWater.length*100,waterClassificationThreshold:waterCalibration.threshold,waterClassificationSpread:waterCalibration.spread,slopeLimitMetersPerCell:maxDelta,slopeCorrections:limited.clamps+finalPass.clamps,sources:Object.keys(decoded),algorithm:'adaptive ocean-coverage classification + shoreline-aware multiscale fusion + wrapped smoothing + two-stage iterative slope limiting'};
  return{width:w,height:h,values:final,meters:true,minElevationM:minElevation,maxElevationM:maxElevation,waterMask:finalWater,diagnostics};
}
export function smoothElevationGrid(values,width,height,{minElevationM=-11000,maxElevationM=9000,maxNeighborDeltaM,slopeIterations=24}={}){
  const source=Float32Array.from(values,Number),medium=blur(source,width,height,2,2),broad=blur(source,width,height,6,1),merged=new Float32Array(source.length);for(let i=0;i<merged.length;i++)merged[i]=clamp(source[i]*.42+medium[i]*.42+broad[i]*.16,minElevationM,maxElevationM);
  const maxDelta=clamp(Number(maxNeighborDeltaM)||Math.round(620*512/width),160,900),limited=slopeLimit(merged,width,height,maxDelta,slopeIterations),final=blur(limited.values,width,height,1,1);
  const waterMask=new Float32Array(final.length);for(let i=0;i<final.length;i++)waterMask[i]=final[i]<-85?1:final[i]>85?0:clamp((85-final[i])/170,0,1);
  return{width,height,values:final,meters:true,minElevationM,maxElevationM,waterMask,diagnostics:{...terrainDiagnostics(final,width,height,maxDelta),slopeLimitMetersPerCell:maxDelta,slopeCorrections:limited.clamps,algorithm:'grid multiscale smoothing + iterative slope limiting'}};
}
