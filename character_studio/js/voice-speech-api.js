/* Belavadös Voice Studio - Natural speech API bridge
   Repo-informed patterns used: async voice loading from Speakit-JS/spoken, centralized say/stop wrapper,
   and voice catalog scoring inspired by cloud voice demos without requiring an online service. */
(() => {
  'use strict';
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const normLang = s => String(s||'').toLowerCase().replace('_','-');
  let cachedVoices = [];
  let loadPromise = null;
  let token = 0;
  const naturalName = /natural|neural|enhanced|premium|online|aria|jenny|guy|brian|andrew|emma|sonia|daniel|samantha|victoria|zira|ava|serena|moira|tessa|karen|david|mark|george|alex|fred/i;

  const isAvailable = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const loadVoices = (timeout=900) => {
    if (!isAvailable()) return Promise.resolve([]);
    if (cachedVoices.length) return Promise.resolve(cachedVoices);
    if (loadPromise) return loadPromise;
    loadPromise = new Promise(resolve => {
      const synth = window.speechSynthesis;
      const done = () => {
        const voices = synth.getVoices ? synth.getVoices() : [];
        if (voices && voices.length) {
          cachedVoices = voices.slice().sort((a,b)=>String(a.lang||'').localeCompare(String(b.lang||'')) || String(a.name||'').localeCompare(String(b.name||'')));
          resolve(cachedVoices);
          loadPromise = null;
          return true;
        }
        return false;
      };
      if (done()) return;
      const previous = synth.onvoiceschanged;
      synth.onvoiceschanged = ev => { if (typeof previous === 'function') { try { previous.call(synth, ev); } catch {} } done(); };
      setTimeout(() => { done() || resolve([]); loadPromise = null; }, timeout);
    });
    return loadPromise;
  };

  const familyWish = (profile={}, npc={}) => {
    const p = +profile.pitch || 5, r = +profile.resonance || 5;
    const text = JSON.stringify(npc||{}).toLowerCase();
    return {
      feminine: /female|femme|woman|girl|demi-female|trans-female|feminine|wife|momma/.test(text) || p >= 6.9,
      masculine: /male|masc|man|boy|demi-male|trans-male|masculine|papa|dad/.test(text) || (p <= 3.2 && r >= 5.1),
      flexible: /non-binary|nonbinary|agender|gender-less|genderless|fluid|flexible|bi-gender|bigender|poly-gender|polygender|neutrois|genderqueer/.test(text)
    };
  };

  const hintScore = (voice, hints=[], influence=0) => {
    const amt = clamp(+influence||0,0,100) / 100;
    if (!amt || !hints || !hints.length) return 0;
    const lang = normLang(voice.lang), name = String(voice.name||'').toLowerCase();
    let score = 0;
    hints.forEach((h,i) => {
      h = normLang(h); if (!h) return;
      const base = Math.max(1, 12 - i);
      if (lang === h) score += base * 2.2;
      else if (lang.split('-')[0] === h.split('-')[0]) score += base * 1.25;
      if (name.includes(h)) score += 2;
    });
    return score * amt * (amt > .55 ? 1.85 : 1);
  };

  const scoreVoice = (voice, profile={}, opts={}) => {
    const name = String(voice.name||'').toLowerCase(), lang = normLang(voice.lang);
    const wish = familyWish(profile, opts.npc || {});
    let score = 0;
    if (/^en(-|$)/.test(lang) || /english/.test(name)) score += opts.forceAccentVoice ? 3 : 18;
    if (naturalName.test(name)) score += 10;
    score += hintScore(voice, opts.biomeAccent?.voiceLangHints || opts.accentVoiceHints || [], opts.biomeAccent?.influence ?? opts.accentInfluence ?? 0);
    if (wish.feminine && /female|woman|samantha|victoria|zira|susan|karen|moira|tessa|serena|aria|jenny|ava|emma|natasha|sonia|heather|caitlin|kirsty|isabella|lauren|sarah|claire|hannah|nicole|sue/.test(name)) score += 9;
    if (wish.masculine && /male|man|daniel|david|mark|alex|fred|george|tom|guy|brian|andrew|eric|thomas|stuart|adam|giles|jack|nathan|william/.test(name)) score += 9;
    if (wish.flexible && /alex|sam|jordan|casey|neutral|aria|jenny|guy|andrew/.test(name)) score += 5;
    if (voice.localService) score += 1;
    if (voice.default) score += .5;
    return score;
  };

  const chooseVoice = async (profile={}, opts={}) => {
    const voices = await loadVoices();
    if (!voices.length) return null;
    const preferred = opts.voiceName || opts.preferredVoiceName;
    if (preferred) {
      const exact = voices.find(v => v.name === preferred || v.voiceURI === preferred);
      if (exact) return exact;
    }
    return voices.slice().sort((a,b)=>scoreVoice(b,profile,opts)-scoreVoice(a,profile,opts))[0] || voices[0];
  };

  const smoothControls = (controls={}, profile={}, opts={}) => {
    const human = window.BelavadosVoiceHumanization || null;
    const humanControls = human ? human.controlsFor(profile || {}, { ...opts, emotionKey:opts.emotionKey || opts.emotion || 'neutral' }) : null;
    const p = profile || {};
    const accent = opts.biomeAccent?.influence ? clamp(+opts.biomeAccent.influence,0,100)/100 : 0;
    let rate = humanControls ? humanControls.rate : (+controls.rate || 1);
    let pitch = humanControls ? humanControls.pitch : (+controls.pitch || 1);
    // Browser TTS becomes robotic at extremes. Deep/bright identity is carried by voice choice, cadence, and text shape.
    rate = clamp(rate + ((+controls.rate || 1) - 1) * .16, .84, 1.15);
    pitch = clamp(pitch + ((+controls.pitch || 1) - 1) * .12, .955, 1.075);
    if (accent > .55) rate = clamp(rate + ((opts.accentCadence?.rateBias||0) * .12), .84, 1.15);
    let out = { rate:+rate.toFixed(3), pitch:+pitch.toFixed(3), volume:clamp(humanControls ? humanControls.volume : (+controls.volume||.94),.62,1) };
    if (window.BelavadosNaturalnessGuard) out = window.BelavadosNaturalnessGuard.controlsFor(profile || {}, out, opts);
    return out;
  };

  const say = async (text, controls={}, opts={}) => {
    if (!isAvailable()) return { spoken:false, phrase:String(text||''), reason:'Speech synthesis unavailable.' };
    const my = ++token;
    const synth = window.speechSynthesis;
    const phrase = String(text||'this is what I sound like').replace(/\s+/g,' ').trim() || 'this is what I sound like';
    const voice = opts.voice || await chooseVoice(opts.profile || {}, opts);
    const finalControls = smoothControls(controls, opts.profile || {}, opts);
    try { synth.cancel(); } catch {}
    return new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(phrase);
      u.rate = finalControls.rate;
      u.pitch = finalControls.pitch;
      u.volume = finalControls.volume;
      if (voice) { u.voice = voice; if (voice.lang) u.lang = voice.lang; }
      else if (opts.lang) u.lang = opts.lang;
      let done=false;
      const finish = (status='ended') => { if (!done) { done=true; resolve({ spoken:true, status, phrase, controls:finalControls, voice:voice?.name||'browser default', lang:u.lang||voice?.lang||'' }); } };
      u.onend = () => finish('ended');
      u.onerror = ev => finish('error:' + (ev?.error || 'unknown'));
      synth.speak(u);
      const watch = Math.max(2400, Math.min(16000, phrase.length * 110 / Math.max(.65, finalControls.rate) + 1400));
      setTimeout(() => { if (my === token) finish('watchdog'); }, watch);
    });
  };

  const stop = () => { token++; try { window.speechSynthesis?.cancel?.(); } catch {} };
  const pause = () => { try { window.speechSynthesis?.pause?.(); } catch {} };
  const resume = () => { try { window.speechSynthesis?.resume?.(); } catch {} };

  window.BelavadosSpeechApi = { isAvailable, loadVoices, chooseVoice, scoreVoice, say, stop, pause, resume, smoothControls };
  if (isAvailable()) loadVoices(1200);
})();
