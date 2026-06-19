/* Belavadös Voice Studio - Core mapping and utilities */
(() => {
  'use strict';
  const TRAITS = [
    { key:'pitch', label:'Voice Height', left:'Deep', right:'Bright', help:'Moves the voice lower or higher while keeping the browser voice natural.' },
    { key:'speed', label:'Speaking Speed', left:'Slow', right:'Quick', help:'Controls how quickly the character talks.' },
    { key:'inflection', label:'Expression Shape', left:'Steady', right:'Melodic', help:'Adds more rise, fall, and emotional movement to sentences.' },
    { key:'stutter', label:'Hesitations', left:'None', right:'Frequent', help:'Adds small repeats and uncertainty only when desired.' },
    { key:'breath', label:'Softness', left:'Crisp', right:'Airy', help:'Makes delivery cleaner or softer without adding static.' },
    { key:'roughness', label:'Gruff Edge', left:'Smooth', right:'Gravelly', help:'Adds gruff attitude through cadence and stress instead of noisy hiss.' },
    { key:'resonance', label:'Body / Depth', left:'Thin', right:'Full', help:'Changes how small, chesty, full, or booming the voice feels.' },
    { key:'formality', label:'Speech Style', left:'Casual', right:'Ceremonial', help:'Moves between relaxed everyday phrasing and careful formal speech.' },
    { key:'vowelFlow', label:'Vowel Flow', left:'Clipped', right:'Stretched', help:'Shortens or lengthens vowel feel for dry, flowing, aquatic, bardic, or cavern voices.' },
    { key:'consonantBite', label:'Consonant Bite', left:'Soft', right:'Sharp', help:'Controls how strongly consonants land.' },
    { key:'mouthShape', label:'Mouth Shape', left:'Closed', right:'Open', help:'Adjusts mouth-feel for rounded, open, or narrow speech.' },
    { key:'nasality', label:'Nasal Color', left:'Oral', right:'Nasal', help:'Adds or removes nasal color from the fantasy accent.' },
    { key:'throatDepth', label:'Throat Depth', left:'Forward', right:'Back', help:'Adds safe throat/back resonance for cavern, orcish, dwarvish, and deep voices.' },
    { key:'rhythm', label:'Speech Rhythm', left:'Even', right:'Bouncy', help:'Controls how evenly or rhythmically phrases move.' },
    { key:'pauseControl', label:'Pause Space', left:'Tight', right:'Spacious', help:'Controls phrase spacing without forcing long gaps between words.' },
    { key:'emphasis', label:'Word Emphasis', left:'Gentle', right:'Strong', help:'Controls stress and punch on important words.' },
    { key:'warmth', label:'Warmth', left:'Cool', right:'Warm', help:'Softens or warms the character delivery.' },
    { key:'clarity', label:'Clarity', left:'Muttered', right:'Clear', help:'Controls articulation and word precision.' },
    { key:'projection', label:'Projection', left:'Quiet', right:'Projected', help:'Makes the voice feel private or outward-facing.' },
    { key:'humanVariation', label:'Human Variation', left:'Steady', right:'Alive', help:'Adds tiny phrase-level variation so the voice feels less mechanical.' },
    { key:'accentColor', label:'Accent Color', left:'Removed', right:'Strong', help:'Separately lightens or strengthens the fantasy accent mouth-feel.' }
  ];
  const DEFAULT_PROFILE = Object.freeze({ pitch:5, speed:5, inflection:5, stutter:1, breath:3, roughness:2, resonance:5.5, formality:5.5, vowelFlow:5, consonantBite:5, mouthShape:5, nasality:5, throatDepth:5, rhythm:5, pauseControl:5, emphasis:5, warmth:5, clarity:6, projection:5, humanVariation:5, accentColor:7 });
  const WAVEFORMS = ['sine','triangle','sawtooth','square','noise','hybrid'];
  const clamp = (n, min=0, max=10) => Math.max(min, Math.min(max, Number.isFinite(+n) ? +n : min));
  const round = (n, places=3) => Number.parseFloat((+n).toFixed(places));
  const normalizeTrait = (value) => {
    const n = +value;
    if (!Number.isFinite(n)) return 5;
    return n > 10 ? clamp(n / 10, 0, 10) : clamp(n, 0, 10);
  };
  const fromHundred = (obj = {}) => {
    const out = { ...DEFAULT_PROFILE };
    TRAITS.forEach(t => { if (obj[t.key] !== undefined) out[t.key] = normalizeTrait(obj[t.key]); });
    return out;
  };
  const toHundred = (profile = {}) => {
    const out = {};
    TRAITS.forEach(t => out[t.key] = Math.round(normalizeTrait(profile[t.key]) * 10));
    return out;
  };
  const profileToEngine = (profile = {}, options = {}) => {
    const p = { ...DEFAULT_PROFILE };
    TRAITS.forEach(t => p[t.key] = normalizeTrait(profile[t.key] ?? p[t.key]));
    const MathCore = window.BelavadosVoiceMathCore;
    const Vocoder = window.BelavadosVocoderMath;
    const Prosody = window.BelavadosProsodyMath;
    const Formants = window.BelavadosFormantMath;
    const Instability = window.BelavadosInstabilityMath;
    const pitchSkew = p.pitch - 5;
    const inflect = p.inflection / 10;
    const breath = p.breath / 10;
    const rough = p.roughness / 10;
    const reson = p.resonance / 10;
    const formal = p.formality / 10;
    const vowelFlow = p.vowelFlow / 10, consonantBite = p.consonantBite / 10, mouthShape = p.mouthShape / 10, nasality = p.nasality / 10, throatDepth = p.throatDepth / 10, rhythm = p.rhythm / 10, pauseControl = p.pauseControl / 10, emphasis = p.emphasis / 10, warmth = p.warmth / 10, clarity = p.clarity / 10, projection = p.projection / 10, humanVariation = p.humanVariation / 10, accentColor = p.accentColor / 10;
    const vocoder = Vocoder ? Vocoder.buildParams(p, options) : null;
    const prosody = Prosody ? Prosody.buildProsody(p, options) : null;
    const formants = Formants ? Formants.buildFormants(p, options) : null;
    const instability = Instability ? Instability.buildInstability(p, options) : null;
    const f0 = vocoder?.f0Hz ?? round(150 * Math.pow(2, pitchSkew / 10), 2);
    return {
      f0: round(f0, 2),
      pitch_range: round(8 + 52 * inflect + rhythm * 6 + humanVariation * 4, 2),
      formant_shift: round(formants?.formantScale ?? (0.82 + (p.pitch / 10) * 0.36 + (reson - .5) * .1), 3),
      speech_rate: round(0.78 + p.speed * 0.076 + (rhythm-.5)*.04 + (prosody?.rateBias || 0), 3),
      pause_density: round(Math.max(0.0, (p.stutter <= .05 ? 0 : 0.015) + (formal * .012) + Math.max(0, p.stutter - 1) * .006 + Math.max(0, pauseControl-.5)*.035 - Math.max(0, vowelFlow-.5)*.018), 3),
      breath_noise_mix: round(vocoder?.aperiodicity?.breathBand ?? breath, 3),
      roughness_amount: round(rough, 3),
      resonance_amount: round(reson, 3),
      articulation_precision: round(Math.max(0, Math.min(1, formal*.62 + clarity*.38)), 3),
      vowel_flow_amount: round(vowelFlow, 3),
      consonant_bite_amount: round(consonantBite, 3),
      mouth_shape_amount: round(mouthShape, 3),
      nasality_amount: round(nasality, 3),
      throat_depth_amount: round(throatDepth, 3),
      rhythm_amount: round(rhythm, 3),
      pause_space_amount: round(pauseControl, 3),
      emphasis_amount: round(emphasis, 3),
      warmth_amount: round(warmth, 3),
      clarity_amount: round(clarity, 3),
      projection_amount: round(projection, 3),
      human_variation_amount: round(humanVariation, 3),
      accent_color_amount: round(accentColor, 3),
      stutter_amount: round(p.stutter / 10, 3),
      inflection_amount: round(inflect, 3),
      prosody_motion: round(0.08 + inflect * 0.46 + (prosody?.stress || 0) * .12, 3),
      word_stress: round(0.14 + inflect * 0.26 + rough * 0.10 + formal * 0.10 + emphasis * .22 + consonantBite * .18 + (prosody?.stress || 0), 3),
      breath_group_words: Math.max(6, Math.min(22, Math.round(15 - inflect * 1.5 + formal * 2 - (p.stutter / 10) * 4))),
      pause_ms: Math.round(Math.max(0, prosody?.pauseMs ?? ((p.stutter <= .05 ? 0 : 8) + (1 - p.speed / 10) * 22 + formal * 10 + (p.stutter / 10) * 52 + Math.max(0,pauseControl-.5)*60 - Math.max(0,vowelFlow-.5)*28))),
      clean_preview: true,
      oscillator: options.waveform || guessWaveform(p),
      gain: round(0.18 + (reson * .08) - (breath * .04), 3),
      semitone_shift: round(MathCore ? MathCore.ratioToSemitones(f0 / 150) : pitchSkew * 1.2, 3),
      source_filter: vocoder?.source || null,
      formants: formants || null,
      instability: instability || vocoder?.instability || null,
      psola: vocoder?.psola || null,
      vocoder: vocoder || null,
      prosody_math: prosody || null
    };
  };
  const guessWaveform = (profile = {}) => {
    const rough = normalizeTrait(profile.roughness);
    const breath = normalizeTrait(profile.breath);
    const reson = normalizeTrait(profile.resonance);
    if (rough >= 8) return 'sawtooth';
    if (breath >= 8) return 'hybrid';
    if (reson <= 2) return 'sine';
    if (rough >= 5) return 'square';
    return 'triangle';
  };
  const weightedMerge = (profiles = [], weights = []) => {
    if (!profiles.length) return { ...DEFAULT_PROFILE };
    const total = profiles.reduce((sum, _, i) => sum + Math.max(0.001, +weights[i] || 1), 0);
    const out = {};
    TRAITS.forEach(t => {
      out[t.key] = round(profiles.reduce((sum, p, i) => sum + normalizeTrait(p[t.key]) * (Math.max(0.001, +weights[i] || 1) / total), 0), 2);
    });
    return out;
  };

  const scaleAdjustment = (adjustment = {}, percent = 100) => {
    const amt = clamp(+percent || 0, 0, 100) / 100;
    const out = {};
    Object.keys(adjustment || {}).forEach(k => out[k] = (+adjustment[k] || 0) * amt);
    return out;
  };
  const blendProfiles = (from = DEFAULT_PROFILE, to = DEFAULT_PROFILE, percent = 100) => {
    const amt = clamp(+percent || 0, 0, 100) / 100;
    const out = {};
    TRAITS.forEach(t => {
      const a = normalizeTrait(from[t.key] ?? DEFAULT_PROFILE[t.key]);
      const b = normalizeTrait(to[t.key] ?? DEFAULT_PROFILE[t.key]);
      out[t.key] = round(a + (b - a) * amt, 2);
    });
    return out;
  };

  const hashString = (s='') => {
    let h = 2166136261;
    for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24); }
    return h >>> 0;
  };
  const seededPick = (arr, seed='') => arr.length ? arr[hashString(seed) % arr.length] : null;
  const safeJsonParse = (text, fallback = null) => { try { return JSON.parse(text); } catch { return fallback; } };
  const downloadText = (filename, text, type='application/javascript') => {
    const blob = new Blob([text], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  const makeCharacterSheetSlider = (trait, value) => {
    const v = Math.round(normalizeTrait(value));
    const left = '─'.repeat(v);
    const right = '─'.repeat(10-v);
    return `${trait.left} ◄${left}●${right}► ${trait.right}`;
  };
  window.BelavadosVoiceCore = { TRAITS, DEFAULT_PROFILE, WAVEFORMS, clamp, round, normalizeTrait, fromHundred, toHundred, profileToEngine, guessWaveform, weightedMerge, scaleAdjustment, blendProfiles, hashString, seededPick, safeJsonParse, downloadText, makeCharacterSheetSlider };
})();
