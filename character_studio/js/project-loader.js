(async function(){
  'use strict';
  const DATA = [{"id": "app-data", "path": "data/studio/app-data.json", "context": "main"}, {"id": "voice-race-data", "path": "data/studio/voice-race-data.json", "context": "main"}, {"id": "voice-class-data", "path": "data/studio/voice-class-data.json", "context": "main"}, {"id": "voice-gender-data", "path": "data/studio/voice-gender-data.json", "context": "main"}, {"id": "voice-biome-data", "path": "data/studio/voice-biome-data.json", "context": "main"}, {"id": "site-dropdown-source-data", "path": "data/studio/site-dropdown-source-data.json", "context": "main"}, {"id": "site-dropdown-biome-data", "path": "data/studio/site-dropdown-biome-data.json", "context": "main"}, {"id": "site-pronoun-data", "path": "data/studio/site-pronoun-data.json", "context": "main"}, {"id": "site-title-data", "path": "data/studio/site-title-data.json", "context": "main"}];
  const VOICE_ENGINE_SCRIPTS = [
    "js/voice-core.js",
    "js/voice-reference-audio-learning.js",
    "js/voice-speech-pattern-pack.js",
    "js/voice-humanization-references.js",
    "js/voice-humanization-engine.js",
    "js/voice-naturalness-guard.js",
    "js/voice-biome-accents.js",
    "js/voice-speech-api.js"
  ];
  const SCRIPTS = ["js/studio/character-studio-core.js", "js/studio/layout-navigation.js", "js/studio/full-site-bridge.js"];
  const bundle = window.BELAVADOS_EXTERNAL_JSON || {};
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
  for(const src of VOICE_ENGINE_SCRIPTS) {
    try { await loadScript(src); }
    catch(err){ console.warn('Optional voice engine layer did not load', src, err); }
  }
  for(const src of SCRIPTS) await loadScript(src);
  await loadScript('js/sheet-frame-loader.js');
})();
