(function(global){
  'use strict';
  const LOCKED_ENDPOINT='https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec';
  const DEFAULTS=Object.freeze({primary:LOCKED_ENDPOINT,backup:'',primaryLibrary:'',backupLibrary:'',locked:true,lockId:'WF-BACKEND-2026-07-10-AKFYCBXE3'});
  async function tryPost(payload,log){
    try{const response=await fetch(LOCKED_ENDPOINT,{method:'POST',mode:'cors',redirect:'follow',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...payload,lockId:DEFAULTS.lockId})});const text=await response.text().catch(()=>'');let json=null;try{json=JSON.parse(text)}catch{}if(!response.ok){log&&log(`Locked backend returned HTTP ${response.status}.`);return{ok:false,status:response.status,text:text.slice(0,1000),endpoint:LOCKED_ENDPOINT};}return{ok:true,status:response.status,text:text.slice(0,1000),json,endpoint:LOCKED_ENDPOINT};}catch(error){log&&log(`Locked backend could not be reached: ${error.message}`);return{ok:false,status:0,networkError:true,error:error.message,endpoint:LOCKED_ENDPOINT};}
  }
  function postManifest(manifest,_config,log){return tryPost({action:'worldforge_globe_manifest',sentAt:new Date().toISOString(),manifest},log)}
  function ping(_config,log){return tryPost({action:'ping',sentAt:new Date().toISOString(),app:'WorldForge Immersive Globe Creator'},log)}
  global.WorldForge=global.WorldForge||{};global.WorldForge.BackendSync={DEFAULTS,postManifest,ping};
})(window);
