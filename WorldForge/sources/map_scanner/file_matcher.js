(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const matcher = {
    files: [],
    folderPaths: [],
    results: [],
    supported: new Set(['png','jpg','jpeg','webp','gif','bmp','svg','html','htm','json','css','js','mjs','cjs','csv','tsv','txt','md'])
  };

  const topoBiomes = (window.BELAVADOS_TOPOGRAPHY?.biomes || []).map(x => x.path);
  const folderPreset = [...new Set(topoBiomes.flatMap(path => [`maps/${path}`, `templates/${path}`]).concat([
    'maps/Forest/Rainforest', 'templates/Forest/Rainforest',
    'maps/settlements', 'maps/provinces', 'maps/topography', 'json/heightmaps', 'geojson/borders', 'geojson/pins'
  ]))];

  const synonymGroups = [
    ['coast','coastal','beach','shore','shoreline','sand','sandy','littoral'],
    ['water','river','rivers','lake','lakes','canal','stream','creek','bay','harbor','harbour','sea','ocean','aquatic','underwater'],
    ['reef','reefs','coral','shallows','shoal','shoals'],
    ['forest','forests','tree','trees','wood','woods','woodland','jungle','rainforest','sylvan'],
    ['grass','grassland','grassy','plain','plains','prairie','meadow','field','fields'],
    ['farm','farms','farming','farmland','crop','crops','rural'],
    ['marsh','marshes','swamp','swamps','wetland','wetlands','mire','fen','bog'],
    ['mountain','mountains','mountainous','range','peak','peaks','cliff','cliffs','rock','rocky','height','elevation'],
    ['cavern','cave','caves','deep','underground','subterranean'],
    ['valley','vale','basin','hollow','trench','abyss'],
    ['town','city','village','capital','settlement','urban','ruins','streets'],
    ['template','templates','html','interactive'],
    ['map','maps','image','png','jpg','jpeg','webp','heightmap','topography']
  ];
  const synonymIndex = new Map();
  synonymGroups.forEach(group => group.forEach(word => synonymIndex.set(word, group[0])));
  const stopWords = new Set(['and','or','of','the','a','an','with','without','for','to','in','on','by','from','into','inside','outside','surface','floating','hybrid','partial','1','2','3','4','5','6','7','8','9','0']);

  function status(message){
    const target = $('fileMatchSummary');
    if(target) target.textContent = message;
    window.BelavadosScannerAPI?.setStatus?.(message);
  }
  function esc(value){ return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function canonicalToken(token){
    let t = String(token || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
    if(!t || stopWords.has(t)) return '';
    if(t.endsWith('ies') && t.length > 4) t = t.slice(0,-3) + 'y';
    else if(t.endsWith('s') && t.length > 3) t = t.slice(0,-1);
    return synonymIndex.get(t) || t;
  }
  function tokenize(value){
    return String(value || '').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_\-./\\#?=&:;,[\](){}]+/g,' ').split(/\s+/).map(canonicalToken).filter(Boolean);
  }
  function extension(name){ return String(name || '').split('.').pop().toLowerCase(); }
  function isImage(file){ return String(file.type || '').startsWith('image/') || ['png','jpg','jpeg','webp','gif','bmp','svg'].includes(extension(file.name)); }
  function isText(file){ return ['html','htm','json','css','js','mjs','cjs','svg','csv','tsv','txt','md'].includes(extension(file.name)) || /^text\//.test(file.type || '') || /json|javascript/.test(file.type || ''); }
  function rgbToHsv(r,g,b){
    r/=255; g/=255; b/=255; const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min; let h=0;
    if(d){ if(max===r) h=(g-b)/d+(g<b?6:0); else if(max===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; }
    return {h,s:max?d/max:0,v:max};
  }
  function rgbToHex(r,g,b){ return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
  function terrainToken(r,g,b){
    const hsv=rgbToHsv(r,g,b), lum=.2126*r+.7152*g+.0722*b;
    if(hsv.h>=175 && hsv.h<=255 && hsv.s>.2) return lum<62?'ocean':'water';
    if(hsv.h>=75 && hsv.h<=165 && hsv.s>.18) return hsv.v<.38?'forest':'grass';
    if(hsv.h>=20 && hsv.h<=68 && hsv.s>.16) return hsv.v>.68?'coast':'mountain';
    if(hsv.s<.16 && hsv.v>.72) return 'snow';
    if(lum<54) return 'cavern';
    if(hsv.h<25 && hsv.s>.25) return 'canyon';
    return 'land';
  }
  function folderPathsFromFiles(files){
    const paths=new Set();
    for(const file of files){
      const parts=(file.webkitRelativePath || file.name).split('/').filter(Boolean);
      for(let i=1;i<parts.length;i++) paths.add(parts.slice(0,i).join('/'));
    }
    return [...paths];
  }
  function currentFolders(){
    const manual = ($('folderNames')?.value || '').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    return [...new Set([...manual, ...matcher.folderPaths])];
  }
  function collectFiles(list){
    const added=[];
    for(const file of list || []){
      if(matcher.supported.has(extension(file.name)) || isImage(file) || isText(file)){
        if(!matcher.files.some(old => (old.webkitRelativePath||old.name)===(file.webkitRelativePath||file.name) && old.size===file.size)) matcher.files.push(file);
        added.push(file);
      }
    }
    matcher.folderPaths=[...new Set([...matcher.folderPaths, ...folderPathsFromFiles(added)])];
    if($('folderNames') && matcher.folderPaths.length) $('folderNames').value=currentFolders().join('\n');
    renderSummary(false);
  }
  function readText(file){ return new Promise(resolve => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||'')); reader.onerror=()=>resolve(''); reader.readAsText(file); }); }
  function loadImage(file){ return new Promise(resolve => { const url=URL.createObjectURL(file), img=new Image(); img.onload=()=>{URL.revokeObjectURL(url);resolve(img)}; img.onerror=()=>{URL.revokeObjectURL(url);resolve(null)}; img.src=url; }); }
  function imageFeatures(img){
    const canvas=document.createElement('canvas'), max=112, scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)); canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    const context=canvas.getContext('2d',{willReadFrequently:true}); context.drawImage(img,0,0,canvas.width,canvas.height);
    const data=context.getImageData(0,0,canvas.width,canvas.height).data, counts=new Map(); let sr=0,sg=0,sb=0,n=0;
    for(let i=0;i<data.length;i+=16){ if(data[i+3]<12) continue; const token=terrainToken(data[i],data[i+1],data[i+2]); counts.set(token,(counts.get(token)||0)+1); sr+=data[i];sg+=data[i+1];sb+=data[i+2];n++; }
    const top=[...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6), tokens=top.filter(([,count])=>count/Math.max(1,n)>.035).map(([token])=>canonicalToken(token)).filter(Boolean);
    return {visualTokens:[...new Set(tokens)],dominant:top,averageColor:rgbToHex(sr/Math.max(1,n),sg/Math.max(1,n),sb/Math.max(1,n)),size:{width:img.naturalWidth||img.width,height:img.naturalHeight||img.height}};
  }
  function textTokens(text){
    const refs=[], re=/(?:src|href|url|file|template|map|image|background|import)\s*[:=]\s*["'`(]?([^"'`)\s,;]+)|url\(["']?([^"')]+)["']?\)/gi; let match;
    while((match=re.exec(text)) && refs.length<100) refs.push(match[1]||match[2]||'');
    return [...tokenize(refs.join(' ')), ...tokenize(text).slice(0,700)];
  }
  async function describe(file){
    const path=file.webkitRelativePath||file.name, ext=extension(file.name), descriptor={name:file.name,path,type:file.type||ext,ext,nameTokens:tokenize(path.replace(/\.[^.]+$/,'')),contentTokens:[],visualTokens:[],image:null};
    if(isImage(file) && ext!=='svg'){ const img=await loadImage(file); if(img){descriptor.image=imageFeatures(img);descriptor.visualTokens=descriptor.image.visualTokens;} }
    if(isText(file)){ descriptor.contentTokens=textTokens(await readText(file)); if(ext==='svg') descriptor.visualTokens=descriptor.contentTokens.filter(t=>['water','forest','grass','mountain','coast','reef','marsh','snow','urban','cavern'].includes(t)); }
    return descriptor;
  }
  function folderDescriptor(path){ const parts=String(path).split(/[\\/]+/).filter(Boolean), leaf=parts.at(-1)||path; return {path,tokens:tokenize(path),leafTokens:tokenize(leaf)}; }
  function fuzzy(a,b){
    if(a===b) return 1; if(!a||!b) return 0;
    if(a.includes(b)||b.includes(a)) return Math.min(a.length,b.length)/Math.max(a.length,b.length)>=.55?.86:.55;
    const grams=s=>{const out=new Set();for(let i=0;i<s.length-1;i++)out.add(s.slice(i,i+2));return out}, A=grams(a),B=grams(b); if(!A.size||!B.size)return 0; let same=0;A.forEach(x=>{if(B.has(x))same++});return 2*same/(A.size+B.size);
  }
  function coverage(source,target){ if(!source.length||!target.length)return 0; return source.reduce((sum,s)=>sum+Math.max(...target.map(t=>fuzzy(s,t))),0)/source.length; }
  function score(desc,folder){
    const names=[...new Set(desc.nameTokens)], content=[...new Set(desc.contentTokens)].slice(0,140), visual=[...new Set(desc.visualTokens)], path=[...new Set(folder.tokens)], leaf=[...new Set(folder.leafTokens.length?folder.leafTokens:path)];
    const nameLeaf=coverage(names,leaf),namePath=coverage(names,path),folderName=coverage(leaf,names),contentPath=content.length?Math.max(coverage(content,path),coverage(path,content)*.82):0,visualPath=visual.length?Math.max(coverage(visual,path),coverage(leaf,visual)):0;
    const value=visual.length?Math.max(namePath*.42+visualPath*.58,nameLeaf*.35+visualPath*.65,(namePath+visualPath+folderName)/3):Math.max(namePath*.72+contentPath*.28,nameLeaf*.72+contentPath*.28,(namePath+folderName)/2);
    return {score:Math.max(0,Math.min(1,value)),matched:[...new Set([...names,...visual].filter(t=>path.some(ft=>fuzzy(t,ft)>=.78)))]};
  }
  async function scan(){
    const folders=currentFolders().map(folderDescriptor); if(!matcher.files.length){status('Upload or select files first.');return;} if(!folders.length){status('Add folder names or choose a directory first.');return;}
    const threshold=Number($('matchThreshold')?.value||80)/100, results=[];
    for(let i=0;i<matcher.files.length;i++){
      status(`Scanning ${i+1}/${matcher.files.length} file(s) against ${folders.length} folder paths…`);
      const file=await describe(matcher.files[i]), ranked=folders.map(folder=>({folder,...score(file,folder)})).sort((a,b)=>b.score-a.score).slice(0,5), best=ranked[0];
      results.push({file,bestFolder:best?.folder.path||'',score:best?.score||0,autoSort:(best?.score||0)>=threshold,topMatches:ranked.map(x=>({folder:x.folder.path,score:x.score,matched:x.matched}))});
      await new Promise(requestAnimationFrame);
    }
    matcher.results=results.sort((a,b)=>b.score-a.score||a.file.path.localeCompare(b.file.path)); renderSummary(true);
  }
  function renderSummary(done,message){
    if(message){status(message);return;} const threshold=Number($('matchThreshold')?.value||80);
    if(!done){status(`Loaded ${matcher.files.length} supported file(s). Folder paths: ${currentFolders().length}. Auto-sort threshold: ${threshold}%.`);return;}
    const auto=matcher.results.filter(x=>x.autoSort).length; status(`File scan complete: ${auto}/${matcher.results.length} met the ${threshold}% threshold; lower scores remain visible for manual review.`);
    const rows=matcher.results.map(result=>{const percent=Math.round(result.score*100),cls=percent>=threshold?'matchGood':percent>=60?'matchLow':'matchBad',signals=[...new Set([...(result.file.nameTokens||[]),...(result.file.visualTokens||[]),...(result.file.contentTokens||[]).slice(0,8)])].slice(0,14).join(', '),alts=result.topMatches.slice(1,4).map(x=>`${esc(x.folder)} (${Math.round(x.score*100)}%)`).join('<br>');return `<tr><td>${esc(result.file.path)}</td><td>${esc(result.file.ext.toUpperCase())}</td><td class="${cls}">${percent}%</td><td>${result.autoSort?'Auto-sort':'Review'}</td><td>${esc(result.bestFolder)}</td><td class="matchReason">${esc(signals)}</td><td class="matchReason">${alts||'—'}</td></tr>`}).join('');
    $('fileMatchTableWrap').innerHTML=`<table class="scanTable"><thead><tr><th>File</th><th>Type</th><th>Match</th><th>Action</th><th>Best folder</th><th>Signals scanned</th><th>Next closest</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No files scanned yet.</td></tr>'}</tbody></table>`;
  }
  function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
  function exportManifest(){
    const threshold=Number($('matchThreshold')?.value||80)/100, manifest={version:3,kind:'fantasy-file-map-folder-match-manifest',threshold,generatedAt:new Date().toISOString(),topographySource:window.BELAVADOS_TOPOGRAPHY?.source,folders:currentFolders(),results:matcher.results.map(result=>({file:result.file.path,extension:result.file.ext,mime:result.file.type,bestFolder:result.bestFolder,score:Number(result.score.toFixed(4)),autoSort:result.autoSort,image:result.file.image,signals:{nameTokens:result.file.nameTokens,visualTokens:result.file.visualTokens,contentTokens:[...new Set(result.file.contentTokens||[])].slice(0,100)},topMatches:result.topMatches.map(match=>({folder:match.folder,score:Number(match.score.toFixed(4)),matched:match.matched}))}))};
    download('fantasy-file-map-folder-match-manifest.json',JSON.stringify(manifest,null,2),'application/json');
  }
  function init(){
    if(!$('scanFiles')) return;
    $('scanFiles').addEventListener('change',e=>collectFiles(e.target.files)); $('scanDirectory').addEventListener('change',e=>collectFiles(e.target.files));
    $('loadBelavadosFoldersBtn').addEventListener('click',()=>{$('folderNames').value=folderPreset.join('\n');matcher.folderPaths=[];renderSummary(false);});
    $('clearMatcherBtn').addEventListener('click',()=>{matcher.files=[];matcher.folderPaths=[];matcher.results=[];$('folderNames').value='';$('fileMatchTableWrap').innerHTML='';renderSummary(false);});
    $('matchThreshold').addEventListener('input',e=>{$('matchThresholdValue').textContent=e.target.value+'%';renderSummary(Boolean(matcher.results.length));});
    $('scanFileMatchesBtn').addEventListener('click',scan); $('exportMatchManifestBtn').addEventListener('click',exportManifest); renderSummary(false);
    window.BelavadosFileMatcher={getState:()=>({fileCount:matcher.files.length,folderCount:currentFolders().length,resultCount:matcher.results.length,threshold:Number($('matchThreshold')?.value||80)})};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
