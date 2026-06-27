function clamp(v,min=-1,max=1){return Math.max(min,Math.min(max,v));}
function writeString(view, offset, s){for(let i=0;i<s.length;i++) view.setUint8(offset+i,s.charCodeAt(i));}
function encodeWav(samples, sampleRate=44100){
  const buffer = new ArrayBuffer(44 + samples.length*2);
  const view = new DataView(buffer);
  writeString(view,0,'RIFF'); view.setUint32(4,36+samples.length*2,true); writeString(view,8,'WAVE');
  writeString(view,12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true); view.setUint32(24,sampleRate,true); view.setUint32(28,sampleRate*2,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  writeString(view,36,'data'); view.setUint32(40,samples.length*2,true);
  let off=44; for(const s of samples){ view.setInt16(off, clamp(s)*32767, true); off+=2; }
  return new Blob([view], {type:'audio/wav'});
}
const vowelFormants={a:[800,1150,2900],e:[500,1900,2500],i:[350,2200,3000],o:[500,900,2400],u:[350,700,2400],y:[420,1700,2600]};
function charKind(ch){ch=ch.toLowerCase(); if('aeiouy'.includes(ch)) return 'vowel'; if(/[.,;:!?]/.test(ch)) return 'pause'; if(/[szfvthx]/.test(ch)) return 'fric'; if(/[mnrlw]/.test(ch)) return 'sonorant'; if(/[bcdfgjkpqt]/.test(ch)) return 'stop'; if(/\s/.test(ch)) return 'space'; return 'other';}
function hashNoise(i, seed){let x=Math.sin((i+1)*(seed+1)*12.9898)*43758.5453; return (x-Math.floor(x))*2-1;}
function accentCurve(accentName, t){const a=(accentName||'').toLowerCase(); if(a.includes('reefglass')||a.includes('japanese')) return Math.sin(t*2*Math.PI)*.04; if(a.includes('tide')||a.includes('portuguese')||a.includes('brightshore')) return Math.sin(t*Math.PI)*.08; if(a.includes('iron')||a.includes('russian')) return -0.04 + Math.sin(t*Math.PI*2)*.02; if(a.includes('crag')||a.includes('scottish')) return Math.sin(t*Math.PI*3)*.06; if(a.includes('mire')||a.includes('cajun')) return -0.03 + Math.sin(t*Math.PI)*.09; if(a.includes('highbranch')||a.includes('french')) return .04 + Math.sin(t*Math.PI*1.5)*.05; return Math.sin(t*Math.PI*2)*.025;}
export function renderProfileToWav(text, profile){
  const sr=44100;
  text=(text||'This is what I sound like.').slice(0,1200);
  const sl=profile?.sliders||{};
  const pitchBase=105 + (sl.pitch ?? 5)*19 - (sl.formant ?? 5)*4;
  const speedFactor=0.75 + (sl.speed ?? 5)/10;
  const rough=(sl.roughness ?? 3)/10, breath=(sl.breath ?? 3)/10, construct=(sl.construct ?? 0)/10, accent=(sl.accent ?? 5)/10, inflect=(sl.inflection ?? 5)/10, emphasis=(sl.emphasis ?? 5)/10;
  const samples=[];
  let seed = 0; for (const ch of JSON.stringify(profile||{})) seed=(seed*31+ch.charCodeAt(0))>>>0;
  let charIndex=0;
  for(const ch of text){
    const kind=charKind(ch); charIndex++;
    let dur = kind==='pause'?0.16:kind==='space'?0.055:kind==='stop'?0.035:kind==='fric'?0.075:0.105;
    dur /= speedFactor; if(/[!?]/.test(ch)) dur*=1.45; if(/[.,]/.test(ch)) dur*=1.25;
    const n=Math.max(1,Math.floor(dur*sr));
    const letter=ch.toLowerCase(); const vf=vowelFormants[letter] || vowelFormants.a;
    for(let j=0;j<n;j++){
      const t=j/sr; const local=j/n; const global=(samples.length/sr);
      if(kind==='space'||kind==='pause'){samples.push(0); continue;}
      const env=Math.sin(Math.PI*local) * (0.35 + emphasis*0.35);
      const phrase=Math.sin((charIndex/text.length)*Math.PI*2) * inflect * 16;
      const accentBend=accentCurve(profile?.accent?.fantasyAccent || profile?.accent?.baseAccent, charIndex/Math.max(1,text.length)) * accent * 60;
      let f0=pitchBase + phrase + accentBend;
      if(/[A-Z]/.test(ch)) f0 += 12*emphasis;
      let voiced = Math.sin(2*Math.PI*f0*t) + .35*Math.sin(2*Math.PI*f0*2*t) + .15*Math.sin(2*Math.PI*f0*3*t);
      let form = 0;
      const formShift = 0.72 + (sl.timbre ?? 5)/14 + ((sl.formant ?? 5)-5)/22;
      for(let k=0;k<vf.length;k++) form += Math.sin(2*Math.PI*vf[k]*formShift*t)/(k+1.8);
      let noise = hashNoise(samples.length, seed) * (breath*.17 + rough*.08);
      if(kind==='fric') noise += hashNoise(samples.length+13, seed)*.5;
      if(kind==='stop') voiced *= .25;
      if(kind==='sonorant') form*=.55;
      let metallic = construct>0 ? Math.sin(2*Math.PI*(f0*4.7+33)*t)*construct*.16 + Math.sin(2*Math.PI*(f0*7.1)*t)*construct*.08 : 0;
      let value = env * (voiced*.42 + form*.23 + noise + metallic);
      if((sl.stutter??0)>0 && charIndex%17===0 && local<.25) value *= Math.sin(local*Math.PI*16);
      samples.push(clamp(value*.75));
    }
  }
  return encodeWav(new Float32Array(samples), sr);
}
export function downloadBlob(blob, filename){
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),5000); return url;
}
export function playBlob(blob, audioEl){const url=URL.createObjectURL(blob); audioEl.src=url; audioEl.play?.(); return url;}
export function speakWithBrowser(text, profile){
  if(!('speechSynthesis' in window)) throw new Error('Browser speech synthesis is not available.');
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text||'This is what I sound like.');
  const sl=profile?.sliders||{};
  u.pitch=Math.max(.3,Math.min(2, .55+(sl.pitch??5)/5));
  u.rate=Math.max(.35,Math.min(1.8, .65+(sl.speed??5)/8));
  u.volume=.95;
  const hints=profile?.accent?.langHints||[];
  if(hints[0]) u.lang=hints[0];
  const voices=speechSynthesis.getVoices();
  const match=voices.find(v=>hints.some(h=>v.lang?.toLowerCase().startsWith(h.toLowerCase().slice(0,2)))) || voices[0];
  if(match) u.voice=match;
  speechSynthesis.speak(u);
}
