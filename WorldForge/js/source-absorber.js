const CONTROL_WORDS={
  center:['center globe','recenter','reset camera','home view'],
  rotation:['rotation','auto rotate','autorotate','spin'],
  water:['water','ocean','sea'],
  atmosphere:['atmosphere','cloud','sky'],
  features:['feature','marker','pin','border','route','label'],
  life:['life','creature','fish','whale','shark','plant','npc','ecosystem'],
  eruption:['eruption','volcano','lava','magma'],
  weather:['weather','storm','rain','snow','wind','forecast'],
  cave:['cave','cavern','underground','subterranean'],
  underwater:['underwater','ocean floor','seafloor','reef','trench'],
  settlement:['settlement','city','town','village','capital'],
  exaggeration:['exaggeration','terrain scale','height scale','vertical scale'],
  time:['time speed','simulation speed','fast forward','timeline'],
};

const STYLE_ALLOW=/^(--|color$|background|background-color|border|border-color|border-radius|box-shadow|text-shadow|font-family|font-size|font-weight|opacity|padding|margin|gap|min-width|max-width|width|height|backdrop-filter)/i;
const dangerous=/@import|javascript:|expression\s*\(|behavior\s*:|url\s*\(\s*["']?https?:/ig;

function safeText(v){return String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');}
function slug(v){return safeText(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'module';}
function hash(v){let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return(h>>>0).toString(16).padStart(8,'0');}
function ext(path){const m=String(path).toLowerCase().match(/\.([a-z0-9]+)$/);return m?.[1]||'';}
function findCapability(text){const s=String(text).toLowerCase();for(const [cap,words] of Object.entries(CONTROL_WORDS))if(words.some(w=>s.includes(w)))return cap;return null;}
function parseNumeric(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}

export class SourceAbsorber{
  constructor({log=()=>{},moduleHost=null}={}){
    this.log=log;this.moduleHost=moduleHost;
    this.reset();
  }
  reset(){
    this.files=[];this.controls=[];this.styles=[];this.scripts=[];this.htmlModules=[];this.shaders=[];this.dataSchemas=[];this.geojson=[];this.assets=[];this.decisions=[];this.appliedStyleId='worldforge-absorbed-theme';
  }
  async ingestBlob(blob,path,meta={}){
    path=safeText(path||blob?.name||'upload');const extension=ext(path),record={path,extension,size:blob?.size||meta.size||0,modified:meta.modified||blob?.lastModified||0};
    this.files.push(record);
    try{
      if(['css'].includes(extension)){this.ingestCSS(await blob.text(),path);return record;}
      if(['js','mjs','cjs','ts','tsx','jsx'].includes(extension)){this.ingestJS(await blob.text(),path);return record;}
      if(['html','htm'].includes(extension)){this.ingestHTML(await blob.text(),path);return record;}
      if(['vert','frag','glsl','wgsl'].includes(extension)){this.shaders.push({path,source:await blob.text(),language:extension});this.decisions.push(`Shader source retained: ${path}`);return record;}
      if(['json','geojson'].includes(extension)){
        const value=JSON.parse(await blob.text());
        if(extension==='geojson'||value?.type==='FeatureCollection'||value?.type==='Feature')this.geojson.push({path,value});
        this.inspectData(value,path);return record;
      }
      if(extension==='svg'){
        const text=await blob.text();this.assets.push({path,kind:'svg',text,size:record.size});this.ingestHTML(text,path,true);return record;
      }
      if(['png','jpg','jpeg','webp','gif','bmp','avif','ktx','ktx2','hdr','exr','glb','gltf','obj','fbx','dae','stl','mtl','bin'].includes(extension))this.assets.push({path,kind:['glb','gltf','obj','fbx','dae','stl','mtl'].includes(extension)?'model':'texture',blob,size:record.size});
    }catch(error){this.log(`Source absorber skipped ${path}: ${error.message}`);}
    return record;
  }
  ingestCSS(text,path){
    text=safeText(text).replace(dangerous,'/* removed unsafe reference */');
    const variables={},declarations=[];
    for(const match of text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g))variables[match[1]]=match[2].trim().slice(0,160);
    for(const block of text.matchAll(/([^{}]+)\{([^{}]+)\}/g)){
      const selector=block[1].trim();if(!/(button|select|input|range|slider|menu|panel|module|toggle|control|toolbar|sidebar|card|\.btn|#.*button)/i.test(selector))continue;
      const props=[];for(const d of block[2].split(';')){const i=d.indexOf(':');if(i<1)continue;const key=d.slice(0,i).trim(),value=d.slice(i+1).trim();if(STYLE_ALLOW.test(key)&&!dangerous.test(value))props.push(`${key}:${value}`);dangerous.lastIndex=0;}
      if(props.length)declarations.push({selector,props});
    }
    this.styles.push({path,variables,declarations,rawLength:text.length});
    this.decisions.push(`Absorbed ${Object.keys(variables).length} theme variables and ${declarations.length} compatible control rules from ${path}.`);
  }
  ingestJS(text,path){
    text=safeText(text);const ids=new Set(),events=new Set(),keywords=[];
    for(const m of text.matchAll(/getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)|querySelector\s*\(\s*['"]#([^'"]+)['"]\s*\)/g))ids.add(m[1]||m[2]);
    for(const m of text.matchAll(/addEventListener\s*\(\s*['"]([^'"]+)['"]/g))events.add(m[1]);
    for(const [cap,words] of Object.entries(CONTROL_WORDS))if(words.some(w=>text.toLowerCase().includes(w)))keywords.push(cap);
    const configObjects=[];
    for(const m of text.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(\{[\s\S]{20,2000}?\});/g)){
      if(/(?:config|settings|options|layers|controls|weather|climate|biome|routes|features)/i.test(m[1]))configObjects.push({name:m[1],preview:m[2].slice(0,500)});
    }
    const source={path,ids:[...ids],events:[...events],capabilities:[...new Set(keywords)],configObjects,bytes:text.length};this.scripts.push(source);
    for(const id of ids){const capability=findCapability(`${id} ${path}`);if(capability)this.addControl({id:`absorbed-${slug(id)}-${hash(path)}`,label:id.replace(/[-_]+/g,' '),type:/speed|scale|zoom|opacity|intensity/i.test(id)?'range':'checkbox',capability,source:path});}
    this.decisions.push(`Interpreted ${ids.size} DOM hooks, ${events.size} event types, and ${source.capabilities.length} known capabilities from ${path}; uploaded JavaScript is not executed directly.`);
  }
  ingestHTML(text,path,isSvg=false){
    const doc=new DOMParser().parseFromString(text,isSvg?'image/svg+xml':'text/html');if(!doc)return;
    const module={path,title:doc.querySelector('title,h1,h2')?.textContent?.trim()||path,controls:[]};
    if(!isSvg)for(const el of doc.querySelectorAll('button,input,select')){
      const label=(el.closest('label')?.textContent||el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||el.id||el.name||'Imported control').trim().replace(/\s+/g,' ').slice(0,90);
      const capability=findCapability(`${label} ${el.id} ${el.name} ${path}`);if(!capability)continue;
      const type=el.tagName==='SELECT'?'select':(el.getAttribute('type')||'button').toLowerCase();
      const control={id:`absorbed-${slug(el.id||el.name||label)}-${hash(path)}`,label,type:type==='range'?'range':type==='select'?'select':type==='button'||el.tagName==='BUTTON'?'button':'checkbox',capability,source:path,min:parseNumeric(el.getAttribute('min'),0),max:parseNumeric(el.getAttribute('max'),capability==='exaggeration'?7:100),step:parseNumeric(el.getAttribute('step'),.1),value:el.getAttribute('value')||'',options:[...el.querySelectorAll('option')].map(o=>({value:o.value,label:o.textContent.trim()}))};
      this.addControl(control);module.controls.push(control.id);
    }
    if(module.controls.length)this.htmlModules.push(module);
  }
  inspectData(value,path){
    const text=JSON.stringify(value).slice(0,150000).toLowerCase(),tags=[];
    const tests={geo:/"geometry"|"coordinates"|featurecollection/,weather:/weather|storm|precip|season|annual|monthly|weekly|daily/,caves:/cave|cavern|tunnel|station|passage/,volcano:/volcano|eruption|lava|magma|caldera/,marine:/fish|whale|shark|reef|coral|marine|sea.?life|ecosystem/,settlement:/settlement|city|town|village|capital/,controls:/slider|button|toggle|menu|module|control/,tracking:/tracking|tracker|npc|schedule|route/,topography:/height|elevation|bathym|depth|plate|trench|mountain/};
    for(const [tag,rx] of Object.entries(tests))if(rx.test(text))tags.push(tag);
    this.dataSchemas.push({path,tags,keys:value&&typeof value==='object'?Object.keys(value).slice(0,80):[],value});
    if(tags.includes('controls'))this.controlsFromData(value,path);
    this.decisions.push(`Classified ${path}: ${tags.join(', ')||'general structured data'}.`);
  }
  controlsFromData(value,path){
    const visit=(node,depth=0)=>{if(depth>5||!node||typeof node!=='object')return;if(Array.isArray(node)){node.slice(0,100).forEach(x=>visit(x,depth+1));return;}
      const label=node.label||node.title||node.name||node.id;const capability=label&&findCapability(`${label} ${JSON.stringify(node).slice(0,500)}`);
      if(capability&&(node.type||node.min!=null||node.max!=null||node.toggle!=null))this.addControl({id:`absorbed-${slug(node.id||label)}-${hash(path)}`,label:String(label),type:node.type==='range'||node.min!=null?'range':node.options?'select':'checkbox',capability,source:path,min:parseNumeric(node.min,0),max:parseNumeric(node.max,100),step:parseNumeric(node.step,.1),value:node.value??node.default??'',options:(node.options||[]).map(x=>typeof x==='object'?{value:x.value??x.id,label:x.label??x.name??x.value}:{value:x,label:x})});
      Object.values(node).slice(0,100).forEach(x=>visit(x,depth+1));};visit(value);
  }
  addControl(control){if(this.controls.some(x=>x.id===control.id))return;this.controls.push(control);}
  applyCompatibleStyles(){
    let style=document.getElementById(this.appliedStyleId);if(!style){style=document.createElement('style');style.id=this.appliedStyleId;document.head.append(style);}
    const merged={};for(const s of this.styles)Object.assign(merged,s.variables);
    const safeVars=Object.entries(merged).filter(([k,v])=>STYLE_ALLOW.test(k)&&!dangerous.test(v));dangerous.lastIndex=0;
    const css=[`:root{${safeVars.map(([k,v])=>`${k}:${v}`).join(';')}}`];
    for(const s of this.styles.slice(-20))for(const r of s.declarations.slice(0,80)){const target=/button/i.test(r.selector)?'.absorbed-module button':/select/i.test(r.selector)?'.absorbed-module select':/input|range|slider/i.test(r.selector)?'.absorbed-module input':'.absorbed-module';css.push(`${target}{${r.props.join(';')}}`);}
    style.textContent=css.join('\n');return safeVars.length;
  }
  renderModules(host=this.moduleHost,handler=()=>{}){
    if(!host)return;host.innerHTML='';if(!this.controls.length){host.innerHTML='<p class="hint">No compatible external controls have been detected yet.</p>';return;}
    const groups=new Map();for(const c of this.controls){const key=c.source||'Imported controls';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c);}
    for(const [source,controls] of groups){const box=document.createElement('div');box.className='absorbed-module';box.innerHTML=`<h3>${escapeHTML(source.split('/').pop())}</h3><p>${controls.length} compatible control${controls.length===1?'':'s'} merged</p>`;
      for(const c of controls){const row=document.createElement('label');row.className='absorbed-control';row.dataset.capability=c.capability;let input;
        if(c.type==='button'){input=document.createElement('button');input.type='button';input.textContent=c.label;row.innerHTML='';row.append(input);}
        else if(c.type==='select'){row.append(document.createTextNode(c.label));input=document.createElement('select');for(const o of c.options||[]){const opt=document.createElement('option');opt.value=o.value;opt.textContent=o.label;input.append(opt);}row.append(input);}
        else {input=document.createElement('input');input.type=c.type==='range'?'range':'checkbox';if(c.type==='range'){input.min=c.min;input.max=c.max;input.step=c.step;input.value=c.value||c.min;}row.append(input);row.append(document.createTextNode(' '+c.label));}
        input.addEventListener(c.type==='range'||c.type==='select'?'input':'click',()=>handler(c,input));box.append(row);
      }host.append(box);}
  }
  summary(){return{files:this.files.length,controls:this.controls.length,styles:this.styles.length,scripts:this.scripts.length,htmlModules:this.htmlModules.length,shaders:this.shaders.length,dataSchemas:this.dataSchemas.length,geojson:this.geojson.length,assets:this.assets.length,decisions:this.decisions};}
}

function escapeHTML(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
