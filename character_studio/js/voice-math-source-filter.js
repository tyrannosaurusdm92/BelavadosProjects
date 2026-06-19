/* Belavadös Voice Studio - source/filter voice equation layer
   x[n] = glottal/noise excitation e[n] filtered through vocal-tract resonances h[n]. */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const norm = v => window.BelavadosVoiceCore ? window.BelavadosVoiceCore.normalizeTrait(v) : M().clamp(+v||5,0,10);
  const buildSource = (profile={}, opts={}) => {
    const p = { pitch:norm(profile.pitch), breath:norm(profile.breath), roughness:norm(profile.roughness), resonance:norm(profile.resonance), inflection:norm(profile.inflection), speed:norm(profile.speed), formality:norm(profile.formality), stutter:norm(profile.stutter) };
    const semitoneShift = (p.pitch - 5) * 2.15 + ((opts.emotionPitchBias || 0) * 5);
    const f0 = M().round(150 * M().semitoneRatio(semitoneShift), 3);
    const harmonicCount = Math.max(6, Math.round(18 - p.breath*.7 + p.resonance*.6));
    const spectralTilt = M().round(1.12 + (5 - p.pitch) * .045 + p.breath*.045 + p.resonance*.035 - p.roughness*.025, 4);
    const openQuotient = M().clamp(.48 + (p.breath-5)*.035 - (p.roughness-5)*.018, .32, .82);
    const harmonicAmplitudes = Array.from({length:harmonicCount}, (_,i)=> {
      const k=i+1; const roughLift = 1 + (p.roughness/10) * Math.sin(k*1.7) * .12;
      return M().round(Math.pow(k, -spectralTilt) * roughLift, 5);
    });
    const breathNoiseMix = M().clamp(.02 + p.breath*.028 + Math.max(0,p.roughness-6)*.01, 0, .42);
    const aperiodicity = M().clamp(.025 + p.roughness*.035 + p.breath*.018, 0, .58);
    return { f0, semitoneShift:M().round(semitoneShift,3), harmonicCount, harmonicAmplitudes, spectralTilt, openQuotient:M().round(openQuotient,3), breathNoiseMix:M().round(breathNoiseMix,3), aperiodicity:M().round(aperiodicity,3) };
  };
  const synthesizeEquationFrame = (source, sampleRate=44100, seconds=.06, seed='frame') => {
    const n = Math.max(8, Math.round(sampleRate*seconds));
    const out = new Float32Array(n);
    const amps = source.harmonicAmplitudes || [1];
    for (let i=0;i<n;i++) {
      const t=i/sampleRate; let x=0;
      for (let k=1;k<=amps.length;k++) x += amps[k-1] * Math.cos(2*Math.PI*k*source.f0*t + M().seededSigned(seed,k)*.15);
      x += (M().seededSigned(seed,i) * (source.breathNoiseMix || 0));
      out[i] = x / Math.max(1, amps.length*.62);
    }
    return out;
  };
  window.BelavadosSourceFilterMath = { buildSource, synthesizeEquationFrame };
})();
