(function(){
'use strict';
if(window.BelavadosFullSiteBridge && window.BelavadosFullSiteBridge.__twoPageClean) return;
const q = id => document.getElementById(id);
function setField(key,value){ const el=document.querySelector(`[data-key="${key}"]`); if(!el || value == null) return; if(el.type==='checkbox') el.checked=!!value; else el.value=String(value); el.dispatchEvent(new Event('input',{bubbles:true})); }
function getCharacter(){ try { return window.lastCharacter || (typeof window.renderAll === 'function' ? null : null); } catch { return null; } }
function exportPayload(){
  let generator=null;
  try { const txt=q('characterExport')?.value; generator = txt ? JSON.parse(txt) : null; } catch {}
  return {schema:'belavados.characterStudio.fullSite.v2',generatedAt:new Date().toISOString(),generator,dropdowns:{generator:{}},sheetAvailable:!!q('characterSheetFrame')};
}
function pushAllToSheet(){
  const c = exportPayload().generator;
  if(!c) return false;
  setField('characterName', c.identity?.name || '');
  setField('playerName', c.identity?.playerName || '');
  setField('pronouns', c.identity?.pronouns || '');
  setField('genderIdentity', c.identity?.genderIdentity || '');
  setField('race', (c.lineage?.raceCombination||[]).join(' + '));
  setField('classLevel', [c.classBuild?.primaryClass, c.classBuild?.primarySubclass, 'Level '+c.classBuild?.primaryLevel].filter(Boolean).join(' '));
  setField('background', c.background || '');
  setField('alignment', c.alignment?.summary || '');
  Object.entries(c.stats||{}).forEach(([k,v])=>setField('abilities.'+k+'.score', v));
  setField('raceFeatures', (c.notes?.raceSummary||[]).map(r=>[r.name,r.traits,r.abilities].filter(Boolean).join(': ')).join('\n\n'));
  const cs=c.notes?.classSummary||{};
  setField('classFeatures', [...(cs.primaryFeatures||[]),...(cs.secondaryFeatures||[])].join('\n'));
  setField('fallbackEtc', JSON.stringify({lineage:c.lineage,classBuild:c.classBuild,alignment:c.alignment,backgroundAssistant:c.backgroundAssistant||null}, null, 2));
  if(q('forgeStatus')) q('forgeStatus').textContent='Copied generator, dropdown, stats, alignment, and skill data into the character sheet.';
  return true;
}
function pullSheetToSite(){ if(q('forgeStatus')) q('forgeStatus').textContent='Sheet-to-generator pull is ready for manual review. Generator calculations remain authoritative.'; return true; }
function updateFullSiteExportSoon(){ setTimeout(()=>{ const payload=exportPayload(); const out=q('characterExport'); if(out && payload.generator) out.value=JSON.stringify(payload.generator,null,2); },60); }
window.BelavadosFullSiteBridge={__twoPageClean:true,exportPayload,pushAllToSheet,pullSheetToSite,updateFullSiteExportSoon};
document.addEventListener('DOMContentLoaded',()=>{ q('pushAllToSheetBtn')?.addEventListener('click',pushAllToSheet); q('pullSheetToSiteBtn')?.addEventListener('click',pullSheetToSite); q('copyToForgeFromGenerator')?.addEventListener('click',pushAllToSheet); q('copyToGeneratorFromForge')?.addEventListener('click',pullSheetToSite); setTimeout(pushAllToSheet,800); });
})();