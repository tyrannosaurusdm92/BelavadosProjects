(function(){
  const WF = window.WorldForge = window.WorldForge || {}, U = WF.utils;
  function normalizeLocationRecord(record, settlementId){
    const wf = record.worldforge || record.WorldForge || {};
    return {
      locationId: record.locationId || record.id || wf.locationId || `imported-${U.slug(record.name||record.category||'location')}`,
      settlementId: record.settlementId || wf.settlementId || settlementId,
      category: record.category || record.pinCategory || wf.pinCategory,
      subcategory: record.subcategory || record.pinSubcategory || record.type || wf.pinSubcategory,
      pinId: wf.pinId || record.pinId || null,
      sourceLock: record.sourceLock || record.lockedSource || record.protectedCanon || record.contentLocked || false,
      protectedCanon: record.protectedCanon || record.contentLocked || false,
      rerollAllowed: record.rerollAllowed === true,
      hiddenNamePresent: !!record.name,
      raw: record
    };
  }
  function extractLocations(json, settlementId){
    if(!json) return [];
    if(Array.isArray(json)) return json.map(x=>normalizeLocationRecord(x, settlementId));
    if(Array.isArray(json.locations)) return json.locations.map(x=>normalizeLocationRecord(x, settlementId));
    if(Array.isArray(json.settlements)){
      const out=[]; json.settlements.forEach(s=>{ const sid=s.id||settlementId; if(Array.isArray(s.locations)) s.locations.forEach(l=>out.push(normalizeLocationRecord(l,sid))); }); return out;
    }
    if(json.settlement && Array.isArray(json.settlement.locations)) return json.settlement.locations.map(x=>normalizeLocationRecord(x, settlementId));
    return [];
  }
  function bindLocationsToPins(pins, importedLocations, context){
    const report={schema:'belavados.worldforge_lifesimulator_bridge_report.v1',generatedAtUtc:U.nowIso(),matchedPins:[],unboundPins:[],unboundLocations:[],warnings:[]};
    const freePins=pins.filter(p=>!p.locationId);
    const byId=new Map(freePins.map(p=>[p.pinId,p]));
    importedLocations.forEach(loc=>{
      if(loc.settlementId && context.id && loc.settlementId !== context.id && loc.settlementId !== context.name) return;
      let pin = loc.pinId ? byId.get(loc.pinId) : null;
      if(!pin){
        const compatible=freePins.filter(p=>!p.locationId && compatibleCategory(p,loc));
        compatible.sort((a,b)=>b.validPlacementScore-a.validPlacementScore);
        pin=compatible[0];
      }
      if(pin){ pin.locationId=loc.locationId; pin.pinState= loc.protectedCanon || loc.sourceLock ? 'bound-protected' : 'bound'; pin.bindStatus='bound'; pin.hiddenSemanticContent=true; pin.sourceLock=!!loc.sourceLock; report.matchedPins.push({pinId:pin.pinId,locationId:loc.locationId,category:pin.category,subcategory:pin.subcategory,hiddenNamePresent:loc.hiddenNamePresent,sourceLock:!!loc.sourceLock}); }
      else { report.unboundLocations.push({locationId:loc.locationId,category:loc.category,subcategory:loc.subcategory,reason:'No compatible open pin slot found'}); }
    });
    pins.filter(p=>!p.locationId).forEach(p=>report.unboundPins.push({pinId:p.pinId,category:p.category,subcategory:p.subcategory}));
    return report;
  }
  function compatibleCategory(pin,loc){ if(!loc.category && !loc.subcategory) return false; if(loc.category && pin.category===loc.category) return true; if(loc.subcategory && pin.subcategory===loc.subcategory) return true; const a=String(pin.subcategory||'').toLowerCase(), b=String(loc.subcategory||'').toLowerCase(); return a && b && (a.includes(b)||b.includes(a)); }
  WF.bridge = { extractLocations, bindLocationsToPins };
})();
