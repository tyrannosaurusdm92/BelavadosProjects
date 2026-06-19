/* Belavadös Voice Studio - browser TTS naturalness guard
   Keeps deep/masculine and high/bright voices out of robotic pitch extremes. */
(() => {
  'use strict';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const extra=()=>window.BELAVADOS_REFERENCE_AUDIO_LEARNING||{};
  const norm=p=>({
    pitch:+p.pitch||5, speed:+p.speed||5, inflection:+p.inflection||5, stutter:+p.stutter||0, breath:+p.breath||5, roughness:+p.roughness||5, resonance:+p.resonance||5, formality:+p.formality||5,
    vowelFlow:+p.vowelFlow||5, consonantBite:+p.consonantBite||5, mouthShape:+p.mouthShape||5, nasality:+p.nasality||5, throatDepth:+p.throatDepth||5, rhythm:+p.rhythm||5, pauseControl:+p.pauseControl||5, emphasis:+p.emphasis||5, warmth:+p.warmth||5, clarity:+p.clarity||5, projection:+p.projection||5, humanVariation:+p.humanVariation||5, accentColor:+p.accentColor||5
  });
  const stablePitch = (profile={}, controls={}) => {
    const p=norm(profile), input=+controls.pitch||1;
    // Voice identity should come mostly from selected browser voice and resonance metadata, not huge pitch shifting.
    let base = 1 + (p.pitch-5)*0.010 + (p.inflection-5)*0.0025 - Math.max(0,p.resonance-6)*0.003 + Math.max(0,p.breath-7)*0.002;
    if (p.pitch <= 2.5 || (p.resonance>=7 && p.pitch<=4)) base = 0.972 + (p.pitch-2.5)*0.004;
    if (p.pitch >= 7.5) base = 1.036 + (p.pitch-7.5)*0.006;
    // Blend any upstream pitch toward safer center.
    base = base*.78 + input*.22;
    return clamp(base, .955, 1.075);
  };
  const controlsFor = (profile={}, controls={}, opts={}) => {
    const p=norm(profile), c=controls||{};
    const data=extra().overall||{};
    let rate=(+c.rate||1);
    rate = rate*.55 + (0.99 + (p.speed-5)*0.020 + (p.rhythm-5)*0.006 - Math.max(0,p.pauseControl-6)*0.004)*.45;
    if ((opts.emotionKey||opts.emotion)==='grief'||(opts.emotionKey||opts.emotion)==='exhaustion') rate-=.025;
    if ((opts.emotionKey||opts.emotion)==='panic'||(opts.emotionKey||opts.emotion)==='excitement') rate+=.025;
    if (data.averagePauseFraction) rate += clamp((0.42-data.averagePauseFraction)*0.06,-.015,.015);
    let volume=clamp((+c.volume||.94) + (p.projection-5)*.012 + (p.warmth-5)*.004 - (p.breath-6)*.003, .66, 1);
    return { rate:+clamp(rate,.84,1.15).toFixed(3), pitch:+stablePitch(profile,c).toFixed(3), volume:+volume.toFixed(3) };
  };
  const cadenceFor = (profile={}, cadence={}, opts={}) => {
    const p=norm(profile), c={...(cadence||{})};
    // Keep preview mostly phrase-level. Avoid word-chopping unless hesitation is very high.
    c.pauseBias = clamp((+c.pauseBias||0) + (p.pauseControl-5)*0.010 - Math.max(0,p.vowelFlow-6)*0.008, -.08, .12);
    c.stress = clamp((+c.stress||0) + (p.emphasis-5)*0.018 + (p.consonantBite-5)*0.014, -.1, .22);
    c.legatoDelta = clamp((+c.legatoDelta||0) + (p.vowelFlow-5)*0.025 + (p.warmth-5)*0.010, -.3, .45);
    c.consonantForceDelta = clamp((+c.consonantForceDelta||0) + (p.consonantBite-5)*0.035 + (p.clarity-5)*0.012, -.35, .55);
    c.gutturalResonanceDelta = clamp((+c.gutturalResonanceDelta||0) + (p.throatDepth-5)*0.030 + (p.roughness-5)*0.012, -.25, .55);
    c.nasalityDelta = clamp((+c.nasalityDelta||0) + (p.nasality-5)*0.025, -.25, .45);
    c.vowelStretch = clamp((+c.vowelStretch||0) + (p.vowelFlow-5)*0.018, -.08, .20);
    c.humanVariation = clamp((p.humanVariation-5)*0.010, -.03, .05);
    return c;
  };
  const describe = () => ({
    mode:'browser-safe naturalness guard',
    deepVoiceStrategy:'choose a deeper browser voice first; use only mild pitch lowering to avoid robotic artifacts',
    highVoiceStrategy:'cap upper pitch and carry brightness through cadence/clarity instead of chipmunk pitch',
    learnedReferenceCounts:extra().overall||{}
  });
  window.BelavadosNaturalnessGuard = { controlsFor, cadenceFor, stablePitch, describe };
})();
