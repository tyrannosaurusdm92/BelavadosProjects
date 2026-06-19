/* Belavadös Voice Studio - STFT/log-spectrogram helpers for recorded references */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const dftMagnitude = (frame) => {
    frame = Array.from(frame || []); const N = frame.length, half = Math.floor(N/2)+1, out = new Float32Array(half);
    for (let k=0;k<half;k++) { let re=0, im=0; for (let n=0;n<N;n++) { const a=-2*Math.PI*k*n/N; re += frame[n]*Math.cos(a); im += frame[n]*Math.sin(a); } out[k] = Math.sqrt(re*re+im*im); }
    return out;
  };
  const stft = (samples, opts={}) => {
    samples = Array.from(samples || []); const size = opts.size || 512, hop = opts.hop || 160, win = M().hann(size); const frames=[];
    for (let start=0; start+size<=samples.length; start+=hop) frames.push(dftMagnitude(M().applyWindow(samples.slice(start,start+size), win)));
    return frames;
  };
  const magnitudeSpectrogram = stft;
  const logSpectrogram = (samples, opts={}) => stft(samples, opts).map(frame => Array.from(frame, v => Math.log((opts.epsilon || 1e-7) + v)));
  const spectralCentroid = (mag, sampleRate=44100) => {
    mag = Array.from(mag || []); if (!mag.length) return 0; const binHz = (sampleRate/2)/Math.max(1,mag.length-1); let num=0, den=0;
    mag.forEach((m,k)=>{ num += k*binHz*m; den += m; }); return den ? num/den : 0;
  };
  const summarize = (samples, sampleRate=44100, opts={}) => {
    const frames = stft(samples, opts); const cents = frames.map(f => spectralCentroid(f, sampleRate));
    return { frames:frames.length, spectralCentroidHz:M().round(M().mean(cents),2), spectralCentroidSpreadHz:M().round(M().stdev(cents),2), logEnergy:M().round(Math.log(1e-7 + M().rms(samples)),4) };
  };
  window.BelavadosSTFTMath = { dftMagnitude, stft, magnitudeSpectrogram, logSpectrogram, spectralCentroid, summarize };
})();
