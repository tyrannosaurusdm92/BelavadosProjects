/* Belavadös Voice Studio - LPC/source-filter envelope approximation */
(() => {
  'use strict';
  const M = () => window.BelavadosVoiceMathCore;
  const levinsonDurbin = (r, order=12) => {
    r = Array.from(r || []); if (!r.length || Math.abs(r[0]) < 1e-12) return { coefficients:Array(order).fill(0), error:0 };
    const a = Array(order+1).fill(0); a[0]=1; let e=r[0];
    for (let i=1;i<=order;i++) { let acc=0; for (let j=1;j<i;j++) acc += a[j]*(r[i-j]||0); const k=-(r[i]+acc)/Math.max(1e-12,e); const prev=a.slice(); a[i]=k; for (let j=1;j<i;j++) a[j] = prev[j] + k*prev[i-j]; e *= (1-k*k); if (!Number.isFinite(e) || e <= 1e-12) break; }
    return { coefficients:a.slice(1), error:e };
  };
  const lpc = (samples, order=12) => { const r=M().autocorrelation(samples, order); return levinsonDurbin(r, order); };
  const envelopeAt = (coefficients=[], freq=1000, sampleRate=44100) => {
    let re=1, im=0; coefficients.forEach((a,i)=>{ const w=-2*Math.PI*freq*(i+1)/sampleRate; re += a*Math.cos(w); im += a*Math.sin(w); });
    return 1/Math.max(1e-6, Math.sqrt(re*re+im*im));
  };
  const estimateFormantLikePeaks = (coefficients=[], sampleRate=44100, count=4) => {
    const values=[]; for (let f=120; f<Math.min(5200,sampleRate/2); f+=40) values.push({f, v:envelopeAt(coefficients,f,sampleRate)});
    const peaks=[]; for (let i=1;i<values.length-1;i++) if (values[i].v>values[i-1].v && values[i].v>values[i+1].v) peaks.push(values[i]);
    return peaks.sort((a,b)=>b.v-a.v).slice(0,count).sort((a,b)=>a.f-b.f).map(p=>({ hz:M().round(p.f,1), strength:M().round(p.v,3) }));
  };
  const analyze = (samples, sampleRate=44100, order=12) => { const res=lpc(samples, order); return { order, error:M().round(res.error,6), coefficients:res.coefficients.map(x=>M().round(x,6)), formantLikePeaks:estimateFormantLikePeaks(res.coefficients, sampleRate) }; };
  window.BelavadosLPCMath = { levinsonDurbin, lpc, envelopeAt, estimateFormantLikePeaks, analyze };
})();
