(() => {
  'use strict';
  const $=id=>document.getElementById(id),topography=window.BELAVADOS_TOPOGRAPHY,core=window.BelavadosTerrainCore;
  const state={field:null,mesh:null,gl:null,program:null,buffers:{},locations:{},rotationX:-.24,rotationY:-.48,zoom:1,dragging:false,lastPointer:null,autoRotate:true,lastTime:0,view:'2d',dirty:true};

  function setTerrainStatus(message,isError=false){const el=$('terrainStatus');if(el){el.textContent=message;el.classList.toggle('is-error',isError);}}
  function setScannerStatus(message){window.BelavadosScannerAPI?.setStatus?.(message);}
  function fmt(value){return Number(value||0).toLocaleString(undefined,{maximumFractionDigits:1});}
  function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),800);}
  function switchView(view){
    state.view=view;const map=$('canvasWrap'),panel=$('terrain3dPanel');if(map)map.hidden=view!=='2d';if(panel)panel.hidden=view!=='3d';$('view2dBtn')?.classList.toggle('active',view==='2d');$('view3dBtn')?.classList.toggle('active',view==='3d');
    if(view==='3d'){resizeCanvas();if(!state.field)buildTerrain();}
  }

  function getGridSize(){const width=Number($('terrainDetail')?.value||128);return {width,height:Math.max(24,Math.round(width/2))};}
  function sourceImageData(){
    const source=window.BelavadosScannerAPI?.getMapCanvas?.()||$('mapCanvas');if(!source||!source.width||!source.height)throw new Error('Load or create a map image first.');
    const size=getGridSize(),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(source,0,0,size.width,size.height);return context.getImageData(0,0,size.width,size.height);
  }
  function buildTerrain(){
    try{
      if(!core||!topography)throw new Error('The topography engine did not load.');
      setTerrainStatus('Building continuous heightfield: classifying colors, rejecting outliers, smoothing biome transitions, and limiting slopes…');
      const imageData=sourceImageData(),options={maxSlopeMeters:Number($('maxSlope')?.value||650),smoothingRadius:Number($('smoothRadius')?.value||2),smoothingPasses:Number($('smoothPasses')?.value||4)};
      state.field=core.buildHeightfield(imageData,topography,options);state.dirty=false;updateMesh();updateStats();switchView('3d');setTerrainStatus(`3D terrain ready. Surface spans ${fmt(state.field.diagnostics.minMeters)} m to ${fmt(state.field.diagnostics.maxMeters)} m with ${state.field.diagnostics.remainingSpikeEdges} remaining spike edges.`);setScannerStatus('Spike-safe 3D globe terrain generated from the map and Belavadös hexcode/topography rules.');
    }catch(error){setTerrainStatus(error.message,true);}
  }
  function updateStats(){
    const d=state.field?.diagnostics;if(!d)return;$('terrainStats').innerHTML=[
      ['Grid',`${state.field.width} × ${state.field.height}`],['Highest high',`${fmt(d.maxMeters)} m`],['Lowest low',`${fmt(d.minMeters)} m`],['Maximum neighbor change',`${fmt(d.maxNeighborDeltaMeters)} m`],['Slope ceiling',`${fmt(d.cellSlopeLimitMeters)} m/cell`],['Outliers repaired',fmt(d.outlierCorrections)],['Slope corrections',fmt(d.slopeClamps)],['Remaining spike edges',fmt(d.remainingSpikeEdges)],['Exact hex matches',`${fmt(d.exactHexMatchPercent)}%`],['Cavern handling','separate subsurface channel']
    ].map(([key,value])=>`<div><span>${key}</span><b>${value}</b></div>`).join('');
  }

  function normalize3(x,y,z){const len=Math.hypot(x,y,z)||1;return [x/len,y/len,z/len];}
  function meshNormals(positions,indices){
    const normals=new Float32Array(positions.length);
    for(let i=0;i<indices.length;i+=3){const ia=indices[i]*3,ib=indices[i+1]*3,ic=indices[i+2]*3,ax=positions[ib]-positions[ia],ay=positions[ib+1]-positions[ia+1],az=positions[ib+2]-positions[ia+2],bx=positions[ic]-positions[ia],by=positions[ic+1]-positions[ia+1],bz=positions[ic+2]-positions[ia+2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;for(const j of [ia,ib,ic]){normals[j]+=nx;normals[j+1]+=ny;normals[j+2]+=nz;}}
    for(let i=0;i<normals.length;i+=3){const n=normalize3(normals[i],normals[i+1],normals[i+2]);normals[i]=n[0];normals[i+1]=n[1];normals[i+2]=n[2];}return normals;
  }
  function buildMesh(field,mode,exaggeration){
    const w=field.width,h=field.height,mw=w+1,vertexCount=mw*h,positions=new Float32Array(vertexCount*3),colors=new Float32Array(vertexCount*3),waterPositions=new Float32Array(vertexCount*3),indices=[],waterIndices=[];
    for(let y=0;y<h;y++)for(let x=0;x<=w;x++){
      const sourceX=x===w?0:x,i=y*w+sourceX,v=(y*mw+x)*3,height=field.elevations[i],radial=.055*exaggeration*(height<0?height/8200:height/5200),red=field.colors[i*3]/255,green=field.colors[i*3+1]/255,blue=field.colors[i*3+2]/255;
      if(mode==='globe'){
        const lon=(x/w-.5)*Math.PI*2,lat=(.5-y/(h-1))*Math.PI,radius=1+radial,cl=Math.cos(lat),nx=cl*Math.sin(lon),ny=Math.sin(lat),nz=cl*Math.cos(lon);positions[v]=nx*radius;positions[v+1]=ny*radius;positions[v+2]=nz*radius;waterPositions[v]=nx*1.001;waterPositions[v+1]=ny*1.001;waterPositions[v+2]=nz*1.001;
      }else{
        positions[v]=(x/w-.5)*3.3;positions[v+1]=(.5-y/(h-1))*1.78;positions[v+2]=radial*3.2;waterPositions[v]=positions[v];waterPositions[v+1]=positions[v+1];waterPositions[v+2]=.002;
      }
      const shade=height<0?lerp(.7,.96,1-Math.abs(height)/8200):lerp(.86,1.08,height/5200);colors[v]=Math.min(1,red*shade);colors[v+1]=Math.min(1,green*shade);colors[v+2]=Math.min(1,blue*shade);
    }
    for(let y=0;y<h-1;y++)for(let x=0;x<w;x++){
      const a=y*mw+x,b=a+1,c=a+mw,d=c+1;indices.push(a,c,b,b,c,d);const si=y*w+x,sr=y*w+(x+1)%w,sd=(y+1)*w+x,sdr=(y+1)*w+(x+1)%w;if(field.elevations[si]<0||field.elevations[sr]<0||field.elevations[sd]<0||field.elevations[sdr]<0)waterIndices.push(a,c,b,b,c,d);
    }
    const typedIndices=new Uint16Array(indices),normals=meshNormals(positions,typedIndices),waterNormals=new Float32Array(waterPositions.length),waterColors=new Float32Array(waterPositions.length);
    for(let i=0;i<waterPositions.length;i+=3){const n=mode==='globe'?normalize3(waterPositions[i],waterPositions[i+1],waterPositions[i+2]):[0,0,1];waterNormals.set(n,i);waterColors.set([.05,.42,.78],i);}
    return {positions,normals,colors,waterPositions,waterNormals,waterColors,indices:typedIndices,waterIndices:new Uint16Array(waterIndices),mw,h,mode};
  }
  function lerp(a,b,t){return a+(b-a)*Math.max(0,Math.min(1,t));}

  function shader(gl,type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Shader compilation failed');return shader;}
  function initGl(){
    if(state.gl)return true;const canvas=$('globeCanvas'),gl=canvas?.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});if(!gl){setTerrainStatus('WebGL is unavailable in this browser. The heightfield can still be exported as JSON.',true);return false;}
    const vertex=shader(gl,gl.VERTEX_SHADER,`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform mat4 uMvp;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vColor;void main(){gl_Position=uMvp*vec4(aPosition,1.0);vNormal=mat3(uModel)*aNormal;vColor=aColor;}`),fragment=shader(gl,gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 vNormal;varying vec3 vColor;uniform float uOpacity;void main(){vec3 lightDir=normalize(vec3(-.38,.72,.58));float light=.26+max(dot(normalize(vNormal),lightDir),0.0)*.74;float rim=pow(1.0-max(abs(normalize(vNormal).z),0.0),2.0)*.14;gl_FragColor=vec4(vColor*(light+rim),uOpacity);}`),program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'WebGL link failed');
    state.gl=gl;state.program=program;state.locations={position:gl.getAttribLocation(program,'aPosition'),normal:gl.getAttribLocation(program,'aNormal'),color:gl.getAttribLocation(program,'aColor'),mvp:gl.getUniformLocation(program,'uMvp'),model:gl.getUniformLocation(program,'uModel'),opacity:gl.getUniformLocation(program,'uOpacity')};state.buffers={position:gl.createBuffer(),normal:gl.createBuffer(),color:gl.createBuffer(),index:gl.createBuffer(),waterPosition:gl.createBuffer(),waterNormal:gl.createBuffer(),waterColor:gl.createBuffer(),waterIndex:gl.createBuffer()};return true;
  }
  function uploadBuffer(buffer,target,data,usage){const gl=state.gl;gl.bindBuffer(target,buffer);gl.bufferData(target,data,usage||gl.STATIC_DRAW);}
  function updateMesh(){
    if(!state.field)return;const mode=$('terrainMode')?.value||'globe',exaggeration=Number($('verticalExaggeration')?.value||1.35);$('verticalExaggerationValue').textContent=exaggeration.toFixed(2)+'×';state.mesh=buildMesh(state.field,mode,exaggeration);if(!initGl())return;const gl=state.gl,b=state.buffers,m=state.mesh;uploadBuffer(b.position,gl.ARRAY_BUFFER,m.positions);uploadBuffer(b.normal,gl.ARRAY_BUFFER,m.normals);uploadBuffer(b.color,gl.ARRAY_BUFFER,m.colors);uploadBuffer(b.index,gl.ELEMENT_ARRAY_BUFFER,m.indices);uploadBuffer(b.waterPosition,gl.ARRAY_BUFFER,m.waterPositions);uploadBuffer(b.waterNormal,gl.ARRAY_BUFFER,m.waterNormals);uploadBuffer(b.waterColor,gl.ARRAY_BUFFER,m.waterColors);uploadBuffer(b.waterIndex,gl.ELEMENT_ARRAY_BUFFER,m.waterIndices);
  }

  function identity(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
  function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let sum=0;for(let k=0;k<4;k++)sum+=a[k*4+r]*b[c*4+k];out[c*4+r]=sum;}return out;}
  function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far),out=new Float32Array(16);out[0]=f/aspect;out[5]=f;out[10]=(far+near)*nf;out[11]=-1;out[14]=2*far*near*nf;return out;}
  function translate(x,y,z){const out=identity();out[12]=x;out[13]=y;out[14]=z;return out;}
  function rotateX(angle){const c=Math.cos(angle),s=Math.sin(angle),out=identity();out[5]=c;out[6]=s;out[9]=-s;out[10]=c;return out;}
  function rotateY(angle){const c=Math.cos(angle),s=Math.sin(angle),out=identity();out[0]=c;out[2]=-s;out[8]=s;out[10]=c;return out;}
  function scale(x,y,z){const out=identity();out[0]=x;out[5]=y;out[10]=z;return out;}
  function bindAttributes(position,normal,color){const gl=state.gl,l=state.locations,b=state.buffers;gl.bindBuffer(gl.ARRAY_BUFFER,position);gl.enableVertexAttribArray(l.position);gl.vertexAttribPointer(l.position,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.enableVertexAttribArray(l.normal);gl.vertexAttribPointer(l.normal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,color);gl.enableVertexAttribArray(l.color);gl.vertexAttribPointer(l.color,3,gl.FLOAT,false,0,0);}
  function resizeCanvas(){const canvas=$('globeCanvas');if(!canvas)return;const ratio=Math.min(2,window.devicePixelRatio||1),width=Math.max(1,Math.floor(canvas.clientWidth*ratio)),height=Math.max(1,Math.floor(canvas.clientHeight*ratio));if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}}
  function draw(time){
    requestAnimationFrame(draw);if(state.view!=='3d'||!state.mesh||!state.gl)return;resizeCanvas();if(state.autoRotate&&time-state.lastTime<80)state.rotationY+=(time-state.lastTime)*.000055;state.lastTime=time;
    const gl=state.gl,canvas=$('globeCanvas'),mode=state.mesh.mode;gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(.008,.025,.04,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.useProgram(state.program);
    const aspect=canvas.width/canvas.height,projection=perspective(Math.PI/4,aspect,.05,20),distance=mode==='globe'?3.05/state.zoom:4.1/state.zoom,view=translate(0,0,-distance),rotation=multiply(rotateX(state.rotationX+(mode==='flat'?-.62:0)),rotateY(state.rotationY)),model=mode==='flat'?multiply(rotation,scale(1,1,1)):rotation,mvp=multiply(projection,multiply(view,model));gl.uniformMatrix4fv(state.locations.mvp,false,mvp);gl.uniformMatrix4fv(state.locations.model,false,model);
    bindAttributes(state.buffers.position,state.buffers.normal,state.buffers.color);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,state.buffers.index);gl.uniform1f(state.locations.opacity,1);gl.drawElements(gl.TRIANGLES,state.mesh.indices.length,gl.UNSIGNED_SHORT,0);
    if($('waterShell')?.checked&&state.mesh.waterIndices.length){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);bindAttributes(state.buffers.waterPosition,state.buffers.waterNormal,state.buffers.waterColor);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,state.buffers.waterIndex);gl.uniform1f(state.locations.opacity,.18);gl.drawElements(gl.TRIANGLES,state.mesh.waterIndices.length,gl.UNSIGNED_SHORT,0);gl.depthMask(true);gl.disable(gl.BLEND);}
  }

  function exportHeightmap(){
    if(!state.field){setTerrainStatus('Build terrain before exporting.',true);return;}const f=state.field,rows=[];for(let y=0;y<f.height;y++){const row=[];for(let x=0;x<f.width;x++)row.push(Number(f.elevations[y*f.width+x].toFixed(1)));rows.push(row);}const caverns=[];for(let i=0;i<f.subsurfaceDepths.length;i++)if(f.subsurfaceDepths[i]>0)caverns.push({x:i%f.width,y:Math.floor(i/f.width),depthMeters:Number(f.subsurfaceDepths[i].toFixed(1))});
    const data={schema:'belavados.continuous-heightfield.v2',generatedAt:new Date().toISOString(),source:topography.source,coordinateSystem:'equirectangular grid; x wraps at ±180°, y spans +90° to -90°',width:f.width,height:f.height,globalLimitsMeters:topography.globalLimitsMeters,continuityRules:topography.continuityRules,diagnostics:f.diagnostics,surfaceElevationMeters:rows,subsurfaceCavernCells:caverns};download('belavados-continuous-heightfield.json',JSON.stringify(data,null,2),'application/json');
  }
  function exportObj(){
    if(!state.mesh){setTerrainStatus('Build terrain before exporting.',true);return;}const m=state.mesh,lines=['# Belavados spike-safe 3D terrain mesh',`# mode ${m.mode}`];for(let i=0;i<m.positions.length;i+=3)lines.push(`v ${m.positions[i].toFixed(6)} ${m.positions[i+1].toFixed(6)} ${m.positions[i+2].toFixed(6)}`);for(let y=0;y<m.h;y++)for(let x=0;x<m.mw;x++)lines.push(`vt ${(x/(m.mw-1)).toFixed(6)} ${(1-y/(m.h-1)).toFixed(6)}`);for(let i=0;i<m.normals.length;i+=3)lines.push(`vn ${m.normals[i].toFixed(6)} ${m.normals[i+1].toFixed(6)} ${m.normals[i+2].toFixed(6)}`);for(let i=0;i<m.indices.length;i+=3){const a=m.indices[i]+1,b=m.indices[i+1]+1,c=m.indices[i+2]+1;lines.push(`f ${a}/${a}/${a} ${b}/${b}/${b} ${c}/${c}/${c}`);}download(`belavados-${m.mode}-terrain.obj`,lines.join('\n'),'text/plain');
  }
  function exportPng(){const canvas=$('globeCanvas');if(!canvas||!state.mesh)return;const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='belavados-3d-terrain-preview.png';a.click();}
  function exportSnapshot(){return state.field?{schema:'belavados.terrain3d-snapshot.v2',width:state.field.width,height:state.field.height,diagnostics:state.field.diagnostics,mode:state.mesh?.mode||$('terrainMode')?.value,verticalExaggeration:Number($('verticalExaggeration')?.value||1.35),continuityRules:topography.continuityRules}:null;}

  function parseCsvLine(line){
    const fields=[];let value='',quoted=false;
    for(let i=0;i<line.length;i++){const char=line[i];if(char==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(char===','&&!quoted){fields.push(value);value='';}else value+=char;}fields.push(value);return fields;
  }
  async function loadFullHexTable(file){
    if(!file)return;const status=$('fullHexStatus');status.textContent=`Reading ${file.name} without replacing the compact runtime…`;let count=0,leftover='',header=true;const decoder=new TextDecoder();
    function process(text,final=false){
      const lines=(leftover+text).split(/\r?\n/);leftover=final?'':lines.pop()||'';
      for(const line of lines){if(!line)continue;if(header){header=false;continue;}const fields=parseCsvLine(line),hex=String(fields[0]||'').replace('#','').toUpperCase(),regionKey=Number(fields[18]),confidence=Number(fields[21]),pixels=Number(fields[5]);if(/^[0-9A-F]{6}$/.test(hex)&&Number.isFinite(regionKey)){topography.topHexes[hex]=[regionKey,Number.isFinite(confidence)?confidence:0,Number.isFinite(pixels)?pixels:0];count++;}}
    }
    try{
      if(file.stream){const reader=file.stream().getReader();while(true){const part=await reader.read();if(part.done)break;process(decoder.decode(part.value,{stream:true}));if(count&&count%25000<500)status.textContent=`Loaded ${count.toLocaleString()} exact colors…`;await new Promise(resolve=>setTimeout(resolve,0));}process(decoder.decode(),true);if(leftover)process('\n',true);}
      else process(await file.text(),true);
      state.dirty=true;status.textContent=`Loaded ${count.toLocaleString()} exhaustive exact hex colors. Rebuild the terrain to apply them.`;setTerrainStatus('Full unique-hex precision table loaded. Press Build / rebuild 3D terrain.');
    }catch(error){status.textContent=`Could not load the full precision table: ${error.message}`;}
  }

  async function loadDefault(){
    try{setTerrainStatus('Loading the Belavadös realism/topography map…');await window.BelavadosScannerAPI?.loadImageUrl?.(topography.defaultMap,'Belavadös realism/topography map');buildTerrain();}catch(error){setTerrainStatus(`Could not load the included map automatically: ${error.message}. Use the Map image picker instead.`,true);}
  }
  function resetView(){state.rotationX=-.24;state.rotationY=-.48;state.zoom=1;}
  function initInteractions(){
    const canvas=$('globeCanvas');if(!canvas)return;
    canvas.addEventListener('pointerdown',event=>{state.dragging=true;state.lastPointer=[event.clientX,event.clientY];canvas.setPointerCapture(event.pointerId);});
    canvas.addEventListener('pointermove',event=>{if(!state.dragging)return;const dx=event.clientX-state.lastPointer[0],dy=event.clientY-state.lastPointer[1];state.rotationY+=dx*.008;state.rotationX=Math.max(-1.45,Math.min(1.45,state.rotationX+dy*.008));state.lastPointer=[event.clientX,event.clientY];});
    const end=()=>{state.dragging=false;state.lastPointer=null};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('wheel',event=>{event.preventDefault();state.zoom=Math.max(.55,Math.min(2.1,state.zoom*(event.deltaY<0?1.08:.92)));},{passive:false});
  }
  function init(){
    if(!$('terrain3dPanel'))return;$('view2dBtn').addEventListener('click',()=>switchView('2d'));$('view3dBtn').addEventListener('click',()=>switchView('3d'));$('buildTerrainBtn').addEventListener('click',buildTerrain);$('loadBelavadosMapBtn').addEventListener('click',loadDefault);$('resetTerrainViewBtn').addEventListener('click',resetView);$('exportHeightmapBtn').addEventListener('click',exportHeightmap);$('exportTerrainObjBtn').addEventListener('click',exportObj);$('save3dPngBtn').addEventListener('click',exportPng);
    $('terrainMode').addEventListener('change',updateMesh);$('verticalExaggeration').addEventListener('input',updateMesh);$('autoRotateTerrain').addEventListener('change',event=>state.autoRotate=event.target.checked);$('fullHexCsvFile').addEventListener('change',event=>loadFullHexTable(event.target.files[0]));['maxSlope','smoothRadius','smoothPasses','terrainDetail'].forEach(id=>$(id).addEventListener('change',()=>{state.dirty=true;setTerrainStatus('Terrain settings changed. Press Build / rebuild 3D terrain to apply them.');}));
    window.addEventListener('scanner-map-updated',event=>{state.dirty=true;setTerrainStatus(`${event.detail?.label||'Map'} is ready. Build the continuous 3D terrain when ready.`);});window.addEventListener('resize',resizeCanvas);initInteractions();initGl();requestAnimationFrame(draw);switchView('2d');window.BelavadosTerrain3D={build:buildTerrain,exportSnapshot,getField:()=>state.field,switchView};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
