/* Belavadös Voice Studio - formant/vocal-tract size and nasal resonance modeling */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const norm = v => window.BelavadosVoiceCore ? window.BelavadosVoiceCore.normalizeTrait(v) : M().clamp(+v||5,0,10);
  const BASE_FORMANTS = { neutral:[650,1150,2450,3300], bright:[520,1800,2700,3650], dark:[700,1000,2200,3000], rounded:[430,900,2350,3200], open:[820,1400,2600,3500] };
  const formantScaleFromProfile = (profile={}) => M().clamp(1 + (norm(profile.pitch)-5)*.028 - (norm(profile.resonance)-5)*.035, .72, 1.32);
  const chooseVowelSet = (profile={}, emotion='neutral') => {
    if (norm(profile.breath) > 7 || ['awe','wonder','tenderness'].includes(emotion)) return 'open';
    if (norm(profile.resonance) > 7 || norm(profile.roughness) > 7) return 'dark';
    if (norm(profile.pitch) > 6.7) return 'bright';
    return 'neutral';
  };
  const buildFormants = (profile={}, opts={}) => {
    const set=chooseVowelSet(profile, opts.emotionKey || opts.emotion || 'neutral'); const scale=formantScaleFromProfile(profile); const precision=norm(profile.formality)/10;
    const formants=(BASE_FORMANTS[set]||BASE_FORMANTS.neutral).map((f,i)=>({ hz:M().round(f*scale,1), gainDb:M().round((i===0?2.5:1.4)+precision*1.8-i*.15,2), q:M().round(4+precision*5+i*.9,2) }));
    const nasal = buildNasality(profile, opts);
    return { vowelSet:set, formantScale:M().round(scale,4), formants, nasal };
  };
  const buildNasality = (profile={}, opts={}) => {
    const text=JSON.stringify(opts.npc||{}).toLowerCase(); const personality=String(opts.personality||'').toLowerCase();
    const nasalHint = /nasal|pinched|impish|goblin|gnome|bugbear|swamp|mire/.test(text+personality) ? .25 : 0;
    const amount=M().clamp(nasalHint + Math.max(0, norm(profile.formality)-7)*.025 + Math.max(0, 4-norm(profile.resonance))*.02, 0, .55);
    return { amount:M().round(amount,3), pole:M().round(.72 + amount*.18,3), zero:M().round(.38 + amount*.12,3), filter:'H_nasal(z)=(1-bz^-1)/(1-az^-1)' };
  };
  const scaleFormants = (formants=[], rho=1) => formants.map(f=>({ ...f, hz:M().round(f.hz*rho,1) }));
  window.BelavadosFormantMath = { BASE_FORMANTS, formantScaleFromProfile, chooseVowelSet, buildFormants, buildNasality, scaleFormants };
})();
