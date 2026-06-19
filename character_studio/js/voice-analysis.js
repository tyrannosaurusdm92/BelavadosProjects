/* Belavadös Voice Studio - optional recording analysis using STFT/mel/LPC/F0 math */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const MathCore = () => window.BelavadosVoiceMathCore;
  const STFT = () => window.BelavadosSTFTMath;
  const Mel = () => window.BelavadosMelMath;
  const LPC = () => window.BelavadosLPCMath;
  const Speaker = () => window.BelavadosSpeakerReferenceMath;
  const getCtx = () => window.__belavadosVoiceCtx || (window.__belavadosVoiceCtx = new (window.AudioContext || window.webkitAudioContext)());
  const loadManifest = async (url = 'data/voice-audio-manifest.json') => {
    if (Array.isArray(window.BELAVADOS_VOICE_MANIFEST)) return window.BELAVADOS_VOICE_MANIFEST.map(x => ({...x}));
    try { const res = await fetch(url); return res.ok ? res.json() : []; } catch { return []; }
  };
  const fetchArrayBuffer = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not fetch ${url}: ${res.status}`);
    return res.arrayBuffer();
  };
  const decodeClip = async (clip) => {
    const ctx = getCtx();
    const buf = await fetchArrayBuffer(clip.file || clip.embeddedDataUrl);
    return ctx.decodeAudioData(buf.slice(0));
  };
  const sampleChannel = (buffer, maxSamples = 180000) => {
    const raw = buffer.getChannelData(0);
    if (raw.length <= maxSamples) return raw;
    const stride = Math.ceil(raw.length / maxSamples);
    const out = new Float32Array(Math.ceil(raw.length / stride));
    for (let i=0, j=0; i<raw.length; i+=stride, j++) out[j] = raw[i];
    return out;
  };
  const bestVoicedFrame = (samples, sampleRate) => {
    const size = Math.max(512, Math.min(4096, Math.floor(sampleRate * .046)));
    const hop = Math.floor(size / 2);
    let bestStart = 0, bestScore = -Infinity;
    for (let start=0; start+size<samples.length; start+=hop) {
      const frame = samples.slice(start, start+size);
      const score = MathCore().rms(frame) - MathCore().zeroCrossingRate(frame) * .08;
      if (score > bestScore) { bestScore = score; bestStart = start; }
    }
    return samples.slice(bestStart, bestStart + size);
  };
  const metricsToProfile = (metrics = {}) => {
    const f0 = metrics.estimatedF0Hz || metrics.f0 || 150;
    const centroid = metrics.spectralCentroidHz || 1800;
    const zcr = metrics.zeroCrossingRate || 0.05;
    const duration = metrics.duration || 1.5;
    const lpcF1 = metrics.formantLikePeaks?.[0]?.hz || 650;
    return {
      pitch: Core.clamp((Math.log2(f0 / 95) * 4.2) + 3.8, 0, 10),
      speed: Core.clamp(7.5 - Math.min(duration, 4.5) * 1.15, 0, 10),
      inflection: Core.clamp((centroid / 690) + (metrics.spectralCentroidSpreadHz || 0) / 2600, 0, 10),
      stutter: 1,
      breath: Core.clamp((zcr * 42) + (centroid > 2600 ? 1.1 : 0), 0, 10),
      roughness: Core.clamp((zcr * 66) + (metrics.roughnessHint || 0) * 3.4, 0, 10),
      resonance: Core.clamp(10 - centroid / 520 + (900 - lpcF1) / 600, 0, 10),
      formality: 5
    };
  };
  const analyzeAudioBuffer = (buffer) => {
    const samples = sampleChannel(buffer);
    const voiced = bestVoicedFrame(samples, buffer.sampleRate);
    const stftSummary = STFT() ? STFT().summarize(samples, buffer.sampleRate, { size:512, hop:256 }) : {};
    const mag = STFT() ? STFT().dftMagnitude(MathCore().applyWindow(voiced, MathCore().hann(voiced.length))) : [];
    const mel = Mel() ? Mel().summarize(mag, buffer.sampleRate) : {};
    const lpc = LPC() ? LPC().analyze(voiced, buffer.sampleRate, 14) : {};
    const f0 = MathCore().estimateF0Autocorr(voiced, buffer.sampleRate, 55, 500);
    const metrics = {
      duration: Core.round(buffer.duration, 3),
      sampleRate: buffer.sampleRate,
      rms: Core.round(MathCore().rms(samples), 6),
      zeroCrossingRate: Core.round(MathCore().zeroCrossingRate(samples), 5),
      estimatedF0Hz: f0 ? Core.round(f0, 2) : null,
      spectralCentroidHz: Core.round(stftSummary.spectralCentroidHz || 0, 2),
      spectralCentroidSpreadHz: Core.round(stftSummary.spectralCentroidSpreadHz || 0, 2),
      mfcc: mel.mfcc || [],
      timbreBrightness: mel.timbreBrightness || 0,
      envelopeCompactness: mel.envelopeCompactness || 0,
      lpcCoefficients: lpc.coefficients || [],
      formantLikePeaks: lpc.formantLikePeaks || []
    };
    metrics.roughnessHint = Core.round(Math.min(1, metrics.zeroCrossingRate * 4 + (metrics.spectralCentroidHz || 0) / 9500), 3);
    metrics.profile = metricsToProfile(metrics);
    metrics.speakerReference = Speaker() ? Speaker().buildReference({ liveAnalysis:metrics }, { displayName:'My Recorded Base Voice' }) : null;
    return metrics;
  };
  const analyzeClip = async (clip) => {
    const buffer = await decodeClip(clip);
    const liveAnalysis = analyzeAudioBuffer(buffer);
    if (window.BelavadosSpeakerReferenceMath) liveAnalysis.speakerReference = window.BelavadosSpeakerReferenceMath.buildReference({ liveAnalysis }, clip);
    return { ...clip, liveAnalysis, buffer };
  };
  const scoreClipForProfile = (clip, profile = {}, npc = {}) => {
    if (!clip) return 0;
    let score = 0;
    if (clip.id === 'recorded-own-voice-base') score += 20;
    const f0Target = window.BelavadosVoiceCore.profileToEngine(profile).f0;
    if (clip.estimatedF0Hz || clip.liveAnalysis?.estimatedF0Hz) score += Math.max(0, 4 - Math.abs(((clip.estimatedF0Hz || clip.liveAnalysis?.estimatedF0Hz) - f0Target) / 55));
    return score;
  };
  const selectClips = (manifest, profile, npc, count = 1) => (manifest || []).slice().sort((a,b)=>scoreClipForProfile(b, profile, npc)-scoreClipForProfile(a, profile, npc)).slice(0,count);
  window.BelavadosVoiceAnalysis = { getCtx, loadManifest, decodeClip, analyzeAudioBuffer, analyzeClip, metricsToProfile, scoreClipForProfile, selectClips };
})();
