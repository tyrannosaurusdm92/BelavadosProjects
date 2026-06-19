/* Belavadös Voice Studio - one-at-a-time media/speech playback hub */
(() => {
  'use strict';
  const sessions = new Map();
  const audios = new Map();
  let activeId = null;
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const words = text => String(text||'').replace(/\s+/g,' ').trim().split(/\s+/).filter(Boolean);
  const estimateSeconds = (text, profile={}) => {
    const w = words(text).length || 1;
    const speed = clamp(+profile.speed || 5, 0, 10);
    const rate = clamp(.86 + (speed-5)*.032, .78, 1.18);
    return Math.max(1.4, w * .42 / rate);
  };
  const textFromOffset = (text, offsetSeconds=0, profile={}) => {
    const list = words(text);
    if (!list.length) return text || 'this is what I sound like';
    const total = estimateSeconds(text, profile);
    const idx = clamp(Math.floor((offsetSeconds / total) * list.length), 0, Math.max(0, list.length-1));
    return list.slice(idx).join(' ') || list.slice(-1).join(' ');
  };
  const setStatus = (id, msg) => {
    const el = document.querySelector(`[data-player-status="${id}"]`);
    if (el) el.textContent = msg;
  };
  const registerAudio = (id, audio) => {
    if (!audio) return;
    audios.set(id, audio);
    audio.addEventListener('play', () => stopAll(id));
    audio.addEventListener('ended', () => setStatus(id, 'Ended'));
    audio.addEventListener('pause', () => { if (activeId === id) setStatus(id, 'Paused'); });
  };
  const stopAll = (exceptId=null) => {
    try { window.BelavadosVoiceProsody?.stop?.(); } catch {}
    try { window.BelavadosSpeechApi?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel?.(); } catch {}
    audios.forEach((audio,id)=>{
      if (id === exceptId) return;
      try { audio.pause(); } catch {}
    });
    sessions.forEach((s,id)=>{ if (id !== exceptId) s.playing = false; });
    activeId = exceptId;
  };
  const playAudio = (id, audio) => {
    audio = audio || audios.get(id);
    if (!audio) return false;
    stopAll(id);
    activeId = id;
    audio.play().then(()=>setStatus(id,'Playing audio reference')).catch(err=>setStatus(id,'Could not play: '+err.message));
    return true;
  };
  const playSpeech = async (id, text, profile, opts={}) => {
    stopAll(id);
    const fullText = String(text||'this is what I sound like').replace(/\s+/g,' ').trim() || 'this is what I sound like';
    const session = sessions.get(id) || { offset:0, text:fullText, startedAt:0, profile:{}, opts:{}, playing:false };
    if (session.text !== fullText) session.offset = 0;
    session.text = fullText; session.profile = profile || {}; session.opts = opts || {}; session.startedAt = performance.now(); session.playing = true;
    sessions.set(id, session);
    activeId = id;
    setStatus(id, session.offset ? `Playing from about ${Math.round(session.offset)}s` : 'Playing typed text');
    const partial = textFromOffset(fullText, session.offset, profile);
    let result;
    try { result = await window.BelavadosVoiceSynthesis.speakBrowserPreview(partial, profile, opts); }
    catch (err) { setStatus(id, 'Speech error: '+err.message); session.playing=false; return { error:err.message }; }
    session.playing = false;
    setStatus(id, 'Ended');
    return result;
  };
  const pause = (id=activeId) => {
    const audio = audios.get(id);
    if (audio && !audio.paused) { audio.pause(); setStatus(id,'Paused'); return; }
    try { window.BelavadosSpeechApi?.pause?.(); window.speechSynthesis?.pause?.(); setStatus(id,'Paused'); } catch {}
  };
  const resume = (id=activeId) => {
    const audio = audios.get(id);
    if (audio && audio.paused && audio.src) { stopAll(id); audio.play(); setStatus(id,'Playing audio reference'); return; }
    try { window.BelavadosSpeechApi?.resume?.(); window.speechSynthesis?.resume?.(); setStatus(id,'Playing typed text'); } catch {}
  };
  const stop = (id=activeId) => {
    if (!id) { stopAll(null); return; }
    const audio = audios.get(id);
    if (audio) { try { audio.pause(); audio.currentTime = 0; } catch {} }
    try { window.BelavadosVoiceProsody?.stop?.(); window.BelavadosSpeechApi?.stop?.(); window.speechSynthesis?.cancel?.(); } catch {}
    const s = sessions.get(id); if (s) { s.offset = 0; s.playing = false; }
    setStatus(id,'Stopped');
  };
  const seek = (id=activeId, delta=0) => {
    if (!id) return;
    const audio = audios.get(id);
    if (audio && audio.src) { audio.currentTime = clamp(audio.currentTime + delta, 0, audio.duration || 999999); setStatus(id, `Audio ${Math.round(audio.currentTime)}s`); return; }
    const s = sessions.get(id); if (!s) { setStatus(id,'Nothing to seek yet'); return; }
    if (s.playing && s.startedAt) s.offset += (performance.now() - s.startedAt) / 1000;
    s.offset = clamp(s.offset + delta, 0, estimateSeconds(s.text, s.profile));
    setStatus(id, `Speech position about ${Math.round(s.offset)}s`);
    if (activeId === id) playSpeech(id, s.text, s.profile, s.opts);
  };
  const rewind = (id=activeId, sec=5) => seek(id, -Math.abs(sec));
  const forward = (id=activeId, sec=5) => seek(id, Math.abs(sec));
  window.BelavadosPlaybackHub = { registerAudio, playAudio, playSpeech, pause, resume, stop, seek, rewind, forward, stopAll, estimateSeconds, textFromOffset };
})();
