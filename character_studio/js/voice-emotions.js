/* Belavadös Voice Studio - Emotion overlays for clean expressive speech preview/export */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const EMOTIONS = {
    neutral: { label:'Neutral / Base', description:'Uses the base voice without extra emotional coloring.', adjust:{}, cadence:{ pitchCurve:'gentle-rise-fall' }, punctuation:'.' },
    kindness: { label:'Kindness', description:'Warm, gentle, open, and lightly melodic.', adjust:{ pitch:.2, speed:-.25, inflection:.65, breath:.25, roughness:-.45, resonance:.15, formality:-.15 }, cadence:{ pitchCurve:'rising', pauseBias:.08, pitchBias:.04, rateBias:-.04, volumeBias:-.02 }, punctuation:'.' },
    compassion: { label:'Compassion', description:'Soft, careful, emotionally present, and reassuring.', adjust:{ pitch:.05, speed:-.65, inflection:.55, breath:.45, roughness:-.55, resonance:.25, formality:.15 }, cadence:{ pitchCurve:'gentle-rise-fall', pauseBias:.28, pitchBias:-.02, rateBias:-.12, volumeBias:-.08 }, punctuation:'...' },
    tenderness: { label:'Tenderness', description:'Quiet, delicate, protective, and affectionate.', adjust:{ pitch:.25, speed:-.7, inflection:.55, breath:.55, roughness:-.65, resonance:-.1, formality:-.25 }, cadence:{ pitchCurve:'gentle-rise-fall', pauseBias:.2, rateBias:-.1, volumeBias:-.12 }, punctuation:'...' },
    joy: { label:'Joy', description:'Bright, quick, smiling, and expressive.', adjust:{ pitch:.85, speed:.7, inflection:1.35, breath:.05, roughness:-.35, resonance:-.15, formality:-.45 }, cadence:{ pitchCurve:'rising', pauseBias:-.12, pitchBias:.12, rateBias:.12, stress:.35, volumeBias:.04 }, punctuation:'!' },
    excitement: { label:'Excitement', description:'Energetic, fast, bouncy, and enthusiastic.', adjust:{ pitch:.95, speed:1.15, inflection:1.55, stutter:.15, breath:.15, roughness:-.15, resonance:.05, formality:-.75 }, cadence:{ pitchCurve:'rising', pauseBias:-.18, pitchBias:.18, rateBias:.16, stress:.5, volumeBias:.06, rateCurve:.1 }, punctuation:'!' },
    calm: { label:'Calm', description:'Settled, slower, smoother, and grounded.', adjust:{ pitch:-.1, speed:-.95, inflection:-.55, stutter:-.3, breath:.1, roughness:-.55, resonance:.4, formality:.25 }, cadence:{ pitchCurve:'flat', pauseBias:.22, rateBias:-.12, volumeBias:-.03 }, punctuation:'.' },
    annoyance: { label:'Annoyance', description:'Clipped, tighter, impatient, and slightly sharper.', adjust:{ pitch:.1, speed:.45, inflection:.35, breath:-.2, roughness:.55, resonance:.1, formality:.15 }, cadence:{ pitchCurve:'tight', pauseBias:-.08, rateBias:.08, stress:.3, volumeBias:.02 }, prefix:'fine, ', punctuation:'.' },
    sarcasm: { label:'Sarcasm', description:'Dry, pointed, slower on key words, and wry.', adjust:{ pitch:-.2, speed:-.3, inflection:.9, breath:-.1, roughness:.25, resonance:.05, formality:-.35 }, cadence:{ pitchCurve:'falling', pauseBias:.16, rateBias:-.06, stress:.24 }, prefix:'oh, ', punctuation:'.' },
    suspicion: { label:'Suspicion', description:'Lower, slower, narrower, and watchful.', adjust:{ pitch:-.35, speed:-.5, inflection:-.1, breath:.1, roughness:.25, resonance:.35, formality:.1 }, cadence:{ pitchCurve:'tight', pauseBias:.26, pitchBias:-.05, rateBias:-.09 }, punctuation:'...' },
    gruffness: { label:'Gruffness', description:'Low, blunt, sturdy, and rough-edged without hiss/static.', adjust:{ pitch:-.9, speed:-.35, inflection:-.35, breath:-.35, roughness:1.25, resonance:1.0, formality:-.35 }, cadence:{ pitchCurve:'falling', pauseBias:.08, pitchBias:-.12, rateBias:-.08, stress:.35, volumeBias:.04 }, punctuation:'.' },
    anger: { label:'Anger', description:'Forceful, direct, tense, and louder-feeling.', adjust:{ pitch:-.25, speed:.55, inflection:.85, breath:-.45, roughness:1.05, resonance:.95, formality:.05 }, cadence:{ pitchCurve:'falling', pauseBias:-.14, pitchBias:-.05, rateBias:.12, stress:.72, volumeBias:.1 }, punctuation:'!' },
    rage: { label:'Rage', description:'Explosive, loud-feeling, fast, and jagged.', adjust:{ pitch:-.15, speed:.85, inflection:1.2, stutter:.15, breath:-.55, roughness:1.35, resonance:1.05, formality:-.2 }, cadence:{ pitchCurve:'wavering', pauseBias:-.2, rateBias:.2, stress:.9, volumeBias:.14 }, punctuation:'!' },
    betrayal: { label:'Betrayal', description:'Hurt, stunned, wavering, and emotionally sharp.', adjust:{ pitch:.15, speed:-.45, inflection:1.2, stutter:.3, breath:.4, roughness:.4, resonance:.2, formality:.05 }, cadence:{ pitchCurve:'wavering', pauseBias:.34, rateBias:-.08, stress:.32, hesitationBias:.15 }, punctuation:'...' },
    grief: { label:'Grief', description:'Low-energy, heavy, quiet, and fragile.', adjust:{ pitch:-.3, speed:-1.1, inflection:-.2, stutter:.2, breath:.55, roughness:.15, resonance:.25, formality:.25 }, cadence:{ pitchCurve:'falling', pauseBias:.5, pitchBias:-.08, rateBias:-.16, volumeBias:-.16, hesitationBias:.12 }, punctuation:'...' },
    fear: { label:'Fear', description:'Higher, quicker, shaky, and hesitant.', adjust:{ pitch:.85, speed:.5, inflection:1.05, stutter:.7, breath:.6, roughness:.1, resonance:-.35, formality:-.25 }, cadence:{ pitchCurve:'wavering', pauseBias:.04, pitchBias:.12, rateBias:.08, stress:.25, hesitationBias:.25 }, punctuation:'!' },
    panic: { label:'Panic', description:'Fast, breathy, broken, and urgent.', adjust:{ pitch:1.1, speed:1.25, inflection:1.45, stutter:1.25, breath:.7, roughness:.25, resonance:-.45, formality:-.65 }, cadence:{ pitchCurve:'wavering', pauseBias:-.16, pitchBias:.18, rateBias:.2, stress:.5, hesitationBias:.38 }, punctuation:'!' },
    exhaustion: { label:'Exhaustion', description:'Slow, low, weary, and sparse.', adjust:{ pitch:-.5, speed:-1.25, inflection:-.75, stutter:.05, breath:.45, roughness:.25, resonance:.2, formality:-.15 }, cadence:{ pitchCurve:'falling', pauseBias:.48, pitchBias:-.08, rateBias:-.18, volumeBias:-.12 }, punctuation:'...' },
    authority: { label:'Authority', description:'Measured, clear, firm, and commanding.', adjust:{ pitch:-.35, speed:-.25, inflection:.05, breath:-.35, roughness:.25, resonance:1.15, formality:1.25 }, cadence:{ pitchCurve:'falling', pauseBias:.18, pitchBias:-.05, rateBias:-.04, stress:.44, volumeBias:.03 }, prefix:'listen: ', punctuation:'.' },
    courage: { label:'Courage', description:'Steady, brightened, resilient, and clear.', adjust:{ pitch:.05, speed:.1, inflection:.5, breath:-.1, roughness:.2, resonance:.75, formality:.35 }, cadence:{ pitchCurve:'rising', pauseBias:.02, stress:.22, volumeBias:.04 }, punctuation:'.' },
    shame: { label:'Shame', description:'Small, quiet, hesitant, and inward.', adjust:{ pitch:-.1, speed:-.7, inflection:-.25, stutter:.5, breath:.35, roughness:-.1, resonance:-.45, formality:-.05 }, cadence:{ pitchCurve:'falling', pauseBias:.38, volumeBias:-.18, hesitationBias:.25 }, punctuation:'...' },
    awe: { label:'Awe', description:'Breath-held, open, slow, and reverent.', adjust:{ pitch:.25, speed:-.65, inflection:.9, breath:.3, roughness:-.35, resonance:.45, formality:.55 }, cadence:{ pitchCurve:'rising', pauseBias:.34, pitchBias:.08, rateBias:-.1, volumeBias:-.05 }, punctuation:'...' },
    confidence: { label:'Confidence', description:'Centered, assured, clear, and forward.', adjust:{ pitch:-.05, speed:.05, inflection:.35, breath:-.25, roughness:.05, resonance:.75, formality:.45 }, cadence:{ pitchCurve:'gentle-rise-fall', pauseBias:.06, stress:.28, volumeBias:.04 }, punctuation:'.' },
    flirtation: { label:'Flirtation', description:'Warm, playful, slower, and teasing.', adjust:{ pitch:.25, speed:-.25, inflection:.85, breath:.35, roughness:-.15, resonance:.1, formality:-.55 }, cadence:{ pitchCurve:'gentle-rise-fall', pauseBias:.22, pitchBias:.04, rateBias:-.08 }, punctuation:'.' },
    menace: { label:'Menace', description:'Low, slow, controlled, and dangerous.', adjust:{ pitch:-.9, speed:-.65, inflection:-.2, breath:-.2, roughness:.85, resonance:1.05, formality:.25 }, cadence:{ pitchCurve:'falling', pauseBias:.42, pitchBias:-.16, rateBias:-.14, stress:.35 }, punctuation:'...' },
    wonder: { label:'Wonder', description:'Open, curious, rising, and bright.', adjust:{ pitch:.45, speed:-.1, inflection:1.05, breath:.2, roughness:-.35, resonance:.05, formality:-.1 }, cadence:{ pitchCurve:'rising', pauseBias:.14, pitchBias:.1, stress:.15 }, punctuation:'...' }
  };

  const emotionList = () => Object.entries(EMOTIONS).map(([key, value]) => ({ key, ...value }));
  const scaleAdjustment = (adjust = {}, intensity = 100) => {
    const amt = Core.clamp(+intensity || 0, 0, 100) / 100;
    const out = {};
    Object.keys(adjust || {}).forEach(k => out[k] = adjust[k] * amt);
    return out;
  };
  const applyAdjustment = (profile = {}, adjust = {}) => {
    const out = { ...profile };
    Core.TRAITS.forEach(t => { out[t.key] = Core.clamp(Core.normalizeTrait(out[t.key] ?? Core.DEFAULT_PROFILE[t.key]) + (+adjust[t.key] || 0), 0, 10); });
    return out;
  };
  const applyEmotion = (profile = {}, emotionKey = 'neutral', intensity = 100) => {
    const emotion = EMOTIONS[emotionKey] || EMOTIONS.neutral;
    return applyAdjustment(profile, scaleAdjustment(emotion.adjust || {}, intensity));
  };
  const emotionByKey = key => EMOTIONS[key] || EMOTIONS.neutral;
  const maybePrefix = (phrase, prefix, amount) => {
    if (!prefix || amount < .5) return phrase;
    const clean = phrase.trim();
    if (clean.toLowerCase().startsWith(prefix.trim().toLowerCase())) return phrase;
    return prefix + clean.charAt(0).toLowerCase() + clean.slice(1);
  };
  const shapeText = (text = '', emotionKey = 'neutral', intensity = 100, profile = {}) => {
    const emotion = emotionByKey(emotionKey);
    let phrase = String(text || 'this is what I sound like').trim() || 'this is what I sound like';
    const amount = Core.clamp(+intensity || 0, 0, 100) / 100;
    phrase = maybePrefix(phrase, emotion.prefix, amount);
    if (emotionKey === 'betrayal' && amount > .45) phrase = phrase.replace(/\bwhat I sound like\b/i, 'what I sound like after that');
    if (emotionKey === 'grief' && amount > .45) phrase = phrase.replace(/\bthis is\b/i, 'I think this is');
    if (emotionKey === 'fear' && amount > .5) phrase = phrase.replace(/\bthis is\b/i, 'wait, this is');
    if (emotionKey === 'panic' && amount > .45) phrase = phrase.replace(/\bthis is\b/i, 'please, this is');
    if (emotionKey === 'awe' && amount > .5) phrase = phrase.replace(/\bthis is\b/i, 'oh... this is');
    if (emotionKey === 'wonder' && amount > .55) phrase = phrase.replace(/\bthis is\b/i, 'oh, this is');
    const punct = emotion.punctuation || '.';
    if (!/[.!?…]$/.test(phrase)) phrase += punct;
    if (punct === '!' && amount > .7) phrase = phrase.replace(/[.]+$/, '!');
    return phrase;
  };
  const describeEmotion = (key, intensity = 100) => {
    const e = emotionByKey(key);
    return `${e.label} (${Math.round(Core.clamp(+intensity || 0, 0, 100))}%): ${e.description}`;
  };
  window.BelavadosVoiceEmotions = { EMOTIONS, emotionList, emotionByKey, applyEmotion, shapeText, describeEmotion, scaleAdjustment, applyAdjustment };
})();
