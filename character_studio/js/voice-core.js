
/* Belavadös Character Studio Voice World compatibility module.
   This file used to be a removed voice-code placeholder. It now redirects old voice hooks into the integrated weighted biome voice engine. */
(function(){
  'use strict';
  if(window.__BELAVADOS_VOICE_WORLD_COMPAT__) return;
  window.__BELAVADOS_VOICE_WORLD_COMPAT__ = true;
  function loadScript(src){
    return new Promise(function(resolve){
      if(Array.from(document.scripts).some(function(s){return (s.getAttribute('src')||'').indexOf(src) !== -1;})) return resolve();
      var s=document.createElement('script'); s.src=src; s.onload=resolve; s.onerror=resolve; document.head.appendChild(s);
    });
  }
  function ensureEngine(){
    if(window.BelavadosCharacterVoiceWorld) return Promise.resolve(window.BelavadosCharacterVoiceWorld);
    return loadScript('js/voice-world-data.js').then(function(){ return loadScript('js/character-studio-voice-world.js'); }).then(function(){ return window.BelavadosCharacterVoiceWorld || null; });
  }
  window.BelavadosVoiceBridge = window.BelavadosVoiceBridge || {
    registerAdapter:function(adapter){ window.__BELAVADOS_VOICE_ADAPTER__ = adapter || null; return true; },
    getAdapter:function(){ return window.__BELAVADOS_VOICE_ADAPTER__ || null; }
  };
  window.buildVoiceProfile = window.buildVoiceProfile || function(){ return ensureEngine().then(function(engine){ return engine && engine.buildPayload ? engine.buildPayload() : null; }); };
  window.makeVoiceExport = window.makeVoiceExport || function(){ return window.BelavadosCharacterVoiceWorld && window.BelavadosCharacterVoiceWorld.buildPayload ? window.BelavadosCharacterVoiceWorld.buildPayload() : {schema:'belavados.characterStudio.voiceWorld.pending'}; };
  window.speakPreview = window.speakPreview || function(){ return ensureEngine().then(function(engine){ return engine && engine.speak ? engine.speak() : null; }); };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensureEngine); else ensureEngine();
})();
