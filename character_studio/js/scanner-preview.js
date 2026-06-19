(() => {
  'use strict';
  const S = window.BelavadosScanner;
  function shapedPreviewText(profile){
    const base = S.$('previewText')?.value?.trim() || profile.playerFacingSummary?.summary || profile.character.name || 'Voice preview.';
    const t=profile.voice.traits;
    let text=base;
    if(t.pauseControl>7) text=text.replace(/([,.!?])/g,'$1 ');
    if(t.stutter>5) text=text.replace(/\b(I|we|you|the|and)\b/gi, '$1... $1');
    if(t.formality>7 && !/[.!?]$/.test(text)) text += '.';
    if(profile.voice.assetInfluences?.matchedAudioReferenceCount && t.humanVariation>6) text = text.replace(/([.!?])\s+/g, '$1  ');
    return text;
  }
  S.previewSelected = function(){
    const p=S.state.profiles[S.state.selectedIndex];
    if(!p || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(shapedPreviewText(p));
    u.rate=p.computedVoice.webSpeechRate; u.pitch=p.computedVoice.webSpeechPitch; u.volume=p.computedVoice.webSpeechVolume;
    const voices=window.speechSynthesis.getVoices();
    const t=p.voice.traits;
    const terms=[];
    if(t.pitch<4) terms.push('low','deep');
    if(t.pitch>6.5) terms.push('bright','higher');
    if(t.warmth>6.5) terms.push('warm');
    if(t.formality>7) terms.push('narrator');
    const chosen=voices.find(v => terms.some(term => S.norm(v.name+' '+v.lang).includes(term))) || voices[0];
    if(chosen) u.voice=chosen;
    window.speechSynthesis.speak(u);
  };
  S.stopPreview = function(){ window.speechSynthesis?.cancel(); };
})();
