/* Belavadös Voice Studio - lightweight evaluation metrics for voice previews/reference recordings */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const mcd = (a=[], b=[]) => { const n=Math.min(a.length,b.length); let s=0; for (let i=1;i<n;i++) s += Math.pow((a[i]||0)-(b[i]||0),2); return n>1 ? (10/Math.log(10))*Math.sqrt(2*s) : 0; };
  const rmse = (a=[], b=[]) => { const n=Math.min(a.length,b.length); if (!n) return 0; let s=0; for (let i=0;i<n;i++) s += Math.pow((a[i]||0)-(b[i]||0),2); return Math.sqrt(s/n); };
  const cosine = (a=[], b=[]) => { const n=Math.min(a.length,b.length); let dot=0, aa=0, bb=0; for(let i=0;i<n;i++){ dot+=(a[i]||0)*(b[i]||0); aa+=(a[i]||0)**2; bb+=(b[i]||0)**2; } return dot/(Math.sqrt(aa)*Math.sqrt(bb)||1); };
  const snr = (x=[], y=[]) => { const n=Math.min(x.length,y.length); let sig=0, noise=0; for(let i=0;i<n;i++){ sig+=(x[i]||0)**2; noise+=((x[i]||0)-(y[i]||0))**2; } return 10*Math.log10(Math.max(1e-9,sig)/Math.max(1e-9,noise)); };
  const summarizeFit = (target={}, generated={}) => ({ f0Rmse:M().round(rmse(target.f0Track||[], generated.f0Track||[]),3), melCepstralDistortion:M().round(mcd(target.mfcc||[], generated.mfcc||[]),3), timbreSimilarity:M().round(cosine(target.mfcc||[], generated.mfcc||[]),3) });
  window.BelavadosEvaluationMath = { mcd, rmse, cosine, snr, summarizeFit };
})();
