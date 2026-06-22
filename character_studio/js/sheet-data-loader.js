(async function(){
  'use strict';
  const DATA = [{"id": "bddSourceData", "path": "data/sheet/bddSourceData.json", "context": "sheet"}, {"id": "bddBiomeData", "path": "data/sheet/bddBiomeData.json", "context": "sheet"}, {"id": "bddPronounData", "path": "data/sheet/bddPronounData.json", "context": "sheet"}, {"id": "bddTitleData", "path": "data/sheet/bddTitleData.json", "context": "sheet"}];
  const SCRIPTS = ["js/sheet/dropdown-builder.js", "js/sheet/character-sheet-core.js", "js/sheet/incoming-character-loader.js", "js/sheet/sheet-api-bridge.js"];
  const bundle = window.parent && window.parent.BELAVADOS_EXTERNAL_JSON ? window.parent.BELAVADOS_EXTERNAL_JSON : (window.BELAVADOS_EXTERNAL_JSON || {});
  function injectJson(id, text){
    let el = document.getElementById(id);
    if(!el){ el = document.createElement('script'); el.type='application/json'; el.id=id; document.head.appendChild(el); }
    el.textContent = text || '{}';
  }
  async function getText(entry){
    if(bundle && Object.prototype.hasOwnProperty.call(bundle, entry.id)) return bundle[entry.id];
    try { const response = await fetch(entry.path, {cache:'no-store'}); if(response.ok) return await response.text(); }
    catch(err){ console.warn('Could not fetch JSON', entry.path, err); }
    return '{}';
  }
  function loadScript(src){
    return new Promise((resolve, reject)=>{
      const s=document.createElement('script');
      s.src=src;
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Could not load '+src));
      document.body.appendChild(s);
    });
  }
  for(const entry of DATA) injectJson(entry.id, await getText(entry));
  for(const src of SCRIPTS) await loadScript(src);
})();
