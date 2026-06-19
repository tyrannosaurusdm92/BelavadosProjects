/* Belavadös Voice Studio - transparent vocoder parameter set
   Classical WORLD-like parameters: F0, spectral envelope, and aperiodicity. */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const Source = () => window.BelavadosSourceFilterMath;
  const Formants = () => window.BelavadosFormantMath;
  const Inst = () => window.BelavadosInstabilityMath;
  const PSOLA = () => window.BelavadosPSOLAMath;
  const norm = v => window.BelavadosVoiceCore ? window.BelavadosVoiceCore.normalizeTrait(v) : M().clamp(+v||5,0,10);
  const buildParams = (profile={}, opts={}) => {
    const source=Source().buildSource(profile, opts); const formants=Formants().buildFormants(profile, opts); const instability=Inst().buildInstability(profile, opts);
    const speed01 = norm(profile.speed)/10; const durationFactor=PSOLA().durationFactorFromSpeed(speed01);
    const psola=PSOLA().buildSchedule(source.f0, 1, source.semitoneShift, durationFactor, 44100);
    const envelope = { formantScale:formants.formantScale, spectralTilt:source.spectralTilt, formants:formants.formants, nasal:formants.nasal };
    const aperiodicity = { global:source.aperiodicity, breathBand:M().round(source.breathNoiseMix,3), fricationBand:M().round(Math.max(0, norm(profile.roughness)-5)*.055,3) };
    return { f0Hz:source.f0, source, spectralEnvelope:envelope, aperiodicity, instability, psola, equations:{ sourceFilter:'x(t)=e(t)*h(t)', harmonic:'sum_k A_k cos(2πk∫F0/fs + φ_k)+η[n]', vocoder:'S(F0, spectralEnvelope, aperiodicity)' } };
  };
  window.BelavadosVocoderMath = { buildParams };
})();
