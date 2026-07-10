const ENDPOINT='https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec';
const LOCK={
  schema:'worldforge.backend_lock.v1',
  project:'WorldForge',
  endpoint:ENDPOINT,
  lockId:'WF-BACKEND-2026-07-10-AKFYCBXE3',
  lockedByUserDirective:true,
  mutableInUI:false,
  note:'Runtime configuration is frozen. Changing the endpoint requires editing this source file at the user’s direction.'
};
Object.freeze(LOCK);
Object.defineProperty(globalThis,'WORLD_FORGE_BACKEND_LOCK',{value:LOCK,writable:false,configurable:false,enumerable:true});

async function request(action,payload={}){
  const body=JSON.stringify({action,project:'WorldForge',client:'WorldForge 3D Map App',lockId:LOCK.lockId,...payload});
  const response=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body,redirect:'follow'});
  const text=await response.text();
  try{return JSON.parse(text);}catch{return {ok:response.ok,status:response.status,text:text.slice(0,5000)};}
}
export const backendLock=LOCK;
export const backendClient=Object.freeze({
  endpoint:ENDPOINT,
  saveWorld:world=>request('saveWorldForgeWorld',{world}),
  saveSettlement:(settlement,scene)=>request('saveWorldForgeSettlement',{settlement,scene}),
  syncLifeSimulator:payload=>request('syncLifeSimulator',{payload}),
  ping:()=>request('worldForgeHealth',{requestedAtUtc:new Date().toISOString()})
});
