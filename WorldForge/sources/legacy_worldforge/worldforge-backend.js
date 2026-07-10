(function(){
  const WF = window.WorldForge = window.WorldForge || {};
  async function syncPackage(pkg){
    const url = WF.config.backendUrl;
    const body = JSON.stringify({ action:'saveWorldForgePackage', project:'WorldForge', package:pkg, settlementId:pkg?.manifest?.settlementId, mapId:pkg?.manifest?.mapId });
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body });
    try { return await res.json(); } catch { return { ok:res.ok, status:res.status, text:await res.text() }; }
  }
  WF.backend = { syncPackage };
})();
