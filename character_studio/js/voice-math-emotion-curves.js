/* Belavadös Voice Studio - affective prosody curves */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const CURVES = {
    neutral:{ pitchCurve:'gentle-rise-fall', arousal:.25, valence:.0, tension:.12 }, kindness:{ pitchCurve:'rising', arousal:.32, valence:.72, tension:.04 }, compassion:{ pitchCurve:'gentle-rise-fall', arousal:.22, valence:.62, tension:.02 }, annoyance:{ pitchCurve:'tight', arousal:.58, valence:-.28, tension:.48 }, anger:{ pitchCurve:'falling', arousal:.84, valence:-.55, tension:.78 }, rage:{ pitchCurve:'wavering', arousal:1.0, valence:-.82, tension:.95 }, betrayal:{ pitchCurve:'wavering', arousal:.65, valence:-.7, tension:.64 }, grief:{ pitchCurve:'falling', arousal:.18, valence:-.82, tension:.26 }, fear:{ pitchCurve:'wavering', arousal:.76, valence:-.65, tension:.72 }, panic:{ pitchCurve:'wavering', arousal:.96, valence:-.75, tension:.9 }, calm:{ pitchCurve:'flat', arousal:.08, valence:.38, tension:.0 }, joy:{ pitchCurve:'rising', arousal:.74, valence:.9, tension:.12 }, excitement:{ pitchCurve:'rising', arousal:.92, valence:.82, tension:.25 }, menace:{ pitchCurve:'falling', arousal:.42, valence:-.66, tension:.84 }
  };
  const getCurve = (emotion='neutral', intensity=100) => { const c=CURVES[emotion]||CURVES.neutral, a=M().clamp(intensity,0,100)/100; return { ...c, arousal:M().round(c.arousal*a,3), valence:M().round(c.valence*a,3), tension:M().round(c.tension*a,3) }; };
  const cadence = (emotion='neutral', intensity=100) => { const c=getCurve(emotion,intensity); return { pitchCurve:c.pitchCurve, rateBias:M().round((c.arousal-.25)*.18,3), pitchBias:M().round((c.valence*.04)+(c.tension*.025),3), pauseBias:M().round((.28-c.arousal)*.15 + c.tension*.04,3), stress:M().round(c.arousal*.55+c.tension*.35,3), volumeBias:M().round(c.arousal*.08 - Math.max(0,-c.valence)*.035,3) }; };
  window.BelavadosEmotionCurveMath = { CURVES, getCurve, cadence };
})();
