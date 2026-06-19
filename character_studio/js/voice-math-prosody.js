/* Belavadös Voice Studio - F0, duration, energy, and phrase-prosody control math */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const norm = v => window.BelavadosVoiceCore ? window.BelavadosVoiceCore.normalizeTrait(v) : M().clamp(+v||5,0,10);
  const contourValue = (curve='gentle-rise-fall', t=.5) => {
    t=M().clamp(t,0,1); if (curve==='falling') return .65 - 1.2*t; if (curve==='rising') return -.25 + 1.05*t; if (curve==='tight') return .18*Math.sin(2*Math.PI*t); if (curve==='wavering') return .42*Math.sin(3.2*Math.PI*t); if (curve==='flat') return 0; return .52*Math.sin((t-.12)*Math.PI);
  };
  const buildProsody = (profile={}, opts={}) => {
    const inf=norm(profile.inflection)/10, speed=norm(profile.speed)/10, formal=norm(profile.formality)/10, stutter=norm(profile.stutter)/10;
    const cadence={...(opts.accentCadence||{}),...(opts.cadence||{})}; const curve=cadence.pitchCurve||'gentle-rise-fall';
    return { curve, pitchRangeSemitones:M().round(.35 + inf*3.1 + Math.abs(cadence.pitchBias||0)*4,3), durationFactor:M().round(1.48 - speed*.92 + Math.max(0,cadence.pauseBias||0)*.22,3), energyDb:M().round((cadence.volumeBias||0)*7 + (norm(profile.resonance)-5)*.35 - (norm(profile.breath)-5)*.18,3), pauseMs:M().round(Math.max(0, stutter*115 + formal*34 + (1-speed)*42 + (cadence.pauseBias||0)*90),1), stress:M().round(.12 + inf*.42 + (cadence.stress||0)*.6,3), rateBias:cadence.rateBias||0, pitchBias:cadence.pitchBias||0 };
  };
  const f0ContourSemitone = (model, t, question=false) => contourValue(model.curve, t) * model.pitchRangeSemitones + (question ? .75*t : 0) + (model.pitchBias||0)*4;
  const durationScaleForWord = (model, word='', stressed=false) => M().clamp(model.durationFactor * (stressed ? 1.08 - model.stress*.18 : 1), .45, 2.0);
  const energyGain = model => M().dbToGain(model.energyDb || 0);
  window.BelavadosProsodyMath = { contourValue, buildProsody, f0ContourSemitone, durationScaleForWord, energyGain };
})();
