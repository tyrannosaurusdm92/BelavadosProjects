/* Belavadös Voice Studio - smoothed browser-safe vocal model */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number.isFinite(+n) ? +n : min));
  const norm = v => Core ? Core.normalizeTrait(v) : clamp(+v || 5, 0, 10);
  const pct = v => clamp(+v || 0, 0, 100) / 100;
  const safe = v => Number.isFinite(+v) ? +v : 0;
  const getProfile = (profile = {}) => {
    const defaults = Core ? Core.DEFAULT_PROFILE : { pitch:5, speed:5, inflection:5, stutter:1, breath:3, roughness:2, resonance:5.5, formality:5.5 };
    return Object.fromEntries(Object.keys(defaults).map(k => [k, norm(profile[k] ?? defaults[k])]));
  };
  const softsign = x => x / (1 + Math.abs(x));
  const preferredLangScore = (voice, hints = [], influence = 0) => {
    if (!hints || !hints.length || influence <= 0) return 0;
    const lang = String(voice.lang || '').toLowerCase().replace('_','-');
    const name = String(voice.name || '').toLowerCase();
    let s = 0;
    hints.forEach((hint, i) => {
      const h = String(hint || '').toLowerCase().replace('_','-');
      if (!h) return;
      if (lang === h) s += 15 - Math.min(i, 6);
      else if (lang.startsWith(h.split('-')[0] + '-') || lang === h.split('-')[0]) s += 8 - Math.min(i, 4);
      if (name.includes(h)) s += 2;
    });
    return s * clamp(influence, 0, 100) / 100;
  };
  const buildModel = (profile = {}, opts = {}) => {
    const p = getProfile(profile);
    const Vocoder = window.BelavadosVocoderMath;
    const Prosody = window.BelavadosProsodyMath;
    const EmotionCurves = window.BelavadosEmotionCurveMath;
    const SpeakerRef = window.BelavadosSpeakerReferenceMath;
    const emotionKey = opts.emotionKey || opts.emotion || 'neutral';
    const emotionIntensity = pct(opts.emotionIntensity ?? 100);
    const emotionCadence = EmotionCurves ? EmotionCurves.cadence(emotionKey, opts.emotionIntensity ?? 100) : {};
    const emotionalCadence = { ...emotionCadence, ...(opts.accentCadence || {}), ...(opts.cadence || {}) };
    const expressive = p.inflection / 10, careful = p.formality / 10, airy = p.breath / 10, grit = p.roughness / 10, body = p.resonance / 10, stutter = p.stutter / 10;
    const vowelFlow = (p.vowelFlow ?? 5) / 10, consonantBite = (p.consonantBite ?? 5) / 10, throatDepth = (p.throatDepth ?? 5) / 10, rhythm = (p.rhythm ?? 5) / 10, pauseControl = (p.pauseControl ?? 5) / 10, emphasis = (p.emphasis ?? 5) / 10, warmth = (p.warmth ?? 5) / 10, clarity = (p.clarity ?? 6) / 10, projection = (p.projection ?? 5) / 10, humanVariation = (p.humanVariation ?? 5) / 10, accentColor = (p.accentColor ?? 7) / 10;
    const accentInf = clamp(opts.biomeAccent?.influence ?? 0, 0, 100) / 100;
    const rateBias = safe(emotionalCadence.rateBias) + safe(emotionalCadence.rateShift) + (safe(emotionalCadence.durationMultiplier) ? (1 - safe(emotionalCadence.durationMultiplier)) * .42 : 0);
    const pitchBias = safe(emotionalCadence.pitchBias) + safe(emotionalCadence.pitchAccentDelta) * .035 + safe(emotionalCadence.toneStrengthDelta) * .028;
    const volumeBias = safe(emotionalCadence.volumeBias);
    const pauseBias = safe(emotionalCadence.pauseBias) + Math.max(0, safe(emotionalCadence.legatoDelta)) * -.045 + Math.max(0, -safe(emotionalCadence.legatoDelta)) * .035;
    const stress = safe(emotionalCadence.stress) + safe(emotionalCadence.consonantForceDelta) * .38 + safe(emotionalCadence.gutturalResonanceDelta) * .22;
    const vocoder = Vocoder ? Vocoder.buildParams(p, { ...opts, cadence:emotionalCadence, emotionKey }) : null;
    const prosodyMath = Prosody ? Prosody.buildProsody(p, { ...opts, cadence:emotionalCadence, emotionKey }) : null;
    const reference = opts.recordedVoiceReference || opts.speakerReference || null;
    const referenceWeight = reference && SpeakerRef ? SpeakerRef.profileBlendWeight(reference) : 0;
    const pitchCentered = (p.pitch - 5) / 5;
    const speedCentered = (p.speed - 5) / 5;
    const humanizer = window.BelavadosVoiceHumanization || null;
    const humanReference = humanizer ? humanizer.referenceFor(opts.npc || {}, opts.biomeAccent || null) : null;
    const humanControls = humanizer ? humanizer.controlsFor(p, { ...opts, emotionKey, reference: humanReference }) : null;
    const humanCadence = humanizer ? humanizer.cadenceFor(p, { ...opts, emotionKey, reference: humanReference }) : null;
    const baseRate = humanControls ? clamp(humanControls.rate + rateBias * emotionIntensity * .10 + (rhythm-.5)*.018, .84, 1.15) : clamp(1.00 + speedCentered * .105 + rateBias * emotionIntensity * .28 - careful * .006 + (rhythm-.5)*.026 + accentInf * safe(emotionalCadence.rateBias || 0) * .035, .84, 1.16);
    let basePitch = humanControls ? clamp(humanControls.pitch + pitchBias * emotionIntensity * .010, .955, 1.075) : clamp(1.00 + softsign(pitchCentered) * .062 + pitchBias * emotionIntensity * .020 - grit * .003 + airy * .002, .955, 1.075);
    if (window.BelavadosNaturalnessGuard) basePitch = window.BelavadosNaturalnessGuard.stablePitch(p, { pitch: basePitch });
    const baseVolume = humanControls ? humanControls.volume : clamp(.84 + body * .055 - airy * .020 + grit * .006 + projection*.055 + volumeBias * emotionIntensity, .68, 1);
    const pitchSwing = humanCadence ? clamp(humanCadence.pitchSwing + Math.abs(pitchBias) * emotionIntensity * .004 + humanVariation*.006, .010, .052) : clamp(.010 + expressive * .010 + Math.abs(pitchBias) * emotionIntensity * .005 + humanVariation*.006 + Math.max(0, safe(emotionalCadence.pitchRangeSemitonesDelta)) * .0012, .008, .050);
    const rateSwing = humanCadence ? clamp(humanCadence.rateSwing + Math.abs(rateBias) * emotionIntensity * .003 + rhythm*.004, .006, .045) : clamp(.005 + expressive * .003 + rhythm*.004 + stutter * .002 + Math.abs(rateBias) * emotionIntensity * .003, .004, .034);
    const noHesitation = p.stutter < .35 && Math.abs(pauseBias) < .08 && emotionKey === 'neutral';
    const pauseMs = noHesitation ? 0 : (humanCadence ? clamp(humanCadence.pauseMs + pauseBias * emotionIntensity * 24 + Math.max(0,pauseControl-.5)*45 - Math.max(0,vowelFlow-.5)*18, 25, 190) : clamp(24 + Math.max(0, 5 - p.speed) * 3 + careful * 4 + stutter * 18 + pauseBias * emotionIntensity * 24 + Math.max(0,pauseControl-.5)*45 - Math.max(0,vowelFlow-.5)*18, 18, 180));
    const phraseWords = humanCadence ? clamp(humanCadence.phraseWords + Math.round(vowelFlow*5) - Math.round(stutter*3), 20, 46) : clamp(Math.round(32 + careful * 2 + vowelFlow*5 - stutter * 4 + Math.max(0, safe(emotionalCadence.legatoDelta)) * 4), 20, 46);
    return { profile:p, baseRate, basePitch, baseVolume, pitchSwing, rateSwing, pauseMs, phraseWords, expressive, careful, airy, grit, body, stutter, emotionalCadence, emotionIntensity, vocoder, prosodyMath, speakerReference:reference, speakerReferenceWeight:referenceWeight, articulation:clamp(.46 + careful * .22 + clarity*.24 + (1-airy) * .04 + Math.max(0,stress)*.035,.35,1), warmth:clamp(.30+airy*.16+body*.14+warmth*.32-grit*.06,0,1), edge:clamp(grit*.30+body*.08+throatDepth*.14+consonantBite*.16-airy*.08+Math.max(0,stress)*.08,0,1), hesitationChance:stutter < .08 ? 0 : clamp(stutter*.13+safe(emotionalCadence.hesitationBias)*emotionIntensity,0,.32), chunkAggression:clamp(stutter*.26+Math.max(0,pauseBias)*.16+Math.abs(stress)*.035,0,.50), accentInfluence:Math.round(accentInf*100), accentStyle:emotionalCadence.accentStyle || opts.biomeAccent?.name || 'none', accentVoiceHints:opts.biomeAccent?.voiceLangHints || [], humanReference:humanReference || null }; 
  };
  const scoreVoice = (voice, model = {}, npc = {}, opts = {}) => {
    const name = String(voice.name || '').toLowerCase();
    const lang = String(voice.lang || '').toLowerCase();
    const npcText = JSON.stringify(npc || {}).toLowerCase();
    let score = 0;
    if (/^en[-_]/.test(lang) || /english/.test(name)) score += 14;
    if (/natural|neural|enhanced|premium|online|aria|jenny|guy|brian|andrew|emma|sonia|daniel|samantha|victoria|zira/.test(name)) score += 8;
    score += preferredLangScore(voice, opts.biomeAccent?.voiceLangHints || model.accentVoiceHints || [], opts.biomeAccent?.influence ?? model.accentInfluence ?? 0);
    const pitch = model.profile ? model.profile.pitch : 5, body = model.profile ? model.profile.resonance : 5;
    const wantsFeminine = /female|femme|woman|girl|demi-female|trans-female|feminine/.test(npcText) || pitch >= 6.9;
    const wantsMasculine = /male|masc|man|boy|demi-male|trans-male|masculine/.test(npcText) || (pitch <= 3.2 && body >= 5.2);
    const wantsFlexible = /non-binary|nonbinary|agender|gender-less|genderless|fluid|flexible|bi-gender|bigender|poly-gender|polygender|neutrois/.test(npcText);
    if (wantsFeminine && /female|woman|samantha|victoria|zira|susan|karen|moira|tessa|serena|aria|jenny|ava|emma|natasha|sonia/.test(name)) score += 9;
    if (wantsMasculine && /male|man|daniel|david|mark|alex|fred|george|tom|guy|brian|andrew|eric|thomas/.test(name)) score += 9;
    if (wantsFlexible && /alex|sam|jordan|casey|neutral|aria|jenny|guy|andrew/.test(name)) score += 5;
    if (model.profile?.roughness >= 7 && /guy|brian|andrew|eric|thomas|daniel/.test(name)) score += 2;
    if (model.profile?.breath >= 7 && /aria|jenny|emma|samantha|victoria|sonia/.test(name)) score += 2;
    if (voice.default) score += 1;
    return score;
  };
  const chooseVoice = (profile = {}, opts = {}) => {
    const synth = window.speechSynthesis;
    if (!synth || !synth.getVoices) return null;
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;
    const model = buildModel(profile, opts);
    const preferred = opts.voiceName || opts.preferredVoiceName;
    if (preferred) { const exact = voices.find(v => v.name === preferred || v.voiceURI === preferred); if (exact) return exact; }
    return voices.slice().sort((a,b) => scoreVoice(b, model, opts.npc, opts) - scoreVoice(a, model, opts.npc, opts))[0] || voices[0];
  };
  const describeModel = (profile = {}, opts = {}) => {
    const m = buildModel(profile, opts);
    return { previewMode:'smoothed single-phrase speech with math accents', spokenRate:+m.baseRate.toFixed(3), spokenPitch:+m.basePitch.toFixed(3), phrasePitchMotion:+m.pitchSwing.toFixed(3), phraseRateMotion:+m.rateSwing.toFixed(3), pauseMilliseconds:Math.round(m.pauseMs), wordsPerBreathGroup:m.phraseWords, articulation:+m.articulation.toFixed(3), warmth:+m.warmth.toFixed(3), gruffEdge:+m.edge.toFixed(3), hesitationChance:+m.hesitationChance.toFixed(3), accentStyle:m.accentStyle, accentInfluence:`${m.accentInfluence}%`, sourceFilter:m.vocoder ? { f0Hz:m.vocoder.f0Hz, spectralTilt:m.vocoder.source.spectralTilt, aperiodicity:m.vocoder.aperiodicity } : null, formants:m.vocoder?.spectralEnvelope?.formants || null, jitterShimmer:m.vocoder?.instability || null, psola:m.vocoder ? { semitoneShift:m.vocoder.psola.semitoneShift, durationFactor:m.vocoder.psola.durationFactor, periodCount:m.vocoder.psola.periodCount } : null, speakerReference:m.speakerReference ? 'optional self-recorded reference active' : 'none' };
  };
  window.BelavadosVocalModel = { buildModel, chooseVoice, scoreVoice, describeModel };
})();
