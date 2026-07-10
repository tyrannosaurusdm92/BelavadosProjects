(function(global){
'use strict';
const U=global.WeatherCreatorUtils;

class GlobeRenderer{
  constructor(canvas, geology, engine){
    this.canvas=canvas;this.geology=geology;this.engine=engine;
    this.gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true})||canvas.getContext('experimental-webgl');
    if(!this.gl)throw new Error('WebGL is unavailable in this browser.');
    this.pitch=-0.18;this.yaw=-1.1;this.zoom=3.05;this.fov=45*Math.PI/180;
    this.autoRotate=true;this.layer='composite';this.selected={lat:42.36,lon:-71.06};
    this.toggles={clouds:true,wind:true,precip:true,storms:true,aurora:true,grid:true,atmosphere:true,dayNight:true};
    this.dragging=false;this.pointerStart=null;this.lastPointer=null;this.onSelect=null;
    this.lastGeometryUpdate=0;this.lastTextureUpdate=0;this.weatherGeometry={};
    this.initGL();this.bindControls();this.resize();
    window.addEventListener('resize',()=>this.resize());
  }

  shader(type,source){const gl=this.gl,s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
  program(vs,fs){const gl=this.gl,p=gl.createProgram();gl.attachShader(p,this.shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,this.shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}

  initGL(){
    const gl=this.gl;gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    this.globeProgram=this.program(`
      attribute vec3 aPosition;attribute vec3 aNormal;attribute vec2 aUV;
      uniform mat4 uMVP;uniform mat4 uModelView;varying vec2 vUV;varying vec3 vNormal;varying vec3 vViewPos;
      void main(){vec4 vp=uModelView*vec4(aPosition,1.0);vViewPos=vp.xyz;vNormal=aNormal;vUV=aUV;gl_Position=uMVP*vec4(aPosition,1.0);}
    `,`
      precision mediump float;uniform sampler2D uTexture;uniform vec3 uSunView;uniform float uDayNight;varying vec2 vUV;varying vec3 vNormal;varying vec3 vViewPos;
      void main(){vec3 n=normalize(vNormal);float light=max(dot(n,normalize(uSunView)),0.0);float rim=pow(1.0-max(dot(n,normalize(-vViewPos)),0.0),2.0);vec4 tex=texture2D(uTexture,vUV);float shade=mix(1.0,0.16+0.84*light,uDayNight);vec3 night=vec3(0.012,0.028,0.07)*(1.0-light);vec3 col=tex.rgb*shade+night+rim*vec3(0.03,0.07,0.12);gl_FragColor=vec4(col,1.0);}
    `);
    this.atmoProgram=this.program(`
      attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModelView;varying vec3 vN;varying vec3 vV;
      void main(){vec4 p=uModelView*vec4(aPosition*1.045,1.0);vV=p.xyz;vN=mat3(uModelView)*aNormal;gl_Position=uMVP*vec4(aPosition*1.045,1.0);}
    `,`
      precision mediump float;varying vec3 vN;varying vec3 vV;void main(){float rim=pow(1.0-max(dot(normalize(vN),normalize(-vV)),0.0),2.7);gl_FragColor=vec4(0.18,0.58,1.0,rim*0.42);}
    `);
    this.pointProgram=this.program(`
      attribute vec3 aPosition;attribute vec4 aColor;attribute float aSize;uniform mat4 uMVP;varying vec4 vColor;
      void main(){vec4 p=uMVP*vec4(aPosition,1.0);gl_Position=p;gl_PointSize=aSize*(260.0/max(1.0,p.w));vColor=aColor;}
    `,`
      precision mediump float;varying vec4 vColor;void main(){vec2 p=gl_PointCoord*2.0-1.0;float d=dot(p,p);if(d>1.0)discard;float a=(1.0-smoothstep(0.35,1.0,d))*vColor.a;gl_FragColor=vec4(vColor.rgb,a);}
    `);
    this.lineProgram=this.program(`
      attribute vec3 aPosition;attribute vec4 aColor;uniform mat4 uMVP;varying vec4 vColor;void main(){gl_Position=uMVP*vec4(aPosition,1.0);vColor=aColor;}
    `,`precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}`);
    this.sphere=this.makeSphere(128,64);this.grid=this.makeGrid();this.stars=this.makeStars();
    this.textureCanvas=document.createElement('canvas');this.textureCanvas.width=512;this.textureCanvas.height=256;
    this.texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.updateTexture(true);
  }

  makeSphere(segX,segY){
    const pos=[],nor=[],uv=[],idx=[];
    for(let y=0;y<=segY;y++){const v=y/segY,lat=Math.PI/2-v*Math.PI;for(let x=0;x<=segX;x++){const u=x/segX,lon=u*Math.PI*2-Math.PI,cp=Math.cos(lat);const X=cp*Math.cos(lon),Y=Math.sin(lat),Z=cp*Math.sin(lon);pos.push(X,Y,Z);nor.push(X,Y,Z);uv.push(u,v);}}
    for(let y=0;y<segY;y++)for(let x=0;x<segX;x++){const a=y*(segX+1)+x,b=a+segX+1;idx.push(a,b,a+1,b,b+1,a+1);}
    return {pos:this.buffer(new Float32Array(pos)),nor:this.buffer(new Float32Array(nor)),uv:this.buffer(new Float32Array(uv)),idx:this.elementBuffer(new Uint16Array(idx)),count:idx.length};
  }
  makeGrid(){
    const pos=[],col=[];const add=(a,b,alpha=.18)=>{pos.push(...a,...b);col.push(.36,.68,1,alpha,.36,.68,1,alpha);};
    for(let lat=-75;lat<=75;lat+=15)for(let lon=-180;lon<180;lon+=4)add(U.latLonToXYZ(lat,lon,1.008),U.latLonToXYZ(lat,lon+4,1.008));
    for(let lon=-180;lon<180;lon+=15)for(let lat=-90;lat<90;lat+=4)add(U.latLonToXYZ(lat,lon,1.008),U.latLonToXYZ(lat+4,lon,1.008));
    return this.makeLineData(pos,col);
  }
  makeStars(){
    const pos=[],col=[],size=[];for(let i=0;i<1400;i++){const u=U.hash(i,1),v=U.hash(i,2),th=u*Math.PI*2,ph=Math.acos(2*v-1),r=8;pos.push(r*Math.sin(ph)*Math.cos(th),r*Math.cos(ph),r*Math.sin(ph)*Math.sin(th));const b=.62+U.hash(i,3)*.38;col.push(b,b*.95,1,.7+U.hash(i,4)*.3);size.push(.8+U.hash(i,5)*1.8);}return this.makePointData(pos,col,size);
  }
  buffer(data){const b=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ARRAY_BUFFER,b);this.gl.bufferData(this.gl.ARRAY_BUFFER,data,this.gl.STATIC_DRAW);return b;}
  elementBuffer(data){const b=this.gl.createBuffer();this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,b);this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER,data,this.gl.STATIC_DRAW);return b;}
  makeLineData(pos,col){const gl=this.gl,pb=gl.createBuffer(),cb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);return {pos:pb,col:cb,count:pos.length/3};}
  makePointData(pos,col,size){const gl=this.gl,pb=gl.createBuffer(),cb=gl.createBuffer(),sb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pos),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,cb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(col),gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,sb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(size),gl.DYNAMIC_DRAW);return {pos:pb,col:cb,size:sb,count:pos.length/3};}
  disposeData(data){if(!data)return;const gl=this.gl;['pos','col','size'].forEach(k=>{if(data[k])gl.deleteBuffer(data[k]);});}

  resize(){const dpr=Math.min(2,window.devicePixelRatio||1),r=this.canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;this.gl.viewport(0,0,w,h);}}
  matrices(){const aspect=this.canvas.width/this.canvas.height,proj=U.mat4Perspective(this.fov,aspect,.1,30),rot=U.mat4Multiply(U.mat4RotX(this.pitch),U.mat4RotY(this.yaw)),view=U.mat4Translate(0,0,-this.zoom),mv=U.mat4Multiply(view,rot),mvp=U.mat4Multiply(proj,mv);return{proj,mv,mvp};}
  useAttr(program,name,buffer,size){const gl=this.gl,loc=gl.getAttribLocation(program,name);if(loc<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);}

  updateTexture(force=false){
    const now=performance.now();if(!force&&now-this.lastTextureUpdate<300)return;this.lastTextureUpdate=now;
    const c=this.textureCanvas,ctx=c.getContext('2d'),img=ctx.createImageData(c.width,c.height),d=img.data,g=this.geology,f=this.engine.fields,layer=this.layer;
    const ramps={
      temperature:[[0,[72,26,110]],[.18,[33,75,190]],[.37,[35,190,220]],[.53,[55,190,100]],[.68,[245,210,60]],[.84,[245,92,48]],[1,[150,20,28]]],
      pressure:[[0,[62,25,140]],[.42,[35,130,200]],[.5,[235,245,245]],[.62,[245,190,65]],[1,[180,35,42]]],
      humidity:[[0,[95,50,25]],[.3,[195,145,60]],[.55,[74,180,135]],[1,[22,88,190]]],
      wind:[[0,[19,38,82]],[.25,[35,160,190]],[.5,[80,225,130]],[.72,[250,205,55]],[1,[235,45,55]]],
      cloud:[[0,[10,20,46]],[.45,[70,92,118]],[1,[245,250,255]]],
      precipitation:[[0,[14,20,45]],[.12,[30,100,170]],[.35,[40,210,220]],[.65,[105,240,115]],[1,[255,245,160]]],
      storm:[[0,[12,20,40]],[.35,[70,40,105]],[.6,[210,75,90]],[1,[255,240,100]]],
      elevation:[[0,[5,16,48]],[.38,[8,69,130]],[.49,[30,130,168]],[.5,[28,115,70]],[.68,[130,110,60]],[.86,[190,185,175]],[1,[255,255,255]]]
    };
    for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
      const lat=90-(y+.5)/c.height*180,lon=(x+.5)/c.width*360-180,i=g.index(lat,lon),e=g.fields.elevation[i],o=g.fields.ocean[i]>.5;let rgb;
      if(layer==='composite'){
        if(o)rgb=U.colorRamp([[0,[2,8,32]],[.55,[5,48,105]],[1,[22,122,160]]],U.clamp((e+8500)/8500,0,1));
        else{const m=g.fields.moisture[i],snow=f.snow[i]>0.2||g.fields.ice[i]>.45;rgb=snow?[225,235,240]:m<.2?[165,121,61]:e>2500?[125,112,92]:m>.65?[32,113,65]:[61,126,72];}
        const tempTint=U.colorRamp(ramps.temperature,U.clamp((f.temperature[i]+65)/125,0,1));rgb=U.mixRgb(rgb,tempTint,.12);
        if(f.cloud[i]>.58)rgb=U.mixRgb(rgb,[235,242,248],(f.cloud[i]-.58)*.52);
        if(f.precip[i]>2)rgb=U.mixRgb(rgb,[42,180,230],U.clamp(f.precip[i]/30,0,.35));
      }else if(layer==='temperature')rgb=U.colorRamp(ramps.temperature,U.clamp((f.temperature[i]+65)/125,0,1));
      else if(layer==='pressure')rgb=U.colorRamp(ramps.pressure,U.clamp((f.pressure[i]/Math.max(.1,this.engine.planet.pressureBar)-930)/170,0,1));
      else if(layer==='humidity')rgb=U.colorRamp(ramps.humidity,f.humidity[i]);
      else if(layer==='wind')rgb=U.colorRamp(ramps.wind,U.clamp(f.windSpeed[i]/80,0,1));
      else if(layer==='cloud')rgb=U.colorRamp(ramps.cloud,f.cloud[i]);
      else if(layer==='precipitation')rgb=U.colorRamp(ramps.precipitation,U.clamp(f.precip[i]/24,0,1));
      else if(layer==='storm')rgb=U.colorRamp(ramps.storm,f.storm[i]);
      else if(layer==='elevation')rgb=U.colorRamp(ramps.elevation,U.clamp((e+8000)/15000,0,1));
      else rgb=[80,110,140];
      const p=(y*c.width+x)*4;d[p]=rgb[0];d[p+1]=rgb[1];d[p+2]=rgb[2];d[p+3]=255;
    }
    ctx.putImageData(img,0,0);const gl=this.gl;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);
  }

  updateWeatherGeometry(force=false){
    const now=performance.now();if(!force&&now-this.lastGeometryUpdate<650)return;this.lastGeometryUpdate=now;
    const g=this.geology,f=this.engine.fields,time=this.engine.simTimeDays;
    const cloudP=[],cloudC=[],cloudS=[],precP=[],precC=[],precS=[],stormP=[],stormC=[],stormS=[],aurP=[],aurC=[],aurS=[],windP=[],windC=[];
    for(let y=1;y<g.height-1;y+=2)for(let x=0;x<g.width;x+=2){const i=y*g.width+x,p=g.coords(i),phase=U.hash(x,y,Math.floor(time*2));
      if(this.toggles.clouds&&f.cloud[i]>.38&&phase<f.cloud[i]*.9){const driftLon=p.lon+f.windU[i]*.025*(time%20),driftLat=U.clamp(p.lat+f.windV[i]*.012*(time%20),-89,89),r=1.025+f.cloud[i]*.022;cloudP.push(...U.latLonToXYZ(driftLat,driftLon,r));cloudC.push(.88,.94,1,.16+.5*f.cloud[i]);cloudS.push(4+f.cloud[i]*9);}
      if(this.toggles.precip&&f.precip[i]>.5&&phase<U.clamp(f.precip[i]/18,.12,.85)){const rain=f.snow[i]<.3;for(let q=0;q<Math.min(3,1+Math.floor(f.precip[i]/8));q++){const rr=1.015+U.hash(i,q,2)*.07;precP.push(...U.latLonToXYZ(p.lat+(U.hash(i,q,3)-.5)*1.3,p.lon+(U.hash(i,q,4)-.5)*1.3,rr));precC.push(rain?.2:1,rain?.72:1,1,.55);precS.push(rain?2.2:4.2);}}
      if(this.toggles.storms&&f.storm[i]>.68&&phase<f.storm[i]*.35){stormP.push(...U.latLonToXYZ(p.lat,p.lon,1.055));stormC.push(1,.18,.12,.9);stormS.push(10+f.storm[i]*12);}
      if(this.toggles.aurora&&f.aurora[i]>.58&&phase<f.aurora[i]*.7){const r=1.04+U.hash(i,8)*.06;aurP.push(...U.latLonToXYZ(p.lat,p.lon+(time*2)%360,r));const north=p.lat>0;aurC.push(north?.2:.65,north?1:.45,.78,.5);aurS.push(6+f.aurora[i]*10);}
      if(this.toggles.wind&&x%4===0&&y%3===0&&f.windSpeed[i]>4){const start=U.latLonToXYZ(p.lat,p.lon,1.018),scale=.12,lat2=U.clamp(p.lat+f.windV[i]*scale,-89,89),lon2=p.lon+f.windU[i]*scale/Math.max(.2,Math.cos(U.degToRad(p.lat))),end=U.latLonToXYZ(lat2,lon2,1.02);windP.push(...start,...end);const a=U.clamp(.12+f.windSpeed[i]/110,0,.75);windC.push(.18,.88,1,a,.18,.88,1,a);}
    }
    const selP=U.latLonToXYZ(this.selected.lat,this.selected.lon,1.075);stormP.push(...selP);stormC.push(1,1,.3,1);stormS.push(15);
    for(const e of this.engine.events.slice(0,12)){stormP.push(...U.latLonToXYZ(e.lat,e.lon,1.065));stormC.push(1,.36,.12,.85);stormS.push(8+e.severity*10);}
    Object.values(this.weatherGeometry).forEach(d=>this.disposeData(d));
    this.weatherGeometry.clouds=this.makePointData(cloudP,cloudC,cloudS);this.weatherGeometry.precip=this.makePointData(precP,precC,precS);this.weatherGeometry.storms=this.makePointData(stormP,stormC,stormS);this.weatherGeometry.aurora=this.makePointData(aurP,aurC,aurS);this.weatherGeometry.wind=this.makeLineData(windP,windC);
  }

  drawSphere(m){const gl=this.gl,p=this.globeProgram;gl.useProgram(p);this.useAttr(p,'aPosition',this.sphere.pos,3);this.useAttr(p,'aNormal',this.sphere.nor,3);this.useAttr(p,'aUV',this.sphere.uv,2);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uMVP'),false,m.mvp);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uModelView'),false,m.mv);const a=this.engine.getAstronomy(),ang=-a.rotationPhase*Math.PI*2,sun=[Math.cos(a.declination)*Math.cos(ang),Math.sin(a.declination),Math.cos(a.declination)*Math.sin(ang)];gl.uniform3fv(gl.getUniformLocation(p,'uSunView'),new Float32Array(sun));gl.uniform1f(gl.getUniformLocation(p,'uDayNight'),this.toggles.dayNight?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(gl.getUniformLocation(p,'uTexture'),0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphere.idx);gl.drawElements(gl.TRIANGLES,this.sphere.count,gl.UNSIGNED_SHORT,0);}
  drawAtmosphere(m){if(!this.toggles.atmosphere)return;const gl=this.gl,p=this.atmoProgram;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.useProgram(p);this.useAttr(p,'aPosition',this.sphere.pos,3);this.useAttr(p,'aNormal',this.sphere.nor,3);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uMVP'),false,m.mvp);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uModelView'),false,m.mv);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphere.idx);gl.drawElements(gl.TRIANGLES,this.sphere.count,gl.UNSIGNED_SHORT,0);gl.depthMask(true);gl.disable(gl.BLEND);}
  drawPoints(data,m,blend='alpha'){if(!data||!data.count)return;const gl=this.gl,p=this.pointProgram;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,blend==='add'?gl.ONE:gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(p);this.useAttr(p,'aPosition',data.pos,3);this.useAttr(p,'aColor',data.col,4);this.useAttr(p,'aSize',data.size,1);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uMVP'),false,m.mvp);gl.drawArrays(gl.POINTS,0,data.count);gl.depthMask(true);gl.disable(gl.BLEND);}
  drawLines(data,m){if(!data||!data.count)return;const gl=this.gl,p=this.lineProgram;gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(p);this.useAttr(p,'aPosition',data.pos,3);this.useAttr(p,'aColor',data.col,4);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uMVP'),false,m.mvp);gl.drawArrays(gl.LINES,0,data.count);gl.disable(gl.BLEND);}

  render(dt){this.resize();if(this.autoRotate&&!this.dragging)this.yaw+=dt*.000025;this.updateTexture();this.updateWeatherGeometry();const gl=this.gl,m=this.matrices();gl.clearColor(.006,.011,.027,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.disable(gl.CULL_FACE);this.drawPoints(this.stars,m,'add');gl.enable(gl.CULL_FACE);this.drawSphere(m);if(this.toggles.grid)this.drawLines(this.grid,m);this.drawLines(this.weatherGeometry.wind,m);this.drawPoints(this.weatherGeometry.clouds,m);this.drawPoints(this.weatherGeometry.precip,m,'add');this.drawPoints(this.weatherGeometry.aurora,m,'add');this.drawPoints(this.weatherGeometry.storms,m,'add');this.drawAtmosphere(m);}

  setLayer(layer){this.layer=layer;this.updateTexture(true);}
  setSelected(lat,lon){this.selected={lat:U.clamp(lat,-90,90),lon:U.wrapLon(lon)};this.updateWeatherGeometry(true);}
  focus(lat,lon){this.setSelected(lat,lon);this.yaw=-U.degToRad(lon);this.pitch=U.degToRad(lat)*.72;}
  setToggle(name,value){this.toggles[name]=value;this.updateWeatherGeometry(true);}

  bindControls(){const c=this.canvas;
    c.addEventListener('pointerdown',e=>{this.dragging=true;this.pointerStart=[e.clientX,e.clientY];this.lastPointer=[e.clientX,e.clientY];c.setPointerCapture(e.pointerId);});
    c.addEventListener('pointermove',e=>{if(!this.dragging)return;const dx=e.clientX-this.lastPointer[0],dy=e.clientY-this.lastPointer[1];this.yaw+=dx*.006;this.pitch=U.clamp(this.pitch+dy*.006,-1.45,1.45);this.lastPointer=[e.clientX,e.clientY];});
    c.addEventListener('pointerup',e=>{if(!this.dragging)return;this.dragging=false;const moved=Math.hypot(e.clientX-this.pointerStart[0],e.clientY-this.pointerStart[1]);if(moved<5){const ll=this.pick(e.clientX,e.clientY);if(ll&&this.onSelect)this.onSelect(ll.lat,ll.lon);} });
    c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=U.clamp(this.zoom+e.deltaY*.002,1.45,6.8);},{passive:false});
    c.addEventListener('dblclick',e=>{const ll=this.pick(e.clientX,e.clientY);if(ll)this.focus(ll.lat,ll.lon);});
  }
  pick(clientX,clientY){const r=this.canvas.getBoundingClientRect(),nx=(clientX-r.left)/r.width*2-1,ny=1-(clientY-r.top)/r.height*2,aspect=this.canvas.width/this.canvas.height,t=Math.tan(this.fov/2);let dir=U.normalize3([nx*aspect*t,ny*t,-1]),origin=[0,0,this.zoom];dir=U.rotateInvXY(dir,this.pitch,this.yaw);origin=U.rotateInvXY(origin,this.pitch,this.yaw);const b=2*(origin[0]*dir[0]+origin[1]*dir[1]+origin[2]*dir[2]),cc=origin[0]**2+origin[1]**2+origin[2]**2-1,disc=b*b-4*cc;if(disc<0)return null;const tt=(-b-Math.sqrt(disc))/2;if(tt<0)return null;const p=[origin[0]+dir[0]*tt,origin[1]+dir[1]*tt,origin[2]+dir[2]*tt];return U.xyzToLatLon(...p);}
  screenshot(){return this.canvas.toDataURL('image/png');}
}

global.GlobeRenderer=GlobeRenderer;
})(window);
