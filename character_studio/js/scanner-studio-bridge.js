/* Belavadös Scanner → Studio Bridge
   Dominant scanner-controlled scan layer for the single-HTML Character Studio. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TRAIT_KEYS = ['pitch','speed','inflection','stutter','breath','roughness','resonance','formality','vowelFlow','consonantBite','mouthShape','nasality','throatDepth','rhythm','pauseControl','emphasis','warmth','clarity','projection','humanVariation','accentColor'];
  const INFLUENCE_IDS = {
    influenceRace: 'influenceRace', influenceGender:'influenceGender', influencePersonality:'influencePersonality', influenceBiome:'influenceBiome', influenceBaseAudio:'influenceBaseAudio'
  };
  let readyPromise = null;

  function setStatus(msg){ const el=$('analysisStatus') || $('scannerBridgeStatus'); if(el) el.textContent = msg; }
  function setOut(id, text){ const el=$(id); if(el) el.textContent = text; }
  function ensureOption(select, value){
    if(!select || value == null || value === '') return;
    const v=String(value);
    const has=[...select.options].some(o => o.value === v || o.textContent === v);
    if(!has){ const opt=document.createElement('option'); opt.value=v; opt.textContent=v; select.appendChild(opt); }
  }
  function setField(id, value, type='change'){
    const el=$(id); if(!el || value == null || value === '') return;
    if(el.tagName === 'SELECT') ensureOption(el, value);
    el.value = String(value);
    el.dispatchEvent(new Event(type, { bubbles:true }));
  }
  function setSlider(id, value, suffix=''){
    const el=$(id); if(!el || value == null || Number.isNaN(+value)) return;
    const min=Number(el.min || 0), max=Number(el.max || 10);
    const val=Math.max(min, Math.min(max, Number(value)));
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
    const out=$('out_'+id.replace(/^trait_/,'')) || $(id+'Value');
    if(out) out.textContent = suffix ? `${Math.round(val)}${suffix}` : (id.startsWith('trait_') ? val.toFixed(1) : String(Math.round(val)));
  }
  async function scannerReady(){
    if(readyPromise) return readyPromise;
    readyPromise = (async () => {
      const S = window.BelavadosScanner;
      if(!S) throw new Error('Scanner modules are not loaded.');
      if(!S.state?.resources?.biomes?.length) await S.loadBundledResources?.();
      return S;
    })();
    return readyPromise;
  }
  function fieldNpc(){
    return {
      name:$('npcName')?.value || '',
      biome:$('npcBiome')?.value || '',
      race:$('npcRace')?.value || '',
      lineage:'', bloodline:'',
      className:$('npcClass')?.value || '',
      subclass:$('npcSubclass')?.value || '',
      genderIdentity:$('npcGender')?.value || '',
      alignment:$('npcAlignment')?.value || '',
      personalityText:$('npcPersonality')?.value || $('jsonInput')?.value || '',
      emotion:$('emotionSelect')?.selectedOptions?.[0]?.textContent || 'Neutral / Base'
    };
  }
  function keywordAugment(npc, text){
    const low=norm(text);
    if(!npc.genderIdentity){
      if(/trans\s+male|transmasc|trans masculine|trans man/.test(low)) npc.genderIdentity='Trans Male';
      else if(/trans\s+female|transfem|trans feminine|trans woman/.test(low)) npc.genderIdentity='Trans Female';
      else if(/nonbinary|non binary|enby/.test(low)) npc.genderIdentity='Non-Binary';
      else if(/agender/.test(low)) npc.genderIdentity='Agender';
      else if(/gender fluid|genderfluid/.test(low)) npc.genderIdentity='Gender-Fluid';
    }
    if(!npc.className){
      if(/necromanc|wizard|mage|scholar/.test(low)) npc.className='Wizard';
      else if(/bard/.test(low)) npc.className='Bard';
      else if(/rogue|thief|assassin/.test(low)) npc.className='Rogue';
      else if(/cleric|priest/.test(low)) npc.className='Cleric';
      else if(/ranger|scout/.test(low)) npc.className='Ranger';
      else if(/fighter|warrior|barbarian|paladin/.test(low)) npc.className='Fighter';
    }
    if(!npc.subclass && /necromanc/.test(low)) npc.subclass='School of Necromancy';
    if(!npc.biome){
      if(/swamp|marsh|mire|bog|wetland/.test(low)) npc.biome='Marshes and Swamps';
      else if(/deep forest|ancient forest|dark forest/.test(low)) npc.biome='Deep Forest';
      else if(/forest floor|woodland/.test(low)) npc.biome='Hybrid Tree and Forest Floor';
      else if(/reef/.test(low)) npc.biome='Underwater With Reefs';
      else if(/underwater|deep sea|submerged/.test(low)) npc.biome='Underwater Without Reefs';
      else if(/mountain|highland|crag/.test(low)) npc.biome='Mountain Range';
      else if(/farm|farmland/.test(low)) npc.biome='Farming';
      else if(/prairie/.test(low)) npc.biome='Prairie';
      else if(/grassland|plain/.test(low)) npc.biome='Grassland';
      else if(/treetop|treehouse|canopy/.test(low)) npc.biome='Treetops / Treehouses';
      else if(/beach.*reef|reef.*beach/.test(low)) npc.biome='Beach and Reefs With Water';
      else if(/beach|coast|shore/.test(low)) npc.biome='Beach and Grass With Water';
    }
    if(!npc.race){
      const m=text.match(/\b(Dril['’`-]?thar|Drilthar|elf|dwarf|orc|halfling|human|merfolk|beastfolk|dragonborn)\b/i);
      if(m) npc.race=m[1].replace('`',"'");
    }
    if(!npc.name){
      const m=text.match(/\b(?:OC|character|npc)?\s*([A-Z][a-zA-Z'’`-]{2,})\b/);
      if(m && !/I|The|A|An|My|He|She|They|This/.test(m[1])) npc.name=m[1].replace('`',"'");
    }
    npc.personalityText = npc.personalityText || text;
    return npc;
  }
  function collectScannerNpc(S){
    const pasted = $('jsonInput')?.value?.trim() || '';
    const fields = fieldNpc();
    let parsed = null;
    if(pasted){
      const rows = S.parseBulk?.(pasted) || [];
      parsed = rows[0] || null;
    }
    const merged = Object.assign({}, parsed || {}, fields);
    // Prefer explicit field values, then scanner-inferred text values.
    for(const [k,v] of Object.entries(parsed || {})) if(!merged[k] && v) merged[k]=v;
    const text = [pasted, fields.name, fields.race, fields.genderIdentity, fields.className, fields.subclass, fields.biome, fields.personalityText].filter(Boolean).join('\n');
    return keywordAugment(merged, text);
  }
  function profileToStudioFields(profile){
    const c = profile.character || {};
    setField('npcName', c.name || 'Scanner Voice');
    setField('npcRace', c.race || c.lineage || '');
    setField('npcGender', c.genderIdentity || '');
    setField('npcClass', c.class || c.className || '');
    setField('npcSubclass', c.subclass || '');
    setField('npcBiome', c.biome || '');
    if(c.personalityText) setField('npcPersonality', c.personalityText, 'input');
  }
  function applyScannerSliders(profile){
    const traits = profile.voice?.traits || {};
    TRAIT_KEYS.forEach(k => setSlider('trait_'+k, traits[k]));
    const inf = profile.voice?.influences || {};
    Object.keys(INFLUENCE_IDS).forEach(k => setSlider(k, inf[k], '%'));
  }
  function applyScannerAccentMeta(profile){
    const accentName = profile.voice?.fantasyAccent || '';
    if(!accentName) return;
    const readout = $('engineReadout');
    if(readout){
      const current = readout.textContent || '{}';
      let obj={}; try{ obj=JSON.parse(current); }catch{}
      obj.scannerDominantLayer = {
        source:'Belavadös Fantasy Voice Scanner FULL',
        fantasyAccent: accentName,
        matchedFrom: profile.playerFacingSummary?.resolvedFrom || '',
        deepMathVectors: profile.voice?.deepMathVectors || null,
        scannerComputedVoice: profile.computedVoice || null,
        exportNotes: profile.voice?.exportNotes || []
      };
      readout.textContent = JSON.stringify(obj, null, 2);
    }
  }
  function renderMatches(profile){
    const target = $('scannerMatchResults');
    if(!target) return;
    const refs = profile.voice?.assetInfluences?.matchedAudioReferences || [];
    const idx = window.BELAVADOS_ASSET_INDEX || {};
    const sourceRefs = (idx.sourceReferences || []).filter(r => /voice|tts|speech|audio|synth|coqui|edge|spoken|cere/i.test((r.originalPath||'')+' '+(r.shortPath||''))).slice(0, 8);
    target.innerHTML = `
      <div class="status"><b>Scanner dominant profile:</b> ${esc(profile.character?.name || 'Scanner Voice')}<br>
      <b>Accent:</b> ${esc(profile.voice?.fantasyAccent || 'none')}<br>
      <b>Shape:</b> ${esc(profile.playerFacingSummary?.voiceShape || '')}</div>
      <div class="readout"><b>Best scanner media matches</b><br>${refs.length ? refs.slice(0,8).map(r => `${esc(r.filter?.fantasyAccentName || r.id)} · ${esc(r.filter?.biome || '')} · ${esc(r.filter?.genderIdentity || '')} · ${esc(r.filter?.className || '')}\n${esc(r.path || '')}`).join('\n\n') : 'No local media match found.'}</div>
      <div class="readout"><b>Scanner TTS / JS source matches</b><br>${sourceRefs.length ? sourceRefs.map(r => `${esc(r.shortPath)} · ${esc(r.originalPath || '')}`).join('\n') : 'No TTS/source references indexed.'}</div>`;
  }
  async function activateOptionalAudioReference(){
    const upload = $('uploadBaseVoice');
    const useUpload = $('useUploadedVoiceAsBase');
    const useAudio = $('useAudioAssets');
    if(upload?.files?.length && useUpload){
      useUpload.click();
      await wait(600);
      if(useAudio && !useAudio.checked){ useAudio.checked = true; useAudio.dispatchEvent(new Event('change',{bubbles:true})); }
      return 'Uploaded audio is being used as the optional base reference.';
    }
    const recorded = $('recordedAudio');
    if(recorded?.src){
      if(useAudio && !useAudio.checked){ useAudio.checked = true; useAudio.dispatchEvent(new Event('change',{bubbles:true})); }
      return 'Recorded audio is enabled as the optional base reference.';
    }
    return 'No uploaded/recorded base audio was present; scanner used text/json only.';
  }
  async function scanAllInputs(evt){
    evt?.preventDefault?.(); evt?.stopPropagation?.(); evt?.stopImmediatePropagation?.();
    try{
      setStatus('Scanner FULL is scanning pasted JSON/text plus optional uploaded/recorded audio…');
      const S = await scannerReady();
      const audioNote = await activateOptionalAudioReference();
      const npc = collectScannerNpc(S);
      const profile = S.buildVoiceProfile(npc);
      window.BelavadosScannerStudioLastProfile = profile;
      profileToStudioFields(profile);
      $('applyNpc')?.click();
      await wait(250);
      applyScannerSliders(profile);
      applyScannerAccentMeta(profile);
      renderMatches(profile);
      const msg = `Scanner applied ${profile.voice?.fantasyAccent || 'neutral'} using ${profile.voice?.deepMathVectors?.appliedVectorCount ?? 0} deep math vector layer(s). ${audioNote}`;
      setStatus(msg);
      setOut('scannerBridgeStatus', msg);
      const code = $('profileCode');
      if(code && code.value && !code.value.includes('scannerDominantProfile')){
        code.value += `\n\n/* scannerDominantProfile = ${JSON.stringify({fantasyAccent:profile.voice?.fantasyAccent, character:profile.character, traits:profile.voice?.traits, computedVoice:profile.computedVoice, matchedAssets:profile.voice?.assetInfluences}, null, 2)} */\n`;
      }
    }catch(err){
      console.error(err);
      setStatus('Scanner merge scan failed: '+err.message);
    }
  }
  function bind(){
    ['scannerScanAllInputs','analyzeSelected'].forEach(id => {
      const el=$(id);
      if(el) el.addEventListener('click', scanAllInputs, true);
    });
    const useJson=$('useJsonText');
    if(useJson) useJson.addEventListener('click', () => setTimeout(() => scanAllInputs(), 100), false);
    scannerReady().then(() => setOut('scannerBridgeStatus', 'Scanner FULL loaded and ready to control scan buttons.')).catch(err => setOut('scannerBridgeStatus', 'Scanner bridge not ready: '+err.message));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  window.BelavadosScannerStudioBridge = { scanAllInputs };
})();
