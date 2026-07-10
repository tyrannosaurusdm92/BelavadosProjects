import { clamp, degToRad, mat4LookAt, mat4Multiply, mat4Perspective, raySphere, transformPoint, v3, vec3 } from './math.js';

const WORLD_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aGeo;
layout(location=1) in vec3 aColor;
uniform mat4 uViewProj;
uniform int uProjection;
uniform float uExaggeration;
uniform float uRadiusM;
uniform float uRotation;
out vec3 vColor;
out vec3 vWorld;
out float vElevation;
out vec2 vUv;
const float PI=3.141592653589793;
vec3 geoPosition(vec3 geo){
  float lon=geo.x+(uProjection==0?uRotation:0.0), lat=geo.y, elev=geo.z;
  if(uProjection==0){
    float c=cos(lat); vec3 d=vec3(c*cos(lon),sin(lat),c*sin(lon));
    return d*(1.0+elev/uRadiusM*uExaggeration*38.0);
  }
  return vec3(lon/PI*2.42,elev/10000.0*uExaggeration*0.24,lat/(PI*.5)*1.22);
}
void main(){
  vWorld=geoPosition(aGeo); vColor=aColor; vElevation=aGeo.z; vUv=vec2(aGeo.x/(2.0*PI)+0.5,0.5-aGeo.y/PI);
  gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 vColor; in vec3 vWorld; in float vElevation; in vec2 vUv;
uniform vec3 uEye; uniform float uTime; uniform sampler2D uSurfaceMap; uniform bool uUseSurface;
out vec4 outColor;
void main(){
  vec3 dx=dFdx(vWorld),dy=dFdy(vWorld); vec3 n=normalize(cross(dx,dy));
  if(!gl_FrontFacing)n=-n;
  vec3 l=normalize(vec3(.42,.72,.33)); float diff=max(dot(n,l),.06);
  float rim=pow(1.0-max(dot(normalize(uEye-vWorld),n),0.0),2.0);
  float snow=smoothstep(3600.0,7200.0,vElevation);
  vec3 mapped=texture(uSurfaceMap,vec2(fract(vUv.x),clamp(vUv.y,0.001,0.999))).rgb;
  vec3 base=mix(vColor,mapped,uUseSurface?0.92:0.0);
  base=mix(base,vec3(.9,.96,.98),snow*.68);
  float micro=.965+.035*sin(vWorld.x*110.0+sin(vWorld.z*77.0)+uTime*.02);
  outColor=vec4(base*(.38+diff*.78)*micro+rim*vec3(.08,.16,.18),1.0);
}`;
const WATER_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aGeo;
uniform mat4 uViewProj; uniform int uProjection; uniform float uRotation; uniform float uTime; uniform float uSpeed;
out vec3 vWorld; out float vDepth; out float vWave;
const float PI=3.141592653589793;
void main(){
  float lon=aGeo.x+(uProjection==0?uRotation:0.0),lat=aGeo.y,e=aGeo.z;
  float w=(sin(lon*31.0+uTime*uSpeed*.8)+sin(lat*43.0-uTime*uSpeed*.55)+sin((lon+lat)*17.0+uTime*uSpeed*.34))/3.0;
  if(uProjection==0){ float c=cos(lat); vec3 d=vec3(c*cos(lon),sin(lat),c*sin(lon)); vWorld=d*(1.0014+w*.00115); }
  else vWorld=vec3(lon/PI*2.42,w*.008,lat/(PI*.5)*1.22);
  vDepth=e; vWave=w; gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
const WATER_FS = `#version 300 es
precision highp float;
in vec3 vWorld; in float vDepth; in float vWave; uniform vec3 uEye; uniform float uOpacity;
out vec4 outColor;
void main(){
  if(vDepth>5.0) discard;
  float deep=clamp(-vDepth/9000.0,0.0,1.0); float fres=pow(1.0-abs(dot(normalize(uEye-vWorld),normalize(vWorld))),2.4);
  vec3 c=mix(vec3(.015,.32,.43),vec3(.006,.055,.18),deep); c+=fres*vec3(.18,.45,.48)+vWave*.018;
  outColor=vec4(c,uOpacity*(.58+fres*.3));
}`;
const ATMOS_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aGeo; uniform mat4 uViewProj; uniform float uRotation; out vec3 vWorld;
void main(){float lon=aGeo.x+uRotation,lat=aGeo.y,c=cos(lat);vWorld=vec3(c*cos(lon),sin(lat),c*sin(lon))*1.045;gl_Position=uViewProj*vec4(vWorld,1.0);}`;
const ATMOS_FS = `#version 300 es
precision highp float;
in vec3 vWorld; uniform vec3 uEye; out vec4 outColor;
void main(){vec3 n=normalize(vWorld);float edge=pow(1.0-abs(dot(n,normalize(uEye-vWorld))),2.8);outColor=vec4(.16,.58,.9,edge*.33);}`;
const LINE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aGeo; uniform mat4 uViewProj; uniform int uProjection; uniform float uRotation; uniform float uRadiusM; uniform float uExaggeration;
const float PI=3.141592653589793;
void main(){float lon=aGeo.x+(uProjection==0?uRotation:0.0),lat=aGeo.y,e=aGeo.z+20.0;vec3 p;if(uProjection==0){float c=cos(lat);p=vec3(c*cos(lon),sin(lat),c*sin(lon))*(1.002+e/uRadiusM*uExaggeration*38.0);}else p=vec3(lon/PI*2.42,e/10000.0*uExaggeration*.24+.003,lat/(PI*.5)*1.22);gl_Position=uViewProj*vec4(p,1.0);}`;
const LINE_FS = `#version 300 es
precision highp float; uniform vec4 uColor; out vec4 outColor; void main(){outColor=uColor;}`;
const LOCAL_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition; layout(location=1) in vec3 aColor; uniform mat4 uViewProj; out vec3 vColor; out vec3 vWorld;
void main(){vColor=aColor;vWorld=aPosition;gl_Position=uViewProj*vec4(aPosition,1.0);}`;
const LOCAL_FS = `#version 300 es
precision highp float;
in vec3 vColor; in vec3 vWorld; uniform vec3 uEye; out vec4 outColor;
void main(){vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));if(!gl_FrontFacing)n=-n;float d=max(dot(n,normalize(vec3(.4,.8,.25))),.08);float fog=clamp(length(uEye-vWorld)/75.0,0.0,.7);vec3 c=vColor*(.35+d*.82);outColor=vec4(mix(c,vec3(.04,.09,.11),fog),1.0);}`;
const LOCAL_WATER_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition; uniform mat4 uViewProj; uniform float uTime; uniform float uSpeed; uniform float uLevel; out vec3 vWorld;
void main(){vec3 p=aPosition;p.y=uLevel+(sin(p.x*.65+uTime*uSpeed)+sin(p.z*.83-uTime*uSpeed*.73))*.08;vWorld=p;gl_Position=uViewProj*vec4(p,1.0);}`;
const LOCAL_WATER_FS = `#version 300 es
precision highp float; in vec3 vWorld; uniform vec3 uEye; out vec4 outColor;
void main(){float f=pow(1.0-abs(dot(vec3(0,1,0),normalize(uEye-vWorld))),2.0);outColor=vec4(.025+.08*f,.25+.28*f,.38+.34*f,.52+.2*f);}`;
const POINT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition; layout(location=1) in vec3 aColor; layout(location=2) in float aSize; uniform mat4 uViewProj; out vec3 vColor;
void main(){vec4 p=uViewProj*vec4(aPosition,1.0);gl_Position=p;gl_PointSize=clamp(aSize/(.25+p.w*.08),1.5,28.0);vColor=aColor;}`;
const POINT_FS = `#version 300 es
precision highp float; in vec3 vColor; out vec4 outColor;
void main(){vec2 q=gl_PointCoord-.5;float d=dot(q,q);if(d>.25)discard;float a=smoothstep(.25,.04,d);outColor=vec4(vColor,a);}`;

function shader(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
function buffer(gl,data,target=gl.ARRAY_BUFFER,usage=gl.STATIC_DRAW){const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,usage);return b;}
function colorForType(type='landmark'){
  type=type.toLowerCase();
  if(type.includes('volcano'))return [1,.26,.08];
  if(type.includes('mountain'))return [.92,.82,.66];
  if(type.includes('trench')||type.includes('deep'))return [.15,.46,1];
  if(type.includes('cave')||type.includes('cavern'))return [.72,.42,.88];
  if(type.includes('river')||type.includes('delta')||type.includes('ocean'))return [.15,.84,1];
  if(type.includes('forest'))return [.22,.9,.4];
  if(type.includes('settlement'))return [1,.82,.22];
  if(type.includes('weather')||type.includes('storm')||type.includes('cloud'))return [.72,.88,1];
  if(type.includes('creature')||type.includes('wildlife')||type.includes('npc'))return [.45,1,.74];
  return [.66,1,.82];
}

function renderableWorldFeature(feature){
  const type=String(feature?.type||'').toLowerCase();
  return type.includes('settlement')||type.includes('province center')||type==='province center';
}
function pushMeshBox(out,x,y,z,w,h,d,color){
  const i=out.positions.length/3, x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
  out.positions.push(x0,y0,z0,x1,y0,z0,x1,y1,z0,x0,y1,z0,x0,y0,z1,x1,y0,z1,x1,y1,z1,x0,y1,z1);
  for(let n=0;n<8;n++)out.colors.push(...color);
  out.indices.push(i,i+1,i+2,i,i+2,i+3,i+4,i+6,i+5,i+4,i+7,i+6,i,i+4,i+5,i,i+5,i+1,i+3,i+2,i+6,i+3,i+6,i+7,i+1,i+5,i+6,i+1,i+6,i+2,i,i+3,i+7,i,i+7,i+4);
}
function pushMeshPyramid(out,x,y,z,w,h,d,color){
  const i=out.positions.length/3,x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
  out.positions.push(x0,y,z0,x1,y,z0,x1,y,z1,x0,y,z1,x,y+h,z);
  for(let n=0;n<5;n++)out.colors.push(...color);
  out.indices.push(i,i+1,i+2,i,i+2,i+3,i,i+1,i+4,i+1,i+2,i+4,i+2,i+3,i+4,i+3,i,i+4);
}
function pushMeshFish(out,x,y,z,s,color){
  const i=out.positions.length/3;
  out.positions.push(
    x-s*.7,y,z,
    x,y+s*.16,z,
    x,y-s*.16,z,
    x+s*.65,y,z,
    x+s*.95,y+s*.24,z,
    x+s*.95,y-s*.24,z,
    x-s*.15,y,z+s*.18,
    x-s*.15,y,z-s*.18
  );
  for(let n=0;n<8;n++)out.colors.push(...color);
  out.indices.push(i,i+1,i+6,i,i+6,i+2,i,i+2,i+7,i,i+7,i+1,i+1,i+3,i+6,i+2,i+7,i+3,i+4,i+3,i+5);
}
function pushMeshPlant(out,x,y,z,s,color){
  pushMeshBox(out,x,y,z,s*.12,s*.8,s*.12,[color[0]*.45,color[1]*.55,color[2]*.45]);
  pushMeshPyramid(out,x,y+s*.55,z,s*.7,s*.8,s*.7,color);
  pushMeshPyramid(out,x,y+s*.95,z,s*.46,s*.58,s*.46,[Math.min(1,color[0]*1.05),Math.min(1,color[1]*1.05),Math.min(1,color[2]*1.05)]);
}
function pushMeshCoral(out,x,y,z,s,color){
  pushMeshBox(out,x,y,z,s*.14,s*.5,s*.14,[color[0]*.8,color[1]*.8,color[2]*.8]);
  pushMeshPyramid(out,x,y+s*.28,z,s*.7,s*.45,s*.7,color);
  pushMeshPyramid(out,x+s*.18,y+s*.35,z-s*.12,s*.4,s*.35,s*.4,[Math.min(1,color[0]*1.12),Math.min(1,color[1]*1.12),Math.min(1,color[2]*1.12)]);
}
function pushMeshCloud(out,x,y,z,s,color){
  pushMeshBox(out,x-s*.22,y,z,s*.5,s*.24,s*.35,color);
  pushMeshBox(out,x+s*.12,y+s*.05,z+s*.05,s*.44,s*.22,s*.32,color);
  pushMeshBox(out,x,y+s*.1,z-s*.08,s*.58,s*.26,s*.38,color);
}
function pushMeshVolcano(out,x,y,z,s,color){
  pushMeshPyramid(out,x,y,z,s*.95,s*1.2,s*.95,[.32,.24,.18]);
  pushMeshPyramid(out,x,y+s*.7,z,s*.34,s*.45,s*.34,color);
}
function buildObjectMesh(objects=[]){
  const out={positions:[],colors:[],indices:[]};
  for(const o of objects){
    const type=String(o.type||'').toLowerCase(), name=String(o.name||'').toLowerCase();
    const pos=o.position||[0,0,0], color=o.color||colorForType(type), scale=Math.max(.35,(o.size||8)/10);
    if(type.includes('weather')) pushMeshCloud(out,pos[0],pos[1],pos[2],scale*1.3,color);
    else if(type.includes('sea creature')||type.includes('fish')||type.includes('whale')||type.includes('shark')||type.includes('eel')) pushMeshFish(out,pos[0],pos[1],pos[2],scale*.7,color);
    else if(type.includes('marine ecosystem producer')||name.includes('coral')||name.includes('kelp')||name.includes('vent ecosystem')) pushMeshCoral(out,pos[0],pos[1],pos[2],scale*.9,color);
    else if(type.includes('npc')||type.includes('resident')) pushMeshBox(out,pos[0],pos[1],pos[2],scale*.18,scale*.58,scale*.18,color);
    else if(type.includes('volcano')) pushMeshVolcano(out,pos[0],pos[1],pos[2],scale,color);
    else if(type.includes('landmark')||type.includes('civic')) pushMeshBox(out,pos[0],pos[1],pos[2],scale*.42,scale*.95,scale*.42,color);
    else if(type.includes('tree')||type.includes('plant')||type.includes('flora')) pushMeshPlant(out,pos[0],pos[1],pos[2],scale,color);
    else pushMeshPyramid(out,pos[0],pos[1],pos[2],scale*.44,scale*.65,scale*.44,color);
  }
  return {positions:new Float32Array(out.positions),colors:new Float32Array(out.colors),indices:new Uint32Array(out.indices)};
}

export class WorldRenderer {
  constructor(canvas){
    this.canvas=canvas; this.gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL2 is required.');
    const gl=this.gl;
    this.programs={terrain:program(gl,WORLD_VS,TERRAIN_FS),water:program(gl,WATER_VS,WATER_FS),atmos:program(gl,ATMOS_VS,ATMOS_FS),line:program(gl,LINE_VS,LINE_FS),local:program(gl,LOCAL_VS,LOCAL_FS),localWater:program(gl,LOCAL_WATER_VS,LOCAL_WATER_FS),point:program(gl,POINT_VS,POINT_FS)};
    this.world={vao:null,count:0}; this.surfaceTexture=null; this.useSurfaceTexture=false; this.lines={vao:null,count:0}; this.local={vao:null,count:0}; this.structures={vao:null,count:0}; this.life={vao:null,count:0,positions:null,velocities:null,posBuffer:null}; this.localObjectMesh={vao:null,count:0}; this.localObjects=[]; this.points={vao:null,count:0};
    this.model=null; this.features=[]; this.renderFeatures=[]; this.geoLines=[]; this.scene='world'; this.projection='globe'; this.exaggeration=1.6; this.timeSpeed=1;
    this.flags={water:true,atmosphere:true,features:true,life:true,rotation:true,eruption:false};
    this.time=0; this.rotation=0; this.eye=v3(0,0,3.25); this.target=v3(0,0,0); this.yaw=.68; this.pitch=.25; this.distance=3.25;
    this.localWaterLevel=0; this.localEnvironment='surface'; this.selectedFeature=null; this.selectedLocalObject=null; this.keys=new Set(); this.drag=null; this.clickHandler=null; this.doubleClickHandler=null;
    this.eruption=[]; this.stars=this.makeStars(1200); this.waterPlane=this.makeWaterPlane();
    this.lastFrame=performance.now(); this.fps=0; this.fpsCallback=null;
    this.setupEvents(); this.resize(); window.addEventListener('resize',()=>this.resize());
  }
  setupEvents(){
    const c=this.canvas;
    c.addEventListener('contextmenu',e=>e.preventDefault());
    c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);this.drag={x:e.clientX,y:e.clientY,button:e.button,moved:false,shift:e.shiftKey};});
    c.addEventListener('pointermove',e=>{
      if(!this.drag)return; const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y; if(Math.abs(dx)+Math.abs(dy)>2)this.drag.moved=true;
      if(this.drag.button===2||this.drag.shift){this.pan(dx,dy);}else{this.yaw-=dx*.005;this.pitch=clamp(this.pitch-dy*.005,-1.48,1.48);}
      this.drag.x=e.clientX;this.drag.y=e.clientY;
    });
    c.addEventListener('pointerup',e=>{if(this.drag&&!this.drag.moved&&this.clickHandler)this.clickHandler(e);this.drag=null;});
    c.addEventListener('dblclick',e=>{e.preventDefault();this.doubleClickHandler?.(e);});
    c.addEventListener('wheel',e=>{e.preventDefault();this.distance*=Math.exp(e.deltaY*.001);this.distance=clamp(this.distance,this.scene==='world'?.18:1.2,this.scene==='world'?14:90);},{passive:false});
    window.addEventListener('keydown',e=>{if(!/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))this.keys.add(e.key.toLowerCase());});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  }
  pan(dx,dy){
    const cam=this.cameraVectors(),scale=this.distance*.0015;
    this.target[0]+=(-cam.right[0]*dx+cam.up[0]*dy)*scale;this.target[1]+=(-cam.right[1]*dx+cam.up[1]*dy)*scale;this.target[2]+=(-cam.right[2]*dx+cam.up[2]*dy)*scale;
  }
  cameraVectors(){
    const cp=Math.cos(this.pitch),sp=Math.sin(this.pitch),cy=Math.cos(this.yaw),sy=Math.sin(this.yaw);
    this.eye[0]=this.target[0]+this.distance*cp*cy;this.eye[1]=this.target[1]+this.distance*sp;this.eye[2]=this.target[2]+this.distance*cp*sy;
    const forward=vec3.normalize(vec3.sub(this.target,this.eye));const right=vec3.normalize(vec3.cross(forward,v3(0,1,0)));const up=vec3.normalize(vec3.cross(right,forward));
    return {forward,right,up};
  }
  resize(){
    const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(2,Math.floor(this.canvas.clientWidth*dpr)),h=Math.max(2,Math.floor(this.canvas.clientHeight*dpr));
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}this.gl.viewport(0,0,w,h);
  }
  async setSurfaceTexture(source){
    const gl=this.gl;let bitmap;
    if(source instanceof ImageBitmap)bitmap=source;else if(source instanceof Blob)bitmap=await createImageBitmap(source);else if(typeof source==='string'){const r=await fetch(source);bitmap=await createImageBitmap(await r.blob());}else throw new Error('Unsupported surface texture source');
    if(this.surfaceTexture)gl.deleteTexture(this.surfaceTexture);
    const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
    this.surfaceTexture=tex;this.useSurfaceTexture=true;return{width:bitmap.width,height:bitmap.height};
  }
  clearSurfaceTexture(){if(this.surfaceTexture)this.gl.deleteTexture(this.surfaceTexture);this.surfaceTexture=null;this.useSurfaceTexture=false;}
  setFPSCallback(cb){this.fpsCallback=cb;}
  onClick(cb){this.clickHandler=cb;}
  onDoubleClick(cb){this.doubleClickHandler=cb;}
  setFlags(flags){Object.assign(this.flags,flags);}
  setProjection(p){this.projection=p;this.resetCamera();}
  setScene(scene){this.scene=scene;this.resetCamera();}
  resetCamera(){
    this.target.set([0,0,0]);
    if(this.scene==='world'){this.distance=this.projection==='globe'?3.25:4.4;this.yaw=.68;this.pitch=.25;}
    else if(this.scene==='cave'){this.distance=24;this.yaw=.7;this.pitch=.2;}
    else{this.distance=27;this.yaw=.72;this.pitch=.42;}
  }
  async setWorldModel(model,segments=192,rings=96){
    this.model=model; const gl=this.gl,geo=[],colors=[],indices=[];
    for(let y=0;y<=rings;y++){
      const lat=-90+y/rings*180;
      for(let x=0;x<=segments;x++){
        const lon=-180+x/segments*360,e=model.elevationAt(lat,lon),b=model.biomeAt(lat,lon,e);
        geo.push(degToRad(lon),degToRad(lat),e);colors.push(...b.color);
      }
      if(y%10===0)await new Promise(r=>setTimeout(r,0));
    }
    for(let y=0;y<rings;y++)for(let x=0;x<segments;x++){
      const a=y*(segments+1)+x,b=a+1,c=a+segments+1,d=c+1;indices.push(a,c,b,b,c,d);
    }
    if(this.world.vao)gl.deleteVertexArray(this.world.vao);
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);
    const gb=buffer(gl,new Float32Array(geo));gl.bindBuffer(gl.ARRAY_BUFFER,gb);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    const cb=buffer(gl,new Float32Array(colors));gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    const ib=buffer(gl,new Uint32Array(indices),gl.ELEMENT_ARRAY_BUFFER);
    this.world={vao,count:indices.length,geoBuffer:gb,colorBuffer:cb,indexBuffer:ib};gl.bindVertexArray(null);
    this.setFeatures(model.features||[]);this.setGeoLines(this.geoLines);
  }
  setFeatures(features){this.features=features||[];this.renderFeatures=this.features.filter(renderableWorldFeature);this.updateFeaturePoints();}
  setGeoLines(lines){
    this.geoLines=lines||[];const gl=this.gl,geo=[];
    for(const line of this.geoLines){
      for(let i=0;i<line.length-1;i++){
        const a=line[i],b=line[i+1],ea=this.model?.elevationAt(a[1],a[0])||0,eb=this.model?.elevationAt(b[1],b[0])||0;
        geo.push(degToRad(a[0]),degToRad(a[1]),ea,degToRad(b[0]),degToRad(b[1]),eb);
      }
    }
    if(!geo.length){this.lines.count=0;return;}
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);const b=buffer(gl,new Float32Array(geo));gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);this.lines={vao,count:geo.length/3,buffer:b};
  }
  updateFeaturePoints(){
    if(!this.model)return;const visible=this.renderFeatures||[];const pos=new Float32Array(visible.length*3);
    for(let i=0;i<visible.length;i++){const p=this.featurePosition(visible[i]);pos.set(p,i*3);}
    if(this.points?.count===visible.length&&this.points.posBuffer){
      this.points.positions=pos;const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.points.posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,pos);return;
    }
    const colors=[],sizes=[];for(const f of visible){const t=String(f.type||'').toLowerCase();colors.push(...(t.includes('province center')?[.95,.35,.95]:[1,.82,.22]));sizes.push(t.includes('province center')?13:10);}
    this.points=this.createPointMesh(pos,new Float32Array(colors),new Float32Array(sizes),this.points);
  }
  featurePosition(f){
    const lat=degToRad(f.lat||0),lon=degToRad(f.lon||0)+(this.projection==='globe'?this.rotation:0),e=f.elevation_m??this.model?.elevationAt(f.lat,f.lon)??0;
    if(this.scene!=='world')return v3(0,1,0);
    if(this.projection==='globe'){const c=Math.cos(lat),r=1.006+e/(this.model.radiusKm*1e3)*this.exaggeration*38;return v3(c*Math.cos(lon)*r,Math.sin(lat)*r,c*Math.sin(lon)*r);}
    return v3(lon/Math.PI*2.42,e/10000*this.exaggeration*.24+.018,lat/(Math.PI*.5)*1.22);
  }
  createPointMesh(positions,colors,sizes,old={}){
    const gl=this.gl;if(old.vao)gl.deleteVertexArray(old.vao);const vao=gl.createVertexArray();gl.bindVertexArray(vao);
    const pb=buffer(gl,positions,gl.ARRAY_BUFFER,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    const cb=buffer(gl,colors);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    const sb=buffer(gl,sizes);gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,1,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
    return {vao,count:positions.length/3,positions,colors,sizes,posBuffer:pb,colorBuffer:cb,sizeBuffer:sb};
  }
  createLocalMesh(mesh,old={}){
    const gl=this.gl;if(old.vao)gl.deleteVertexArray(old.vao);if(!mesh?.positions?.length||!mesh?.indices?.length)return{vao:null,count:0};
    const vao=gl.createVertexArray();gl.bindVertexArray(vao);
    const pb=buffer(gl,mesh.positions);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    const cb=buffer(gl,mesh.colors);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    const ib=buffer(gl,mesh.indices,gl.ELEMENT_ARRAY_BUFFER);gl.bindVertexArray(null);
    return{vao,count:mesh.indices.length,positionBuffer:pb,colorBuffer:cb,indexBuffer:ib};
  }
  setLocalObjects(objects=[]){
    this.localObjects=objects;
    const mesh=buildObjectMesh(objects);
    this.localObjectMesh=this.createLocalMesh(mesh,this.localObjectMesh||{});
  }
  setLocalScene(mesh,life,mode='local',extras={}){
    this.scene=mode;this.localEnvironment=extras.environment||mode;this.local=this.createLocalMesh(mesh,this.local);
    this.structures=extras.structures?this.createLocalMesh(extras.structures,this.structures):{vao:null,count:0};
    if(life)this.life={...this.createPointMesh(life.positions,life.colors,life.sizes,this.life),velocities:life.velocities};else this.life.count=0;
    this.setLocalObjects(extras.objects||[]);
    this.localWaterLevel=Number.isFinite(extras.waterLevel)?extras.waterLevel:(this.localEnvironment==='underwater'?5.4:(mesh.hasWater?0:-999));this.resetCamera();
  }
  setCaveScene(mesh){this.setLocalScene(mesh,null,'cave',{environment:'cave'});this.localWaterLevel=-999;this.target.set([0,-10,2]);this.distance=5.5;this.yaw=.45;this.pitch=.08;}
  makeWaterPlane(){
    const gl=this.gl,p=new Float32Array([-30,0,-30,30,0,-30,-30,0,30,30,0,30]);const vao=gl.createVertexArray();gl.bindVertexArray(vao);const b=buffer(gl,p);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);return{vao,count:4};
  }
  makeStars(count){
    const rnd=()=>Math.random(),p=[],c=[],s=[];
    for(let i=0;i<count;i++){const z=rnd()*2-1,a=rnd()*Math.PI*2,r=Math.sqrt(1-z*z),R=7+rnd()*5;p.push(r*Math.cos(a)*R,z*R,r*Math.sin(a)*R);const k=.65+rnd()*.35;c.push(k,k*(.88+rnd()*.12),k);s.push(.8+rnd()*2.2);}
    return this.createPointMesh(new Float32Array(p),new Float32Array(c),new Float32Array(s));
  }
  setSelectedFeature(f){this.selectedFeature=f;if(f?.type?.toLowerCase().includes('volcano'))this.spawnEruption();}
  spawnEruption(){
    const rnd=Math.random;this.eruption=[];
    for(let i=0;i<260;i++)this.eruption.push({p:[(rnd()-.5)*.8,.5+rnd()*.4,(rnd()-.5)*.8],v:[(rnd()-.5)*.45,1.4+rnd()*2,(rnd()-.5)*.45],life:rnd()*2.5});
  }
  updateEruption(dt){
    if(!this.flags.eruption||!this.eruption.length)return;
    const p=[],c=[],s=[];
    for(const q of this.eruption){q.life-=dt*this.timeSpeed;if(q.life<=0){q.p=[(Math.random()-.5)*.5,.45,(Math.random()-.5)*.5];q.v=[(Math.random()-.5)*.45,1.5+Math.random()*2.2,(Math.random()-.5)*.45];q.life=1.5+Math.random()*2.5;}
      q.v[1]-=dt*1.2*this.timeSpeed;q.p[0]+=q.v[0]*dt*this.timeSpeed;q.p[1]+=q.v[1]*dt*this.timeSpeed;q.p[2]+=q.v[2]*dt*this.timeSpeed;
      p.push(...q.p);const hot=clamp(q.life/2,0,1);c.push(1,.12+.65*hot,.02);s.push(7+hot*12);
    }
    this.eruptionMesh=this.createPointMesh(new Float32Array(p),new Float32Array(c),new Float32Array(s),this.eruptionMesh||{});
  }
  updateLife(dt){
    if(this.localEnvironment!=='underwater'||!this.life?.count||!this.life.velocities)return;
    const p=this.life.positions,v=this.life.velocities;
    for(let i=0;i<this.life.count;i++){
      p[i*3]+=v[i*3]*dt*this.timeSpeed;p[i*3+1]+=v[i*3+1]*dt*this.timeSpeed;p[i*3+2]+=v[i*3+2]*dt*this.timeSpeed;
      if(Math.abs(p[i*3])>14)v[i*3]*=-1;if(p[i*3+1]<-3.8||p[i*3+1]>5)v[i*3+1]*=-1;if(Math.abs(p[i*3+2])>14)v[i*3+2]*=-1;
    }
    const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.life.posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,p);
  }
  updateLocalObjects(dt){
    if(this.scene==='world'||!this.localObjects.length||!this.localObjectMesh?.count)return;
    const p=this.localObjectMesh.positions;
    for(let i=0;i<this.localObjects.length;i++){
      const o=this.localObjects[i],v=o.velocity;if(!v)continue;
      const scale=dt*this.timeSpeed*(o.motionScale||1);o.position[0]+=v[0]*scale;o.position[1]+=v[1]*scale;o.position[2]+=v[2]*scale;
      const bounds=o.bounds||[14,6,14];
      if(Math.abs(o.position[0])>bounds[0])v[0]*=-1;
      if(o.position[1]<-bounds[1]||o.position[1]>bounds[1])v[1]*=-1;
      if(Math.abs(o.position[2])>bounds[2])v[2]*=-1;
      p.set(o.position,i*3);
    }
    const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,this.localObjectMesh.posBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,p);
  }
  updateKeyboard(dt){
    if(!this.keys.size)return;const {forward,right}=this.cameraVectors(),speed=(this.scene==='world'?.45:8)*dt*Math.max(1,Math.sqrt(this.distance));
    const move=v3();if(this.keys.has('w'))vec3.add(move,forward,move);if(this.keys.has('s'))vec3.sub(move,forward,move);if(this.keys.has('d'))vec3.add(move,right,move);if(this.keys.has('a'))vec3.sub(move,right,move);
    if(vec3.length(move)>0){vec3.normalize(move,move);vec3.scale(move,speed,move);vec3.add(this.target,move,this.target);}
  }
  viewProjection(){
    this.cameraVectors();const aspect=this.canvas.width/this.canvas.height,proj=mat4Perspective(degToRad(46),aspect,.01,200),view=mat4LookAt(this.eye,this.target);return mat4Multiply(proj,view);
  }
  uniform(p,name){return this.gl.getUniformLocation(p,name);}
  setCommonWorldUniforms(p,vp){const gl=this.gl;gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);const locEye=this.uniform(p,'uEye');if(locEye)gl.uniform3fv(locEye,this.eye);const locProj=this.uniform(p,'uProjection');if(locProj)gl.uniform1i(locProj,this.projection==='globe'?0:1);const locEx=this.uniform(p,'uExaggeration');if(locEx)gl.uniform1f(locEx,this.exaggeration);const locR=this.uniform(p,'uRadiusM');if(locR)gl.uniform1f(locR,(this.model?.radiusKm||6371)*1000);const locRot=this.uniform(p,'uRotation');if(locRot)gl.uniform1f(locRot,this.rotation);}
  drawPoints(mesh,vp){if(!mesh?.count)return;const gl=this.gl,p=this.programs.point;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);gl.bindVertexArray(mesh.vao);gl.drawArrays(gl.POINTS,0,mesh.count);}
  drawWorld(vp){
    const gl=this.gl;if(!this.world.count)return;
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    let p=this.programs.terrain;gl.useProgram(p);this.setCommonWorldUniforms(p,vp);gl.uniform1f(this.uniform(p,'uTime'),this.time);gl.uniform1i(this.uniform(p,'uUseSurface'),this.useSurfaceTexture&&this.surfaceTexture?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.surfaceTexture);gl.uniform1i(this.uniform(p,'uSurfaceMap'),0);gl.bindVertexArray(this.world.vao);gl.drawElements(gl.TRIANGLES,this.world.count,gl.UNSIGNED_INT,0);
    if(this.flags.water){p=this.programs.water;gl.useProgram(p);this.setCommonWorldUniforms(p,vp);gl.uniform1f(this.uniform(p,'uTime'),this.time);gl.uniform1f(this.uniform(p,'uSpeed'),this.timeSpeed);gl.uniform1f(this.uniform(p,'uOpacity'),.8);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawElements(gl.TRIANGLES,this.world.count,gl.UNSIGNED_INT,0);gl.depthMask(true);gl.disable(gl.BLEND);}
    if(this.lines.count){p=this.programs.line;gl.useProgram(p);this.setCommonWorldUniforms(p,vp);gl.uniform4f(this.uniform(p,'uColor'),.12,.78,1,.72);gl.bindVertexArray(this.lines.vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.drawArrays(gl.LINES,0,this.lines.count);gl.disable(gl.BLEND);}
    if(this.flags.atmosphere&&this.projection==='globe'){p=this.programs.atmos;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);gl.uniform1f(this.uniform(p,'uRotation'),this.rotation);gl.uniform3fv(this.uniform(p,'uEye'),this.eye);gl.bindVertexArray(this.world.vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.cullFace(gl.FRONT);gl.drawElements(gl.TRIANGLES,this.world.count,gl.UNSIGNED_INT,0);gl.cullFace(gl.BACK);gl.depthMask(true);gl.disable(gl.BLEND);}
    if(this.flags.features){this.updateFeaturePoints();gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);this.drawPoints(this.points,vp);gl.disable(gl.BLEND);}
  }
  drawLocal(vp){
    const gl=this.gl;if(!this.local.count)return;gl.enable(gl.DEPTH_TEST);if(this.scene==='cave')gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);}
    let p=this.programs.local;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);gl.uniform3fv(this.uniform(p,'uEye'),this.eye);gl.bindVertexArray(this.local.vao);gl.drawElements(gl.TRIANGLES,this.local.count,gl.UNSIGNED_INT,0);
    if(this.structures?.count){gl.bindVertexArray(this.structures.vao);gl.drawElements(gl.TRIANGLES,this.structures.count,gl.UNSIGNED_INT,0);}
    if(this.flags.water&&this.scene!=='cave'&&this.localWaterLevel>-900){p=this.programs.localWater;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);gl.uniform3fv(this.uniform(p,'uEye'),this.eye);gl.uniform1f(this.uniform(p,'uTime'),this.time);gl.uniform1f(this.uniform(p,'uSpeed'),this.timeSpeed);gl.uniform1f(this.uniform(p,'uLevel'),this.localWaterLevel);gl.bindVertexArray(this.waterPlane.vao);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.depthMask(true);gl.disable(gl.BLEND);}
    if(this.flags.life&&this.life.count){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);this.drawPoints(this.life,vp);gl.disable(gl.BLEND);}
    if(this.flags.life&&this.localObjectMesh?.count){p=this.programs.local;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uViewProj'),false,vp);gl.uniform3fv(this.uniform(p,'uEye'),this.eye);gl.bindVertexArray(this.localObjectMesh.vao);gl.drawElements(gl.TRIANGLES,this.localObjectMesh.count,gl.UNSIGNED_INT,0);}
    if(this.flags.eruption&&this.eruptionMesh?.count){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);this.drawPoints(this.eruptionMesh,vp);gl.disable(gl.BLEND);}
  }
  screenRay(clientX,clientY){
    const rect=this.canvas.getBoundingClientRect(),nx=(clientX-rect.left)/rect.width*2-1,ny=1-(clientY-rect.top)/rect.height*2;const {forward,right,up}=this.cameraVectors(),tan=Math.tan(degToRad(46)/2),aspect=rect.width/rect.height;
    const d=vec3.add(forward,vec3.add(vec3.scale(right,nx*tan*aspect),vec3.scale(up,ny*tan)));return{origin:vec3.copy(this.eye),dir:vec3.normalize(d)};
  }
  pickWorld(clientX,clientY){
    const ray=this.screenRay(clientX,clientY);
    if(this.projection==='globe'){
      const p=raySphere(ray.origin,ray.dir,1.01);if(!p)return null;const rot=-this.rotation,lon=Math.atan2(p[2],p[0])+rot,lat=Math.asin(clamp(p[1]/vec3.length(p),-1,1));
      return{lat:lat*180/Math.PI,lon:((lon*180/Math.PI+540)%360)-180,point:p};
    }
    const t=-ray.origin[1]/ray.dir[1];if(t<0)return null;const p=vec3.add(ray.origin,vec3.scale(ray.dir,t));const lon=p[0]/2.42*Math.PI,lat=p[2]/1.22*(Math.PI*.5);if(Math.abs(lon)>Math.PI||Math.abs(lat)>Math.PI*.5)return null;return{lat:lat*180/Math.PI,lon:lon*180/Math.PI,point:p};
  }
  projectFeature(f){
    const p=this.featurePosition(f),vp=this.viewProjection(),clip=transformPoint(vp,[p[0],p[1],p[2],1]);if(clip[3]<=0)return null;const x=(clip[0]/clip[3]*.5+.5)*this.canvas.clientWidth,y=(-clip[1]/clip[3]*.5+.5)*this.canvas.clientHeight;return{x,y,z:clip[2]/clip[3]};
  }
  nearestFeature(clientX,clientY,maxPx=24){
    let best=null,bd=maxPx;for(const f of this.renderFeatures||[]){const p=this.projectFeature(f);if(!p||p.z>1)continue;const d=Math.hypot(p.x-clientX,p.y-clientY);if(d<bd){bd=d;best=f;}}return best;
  }
  focusFeature(f){
    this.selectedFeature=f;if(this.scene!=='world')return;const p=this.featurePosition(f);this.target.set(p);this.distance=this.projection==='globe'?.48:.6;this.yaw+=.03;this.pitch=.18;
  }
  projectLocalObject(o){
    if(!o?.position||this.scene==='world')return null;const vp=this.viewProjection(),clip=transformPoint(vp,[...o.position,1]);if(clip[3]<=0)return null;
    return{x:(clip[0]/clip[3]*.5+.5)*this.canvas.clientWidth,y:(-clip[1]/clip[3]*.5+.5)*this.canvas.clientHeight,z:clip[2]/clip[3]};
  }
  nearestLocalObject(clientX,clientY,maxPx=25){
    let best=null,bd=maxPx;for(const o of this.localObjects){const p=this.projectLocalObject(o);if(!p||p.z>1)continue;const d=Math.hypot(p.x-clientX,p.y-clientY);if(d<bd){bd=d;best=o;}}return best;
  }
  focusLocalObject(o){if(!o?.position)return;this.selectedLocalObject=o;this.target.set(o.position);this.distance=Math.max(1.4,Math.min(8,o.focusDistance||3.2));this.pitch=.22;}
  frame(now){
    const dt=Math.min(.05,(now-this.lastFrame)/1000);this.lastFrame=now;this.time+=dt;if(this.flags.rotation&&this.scene==='world'&&this.projection==='globe')this.rotation+=dt*.035*this.timeSpeed;
    this.updateKeyboard(dt);this.updateLife(dt);this.updateLocalObjects(dt);this.updateEruption(dt);const vp=this.viewProjection();const gl=this.gl;
    gl.clearColor(.008,.018,.029,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.DEPTH_TEST);this.drawPoints(this.stars,vp);
    if(this.scene==='world')this.drawWorld(vp);else this.drawLocal(vp);
    this.fps=this.fps*.9+(1/Math.max(dt,.001))*.1;this.fpsCallback?.(this.fps);requestAnimationFrame(t=>this.frame(t));
  }
  start(){requestAnimationFrame(t=>{this.lastFrame=t;this.frame(t);});}
}
