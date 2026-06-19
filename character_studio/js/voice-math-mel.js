/* Belavadös Voice Studio - mel scale, triangular filterbanks, MFCC-like summary */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const makeFilterbank = (sampleRate=44100, fftBins=257, bands=24, minHz=40, maxHz=8000) => {
    maxHz = Math.min(maxHz, sampleRate/2); const minMel=M().hzToMel(minHz), maxMel=M().hzToMel(maxHz);
    const melPoints = Array.from({length:bands+2}, (_,i)=> M().lerp(minMel,maxMel,i/(bands+1))).map(M().melToHz);
    const binHz = (sampleRate/2) / Math.max(1, fftBins-1);
    return Array.from({length:bands}, (_,b)=> Array.from({length:fftBins}, (_,k)=> {
      const f=k*binHz, l=melPoints[b], c=melPoints[b+1], r=melPoints[b+2];
      if (f<l || f>r) return 0; return f<=c ? (f-l)/Math.max(1e-9,c-l) : (r-f)/Math.max(1e-9,r-c);
    }));
  };
  const melEnergies = (mag, sampleRate=44100, bands=24) => {
    mag = Array.from(mag || []); const bank=makeFilterbank(sampleRate, mag.length, bands);
    return bank.map(filt => filt.reduce((sum,w,k)=>sum+w*Math.pow(mag[k]||0,2),0));
  };
  const mfcc = (mag, sampleRate=44100, coeffs=13, bands=24) => {
    const logs = melEnergies(mag, sampleRate, bands).map(v => Math.log(1e-8 + v));
    return Array.from({length:coeffs}, (_,q)=> logs.reduce((sum, mb, b)=>sum + mb*Math.cos(Math.PI*q/bands*(b+.5)),0));
  };
  const summarize = (mag, sampleRate=44100) => { const c=mfcc(mag,sampleRate,8,24); return { mfcc:c.map(x=>M().round(x,4)), timbreBrightness:M().round((c[1]||0),4), envelopeCompactness:M().round(M().stdev(c.slice(1)),4) }; };
  window.BelavadosMelMath = { makeFilterbank, melEnergies, mfcc, summarize, hzToMel:(hz)=>M().hzToMel(hz), melToHz:(mel)=>M().melToHz(mel) };
})();
