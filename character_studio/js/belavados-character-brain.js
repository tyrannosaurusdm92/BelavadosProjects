/* Belavadös Character Studio — hidden background calculation assistant.
   This is not a player-facing chat surface. It quietly reviews character choices,
   stat priorities, skill suggestions, alignment axes, multiclass totals, and export
   readiness while the normal Character Studio UI remains two pages only. */
(function(){
  'use strict';
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
  const clamp = (n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(+n)?+n:min));
  const unique = arr=>[...new Set((arr||[]).filter(Boolean))];
  function classData(app, name){ return app?.core?.classes?.[name] || {}; }
  function assistCharacter(character, app){
    const cls = character.classBuild || {};
    const primary = classData(app, cls.primaryClass);
    const secondary = cls.multiclass ? classData(app, cls.secondaryClass) : {};
    const totalLevel = clamp((Number(cls.primaryLevel)||0) + (Number(cls.secondaryLevel)||0), 1, 8);
    const skills = unique([...(primary.skills||[]), ...(secondary.skills||[])]);
    const saves = unique([...(primary.saves||[]), ...(secondary.saves||[])]);
    const features = unique([...(primary.features||[]), ...(secondary.features||[])]);
    const statPriority = primary.priority || ['DEX','CON','WIS','CHA','INT','STR'];
    const statReview = Object.entries(character.stats||{}).map(([stat,value])=>({stat,value,modifier:Math.floor((Number(value)-10)/2)}));
    const warnings=[];
    if(cls.multiclass && totalLevel !== 8) warnings.push('Multiclass total should remain level 8.');
    if(cls.multiclass && Number(cls.primaryLevel) < 5) warnings.push('Primary multiclass level should stay at least 5.');
    if(!character.lineage?.raceCombination?.length) warnings.push('Choose at least one lineage/race.');
    if(!cls.primaryClass) warnings.push('Choose a primary class before final export.');
    return {
      schema:'belavados.characterStudio.backgroundAssistant.v1',
      hidden:true,
      backendUrl:BACKEND_URL,
      generatedAt:new Date().toISOString(),
      buildReview:{totalLevel, multiclass:!!cls.multiclass, statPriority, warnings},
      suggestions:{skills, saves, features},
      alignmentReview:character.alignment?.summary || '',
      statReview
    };
  }
  function attach(){
    window.BelavadosCharacterBrain = Object.freeze({backendUrl:BACKEND_URL, assistCharacter});
    window.addEventListener('belavados:character-rendered', ev=>{
      const detail = ev.detail || {};
      try { window.__belavadosLastBackgroundAssistant = assistCharacter(detail.character || {}, window.BELAVADOS_APP_DATA || null); } catch {}
    });
  }
  attach();
})();
