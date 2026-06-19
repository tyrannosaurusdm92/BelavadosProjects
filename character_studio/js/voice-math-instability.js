/* Belavadös Voice Studio - jitter, shimmer, tremor, and controlled human micro-variation */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const norm = v => window.BelavadosVoiceCore ? window.BelavadosVoiceCore.normalizeTrait(v) : M().clamp(+v||5,0,10);
  const buildInstability = (profile={}, opts={}) => {
    const rough=norm(profile.roughness)/10, expressive=norm(profile.inflection)/10, breath=norm(profile.breath)/10, panic=(opts.emotionKey==='panic'||opts.emotion==='panic') ? .12 : 0, fear=(opts.emotionKey==='fear'||opts.emotion==='fear') ? .08 : 0;
    const jitter = M().clamp(.002 + rough*.018 + expressive*.004 + panic + fear, .001, .18);
    const shimmer = M().clamp(.006 + breath*.022 + rough*.014 + panic*.5 + fear*.35, .002, .16);
    const tremorRateHz = M().round(3.8 + expressive*2.2 + rough*.8,2);
    const tremorDepthSemitones = M().round(.03 + expressive*.22 + panic*.45 + fear*.25,3);
    return { jitter:M().round(jitter,4), shimmer:M().round(shimmer,4), tremorRateHz, tremorDepthSemitones, humanizationSeed: opts.seed || opts.name || 'BelavadosVoice' };
  };
  const f0At = (baseF0, t, inst={}, contourSemitones=0) => {
    const seed=inst.humanizationSeed || 'BelavadosVoice'; const jitterSemi=(M().seededSigned(seed, Math.floor(t*97))*12*(inst.jitter||0));
    const tremor=(inst.tremorDepthSemitones||0)*Math.sin(2*Math.PI*(inst.tremorRateHz||4.5)*t);
    return baseF0 * M().semitoneRatio(contourSemitones + jitterSemi + tremor);
  };
  const amplitudeAt = (baseGain, t, inst={}) => {
    const seed=inst.humanizationSeed || 'BelavadosVoice'; const shimmer=(M().seededSigned(seed, Math.floor(t*131))* (inst.shimmer||0));
    return M().clamp(baseGain * (1 + shimmer), 0, 2);
  };
  window.BelavadosInstabilityMath = { buildInstability, f0At, amplitudeAt };
})();
