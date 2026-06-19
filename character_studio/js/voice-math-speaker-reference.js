/* Belavadös Voice Studio - optional self-recording reference math
   This is a consented roleplay reference, not an impersonation or cloning layer. */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const buildReference = (analysis={}, clip={}) => {
    const live=analysis.liveAnalysis || analysis || {}; const profile=live.profile || {};
    return { mode:'optional self-recorded roleplay reference', consent:'recorded/imported by current user', clipId:clip.id||analysis.id||'', displayName:clip.displayName||analysis.displayName||'My Recorded Base Voice', estimatedF0Hz:live.estimatedF0Hz||analysis.estimatedF0Hz||null, spectralCentroidHz:live.spectralCentroidHz||analysis.spectralCentroidHz||null, mfcc:live.mfcc||analysis.mfcc||[], formantLikePeaks:live.formantLikePeaks||analysis.formantLikePeaks||[], profileHint:profile };
  };
  const profileBlendWeight = (reference=null) => reference ? .28 : 0;
  const describeReference = ref => ref ? `Optional self-recorded reference: ${ref.displayName}, pitch hint ${ref.estimatedF0Hz||'?'} Hz, tone ${ref.spectralCentroidHz||'?'} Hz.` : 'No self-recorded reference active.';
  window.BelavadosSpeakerReferenceMath = { buildReference, profileBlendWeight, describeReference };
})();
