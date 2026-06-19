/* Belavadös Voice Studio - clean speech preview and clip transformation */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const Analysis = window.BelavadosVoiceAnalysis;
  const Emotions = () => window.BelavadosVoiceEmotions;
  const getCtx = () => Analysis.getCtx();

  const PREVIEW_PHRASE = 'this is what I sound like';

  const makeDistortionCurve = (amount = 0) => {
    // Kept for older exported/clip profiles, but capped low so it does not create static.
    const k = Math.min(60, Math.max(0, amount * 90));
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i=0; i<n; ++i) {
      const x = i * 2 / n - 1;
      curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    return curve;
  };

  const connectFormants = (ctx, input, engine) => {
    const master = ctx.createGain();
    master.gain.value = .9;
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 230;
    low.gain.value = (engine.resonance_amount - .5) * 9;
    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 1400 * engine.formant_shift;
    presence.Q.value = .9;
    presence.gain.value = (engine.articulation_precision - .4) * 4;
    const air = ctx.createBiquadFilter();
    air.type = 'highshelf';
    air.frequency.value = 4200;
    air.gain.value = (engine.breath_noise_mix - .35) * 2.5;
    input.connect(low);
    low.connect(presence);
    presence.connect(air);
    air.connect(master);
    return master;
  };

  const tokenize = (text = '') => text.replace(/[“”]/g, '"').split(/(\s+|[,.!?;:])/).filter(Boolean);

  const applySpokenStutters = (text, profile = {}) => {
    const stutter = Core.normalizeTrait(profile.stutter);
    const formal = Core.normalizeTrait(profile.formality);
    let phrase = String(text || PREVIEW_PHRASE).trim() || PREVIEW_PHRASE;
    if (stutter >= 8) phrase = phrase.replace(/\bthis\b/i, 'th-th-this').replace(/\bwhat\b/i, 'wh-what');
    else if (stutter >= 6) phrase = phrase.replace(/\bthis\b/i, 'th-this');
    else if (stutter >= 4) phrase = phrase.replace(/\bwhat\b/i, 'what, um,');
    if (formal >= 8 && !/[.!?…]$/.test(phrase)) phrase += '.';
    return phrase;
  };

  const shapePhrase = (text, profile = {}, opts = {}) => {
    const emotionKey = opts.emotionKey || opts.emotion || 'neutral';
    const intensity = opts.emotionIntensity ?? 100;
    const emo = Emotions();
    const emotionalProfile = emo ? emo.applyEmotion(profile, emotionKey, intensity) : profile;
    let phrase = emo ? emo.shapeText(text || PREVIEW_PHRASE, emotionKey, intensity, emotionalProfile) : (text || PREVIEW_PHRASE);
    phrase = applySpokenStutters(phrase, emotionalProfile);
    return { phrase, emotionalProfile, emotionKey, intensity };
  };

  const pickSpeechVoice = (profile = {}, opts = {}) => {
    const synth = window.speechSynthesis;
    if (!synth) return null;
    const voices = synth.getVoices ? synth.getVoices() : [];
    if (!voices.length) return null;
    const text = JSON.stringify(opts.npc || {}).toLowerCase();
    const wantsFeminine = /female|femme|woman|girl|demi-female|trans-female|bright|soft|gentle/.test(text) || Core.normalizeTrait(profile.pitch) >= 6.8;
    const wantsMasculine = /male|masc|man|boy|demi-male|trans-male|deep|gruff|booming/.test(text) || Core.normalizeTrait(profile.pitch) <= 3.2;
    const english = voices.filter(v => /^en[-_]/i.test(v.lang || '') || /english/i.test(v.name || ''));
    const pool = english.length ? english : voices;
    const feminine = pool.find(v => /female|woman|samantha|victoria|zira|susan|karen|moira|tessa|serena|aria|jenny|ava/i.test(v.name));
    const masculine = pool.find(v => /male|man|daniel|david|mark|alex|fred|george|tom|guy|brian/i.test(v.name));
    return wantsFeminine && feminine ? feminine : wantsMasculine && masculine ? masculine : (pool.find(v => /natural|enhanced|premium|online/i.test(v.name)) || pool[0]);
  };

  const speakBrowserPreview = async (text = PREVIEW_PHRASE, profile = {}, opts = {}) => {
    const prosody = window.BelavadosVoiceProsody;
    if (prosody && prosody.speak) {
      const result = await prosody.speak(text || PREVIEW_PHRASE, profile, opts);
      const effectiveProfile = result.profile || profile;
      const engine = Core.profileToEngine(effectiveProfile, { waveform: Core.guessWaveform(effectiveProfile) });
      return { ...result, engine, phrase: result.phrase || text || PREVIEW_PHRASE, emotionKey: opts.emotionKey || opts.emotion || 'neutral', emotionIntensity: opts.emotionIntensity ?? 100 };
    }
    const shaped = shapePhrase(text, profile, opts);
    const effectiveProfile = shaped.emotionalProfile;
    const engine = Core.profileToEngine(effectiveProfile, { waveform: Core.guessWaveform(effectiveProfile) });
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) return speakText(shaped.phrase, effectiveProfile, opts);
    try { window.speechSynthesis.cancel(); } catch {}
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(shaped.phrase);
      utter.rate = Core.clamp(0.82 + Core.normalizeTrait(effectiveProfile.speed) * .045, .82, 1.28);
      utter.pitch = Core.clamp(0.88 + Core.normalizeTrait(effectiveProfile.pitch) * .026 + (Core.normalizeTrait(effectiveProfile.inflection)-5) * .004, .86, 1.18);
      utter.volume = Core.clamp((opts.volume ?? .96) - Math.max(0, Core.normalizeTrait(effectiveProfile.breath)-6) * .018, .62, 1);
      const voice = pickSpeechVoice(effectiveProfile, opts);
      if (voice) utter.voice = voice;
      const finish = () => resolve({ engine, phrase: shaped.phrase, voice: utter.voice?.name || 'browser default', emotionKey: shaped.emotionKey, emotionIntensity: shaped.intensity, segmented:false });
      utter.onend = finish;
      utter.onerror = () => speakText(shaped.phrase, effectiveProfile, opts).then(finish).catch(finish);
      window.speechSynthesis.speak(utter);
      setTimeout(finish, Math.max(2600, shaped.phrase.length * 155));
    });
  };

  const speakSyllable = (ctx, destination, syllable, start, duration, engine, index = 0) => {
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, start);
    out.gain.exponentialRampToValueAtTime(Math.max(0.004, engine.gain), start + Math.min(.035, duration * .25));
    out.gain.setValueAtTime(Math.max(0.004, engine.gain * .72), start + Math.max(.04, duration * .62));
    out.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    const toneIn = ctx.createGain();
    const formants = connectFormants(ctx, toneIn, engine);
    formants.connect(out);
    const osc = ctx.createOscillator();
    osc.type = engine.roughness_amount > .72 ? 'square' : 'triangle';
    const contour = Math.sin(index * 1.73) * engine.pitch_range * engine.inflection_amount;
    const f = Math.max(45, engine.f0 + contour + (syllable.length % 3) * 6);
    osc.frequency.setValueAtTime(f, start);
    osc.frequency.linearRampToValueAtTime(f + ((index % 2 ? -1 : 1) * engine.pitch_range * .28), start + duration * .8);
    const oscGain = ctx.createGain();
    oscGain.gain.value = Math.max(.38, 1 - engine.breath_noise_mix * .38);
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeDistortionCurve(engine.roughness_amount * .3);
    shaper.oversample = '2x';
    osc.connect(oscGain);
    oscGain.connect(shaper);
    shaper.connect(toneIn);
    osc.start(start);
    osc.stop(start + duration + .03);
    out.connect(destination);
    return start + duration;
  };

  const speakText = async (text, profile = {}, opts = {}) => {
    const ctx = getCtx();
    await ctx.resume();
    const emotionKey = opts.emotionKey || opts.emotion || 'neutral';
    const intensity = opts.emotionIntensity ?? 100;
    const effectiveProfile = Emotions() ? Emotions().applyEmotion(profile, emotionKey, intensity) : profile;
    const engine = Core.profileToEngine(effectiveProfile, { waveform: Core.guessWaveform(effectiveProfile) });
    const master = ctx.createGain();
    master.gain.value = opts.volume ?? .85;
    master.connect(ctx.destination);
    let time = ctx.currentTime + .08;
    const shaped = shapePhrase(text || PREVIEW_PHRASE, effectiveProfile, opts);
    const tokens = tokenize(shaped.phrase || 'Belavadös voice preview ready.');
    let syllableIndex = 0;
    for (const token of tokens) {
      if (/^\s+$/.test(token)) { time += .035 + engine.pause_density * .04; continue; }
      if (/^[,.!?;:]$/.test(token)) { time += .08 + engine.pause_density * .22 + engine.articulation_precision * .08; continue; }
      let clean = token.replace(/[^a-zA-ZÀ-ÿ'-]/g, '');
      if (!clean) continue;
      const shouldStutter = Math.random() < engine.stutter_amount * .15 && clean.length > 3;
      const parts = clean.match(/[bcdfghjklmnpqrstvwxz]*[aeiouyà-ÿ]+|[^aeiouyà-ÿ]+/gi) || [clean];
      if (shouldStutter) {
        const onset = clean.slice(0, Math.min(2, clean.length));
        time = speakSyllable(ctx, master, onset, time, .055 / engine.speech_rate, engine, syllableIndex++);
        time += .045 + engine.stutter_amount * .08;
      }
      for (const part of parts) {
        const d = Math.max(.045, (.13 + part.length * .012) / engine.speech_rate);
        time = speakSyllable(ctx, master, part, time, d, engine, syllableIndex++);
        time += .018 / engine.speech_rate;
      }
      time += .025 + engine.pause_density * .018;
    }
    setTimeout(() => master.disconnect(), Math.max(250, (time - ctx.currentTime) * 1000 + 100));
    return { engine, endsAt: time, emotionKey, emotionIntensity: intensity };
  };

  const playElementClipFallback = async (ctx, clip, profile, engine, master, opts = {}, delaySeconds = 0) => {
    return new Promise((resolve) => {
      const audio = new Audio(clip.file);
      audio.preload = 'auto';
      const pitchRatio = Math.pow(2, (Core.normalizeTrait(profile.pitch) - 5) / 12);
      audio.playbackRate = Math.max(.45, Math.min(1.9, pitchRatio * (.75 + Core.normalizeTrait(profile.speed) * .065)));
      let resolved = false;
      const done = () => { if (!resolved) { resolved = true; try { audio.pause(); } catch {} resolve(); } };
      audio.addEventListener('ended', done, { once:true });
      audio.addEventListener('error', done, { once:true });
      try {
        const src = ctx.createMediaElementSource(audio);
        const pre = ctx.createGain(); pre.gain.value = .78;
        const shaped = connectFormants(ctx, pre, engine);
        shaped.connect(master);
        src.connect(pre);
      } catch (err) {
        try { audio.volume = opts.volume ?? .85; } catch {}
      }
      setTimeout(() => audio.play().catch(done), Math.max(0, delaySeconds * 1000));
      setTimeout(done, ((clip.duration || 3) / audio.playbackRate + delaySeconds + 1) * 1000);
    });
  };

  const playTransformedClip = async (clips = [], profile = {}, opts = {}) => {
    const ctx = getCtx();
    await ctx.resume();
    const emotionKey = opts.emotionKey || opts.emotion || 'neutral';
    const intensity = opts.emotionIntensity ?? 100;
    const effectiveProfile = Emotions() ? Emotions().applyEmotion(profile, emotionKey, intensity) : profile;
    const engine = Core.profileToEngine(effectiveProfile, { waveform: Core.guessWaveform(effectiveProfile) });
    const selected = Array.isArray(clips) ? clips : [clips];
    let cursor = ctx.currentTime + .08;
    const master = ctx.createGain();
    master.gain.value = opts.volume ?? .92;
    master.connect(ctx.destination);
    const mode = opts.mergeMode || 'concatenate';
    for (let i=0; i<selected.length; i++) {
      const clip = selected[i];
      let buffer = null;
      try { buffer = clip.buffer || await Analysis.decodeClip(clip); }
      catch (err) {
        const delay = mode === 'layered' ? 0 : Math.max(0, cursor - ctx.currentTime);
        const promise = playElementClipFallback(ctx, clip, effectiveProfile, engine, master, opts, delay);
        if (mode !== 'layered') await promise;
        cursor = mode === 'layered' ? Math.max(cursor, ctx.currentTime + (clip.duration || 3)) : ctx.currentTime + .12;
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const pitchRatio = Math.pow(2, (Core.normalizeTrait(effectiveProfile.pitch) - 5) / 12);
      src.playbackRate.value = Math.max(.45, Math.min(1.9, pitchRatio * (.75 + Core.normalizeTrait(effectiveProfile.speed) * .065)));
      const pre = ctx.createGain();
      pre.gain.value = .76;
      const shaped = connectFormants(ctx, pre, engine);
      shaped.connect(master);
      src.connect(pre);
      const start = mode === 'layered' ? ctx.currentTime + .08 : cursor;
      src.start(start);
      const heard = buffer.duration / src.playbackRate.value;
      if (mode !== 'layered') cursor = start + heard + .12 + engine.pause_density * .12;
      else cursor = Math.max(cursor, start + heard);
    }
    setTimeout(()=>master.disconnect(), Math.max(250, (cursor - ctx.currentTime) * 1000 + 500));
    return { engine, endsAt: cursor, emotionKey, emotionIntensity: intensity };
  };

  const startSpeechTextureBed = async (profile = {}, opts = {}) => {
    // Clean compatibility shim: no static/noise bed.
    return { engine: Core.profileToEngine(profile, { waveform: Core.guessWaveform(profile) }), endsAt: 0, disabled: true };
  };

  const makeNoiseBuffer = (ctx, duration = 1) => {
    // Legacy compatibility only. The clean preview no longer calls this.
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    return buffer;
  };

  window.BelavadosVoiceSynthesis = { speakText, speakBrowserPreview, startSpeechTextureBed, playTransformedClip, makeNoiseBuffer, makeDistortionCurve, connectFormants, PREVIEW_PHRASE };
})();
