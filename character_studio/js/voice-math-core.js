/* Belavadös Voice Studio - shared voice math primitives
   Browser-safe utility layer for source/filter, spectrogram, mel, F0, gain, and seeded variation. */
(() => {
  'use strict';
  const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(+n) ? +n : min));
  const round = (n, places = 6) => Number.parseFloat((+n || 0).toFixed(places));
  const lerp = (a,b,t) => a + (b-a) * clamp(t,0,1);
  const mean = arr => arr && arr.length ? arr.reduce((a,b)=>a+(+b||0),0)/arr.length : 0;
  const variance = arr => { const m=mean(arr); return arr && arr.length ? mean(arr.map(x=>(x-m)*(x-m))) : 0; };
  const stdev = arr => Math.sqrt(variance(arr));
  const rms = arr => Math.sqrt(mean(Array.from(arr || []).map(x => x*x)) || 0);
  const zeroCrossingRate = arr => {
    arr = Array.from(arr || []); if (arr.length < 2) return 0;
    let z = 0; for (let i=1;i<arr.length;i++) if ((arr[i-1] < 0 && arr[i] >= 0) || (arr[i-1] >= 0 && arr[i] < 0)) z++;
    return z / (arr.length - 1);
  };
  const semitoneRatio = s => Math.pow(2, (+s || 0) / 12);
  const ratioToSemitones = r => 12 * Math.log2(Math.max(1e-9, +r || 1));
  const dbToGain = db => Math.pow(10, (+db || 0) / 20);
  const gainToDb = g => 20 * Math.log10(Math.max(1e-9, +g || 0));
  const hzToMel = hz => 2595 * Math.log10(1 + Math.max(0,+hz||0) / 700);
  const melToHz = mel => 700 * (Math.pow(10, (+mel||0) / 2595) - 1);
  const hann = n => Array.from({length:n}, (_,i) => .5 - .5 * Math.cos((2*Math.PI*i)/Math.max(1,n-1)));
  const hamming = n => Array.from({length:n}, (_,i) => .54 - .46 * Math.cos((2*Math.PI*i)/Math.max(1,n-1)));
  const applyWindow = (frame, win = hann(frame.length)) => Float32Array.from(frame, (x,i)=>x*(win[i]||0));
  const autocorrelation = (frame, maxLag = frame.length-1) => {
    frame = Array.from(frame || []); const out=[];
    maxLag = Math.min(maxLag, frame.length-1);
    for (let lag=0; lag<=maxLag; lag++) { let sum=0; for (let i=lag;i<frame.length;i++) sum += frame[i]*frame[i-lag]; out.push(sum); }
    return out;
  };
  const estimateF0Autocorr = (frame, sampleRate=44100, minHz=55, maxHz=420) => {
    frame = Array.from(frame || []); if (frame.length < 64) return null;
    const r = autocorrelation(frame, Math.floor(sampleRate / Math.max(1,minHz)));
    const minLag = Math.max(1, Math.floor(sampleRate / maxHz));
    const maxLag = Math.min(r.length-1, Math.floor(sampleRate / minHz));
    let bestLag=0, best=-Infinity;
    for (let lag=minLag; lag<=maxLag; lag++) { const score = r[lag] / Math.max(1e-9, r[0]); if (score > best) { best=score; bestLag=lag; } }
    return bestLag && best > .18 ? sampleRate / bestLag : null;
  };
  const seededUnit = (seed='Belavados', index=0) => {
    let h = 2166136261;
    const s = String(seed) + ':' + index;
    for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };
  const seededSigned = (seed,index=0) => seededUnit(seed,index) * 2 - 1;
  window.BelavadosVoiceMathCore = { clamp, round, lerp, mean, variance, stdev, rms, zeroCrossingRate, semitoneRatio, ratioToSemitones, dbToGain, gainToDb, hzToMel, melToHz, hann, hamming, applyWindow, autocorrelation, estimateF0Autocorr, seededUnit, seededSigned };
})();
