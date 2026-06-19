/* Belavadös Voice Studio - PSOLA-style pitch/duration scheduling math */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const pitchScale = semitones => M().semitoneRatio(semitones);
  const durationFactorFromSpeed = speed01 => M().clamp(1.55 - M().clamp(speed01,0,1)*.95, .48, 1.9);
  const buildSchedule = (f0=150, durationSec=1, semitoneShift=0, durationFactor=1, sampleRate=44100) => {
    const oldPeriod = sampleRate / Math.max(1,f0); const newPeriod = oldPeriod / pitchScale(semitoneShift); const out=[];
    const count = Math.max(1, Math.round(durationSec * sampleRate / newPeriod * durationFactor));
    for (let i=0;i<count;i++) out.push({ sourceCenter:Math.round(i*oldPeriod), targetCenter:Math.round(i*newPeriod*durationFactor), windowSize:Math.round(Math.max(oldPeriod,newPeriod)*2.4) });
    return { f0, semitoneShift, durationFactor, periods:out.slice(0,200), periodCount:count };
  };
  window.BelavadosPSOLAMath = { pitchScale, durationFactorFromSpeed, buildSchedule };
})();
