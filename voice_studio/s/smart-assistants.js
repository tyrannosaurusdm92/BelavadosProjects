export const ASSISTANTS = [
  {id:'profileArchitect', name:'Profile Architect', source:'Chat bot + problem-solving planner', role:'Turns name, identity, class, and personality into a stable voice brief.', run:p=>`Voice identity: ${p?.character?.name || 'Unnamed'} should keep a consistent toneprint across lines. Personality anchor: ${p?.character?.personality || 'not described yet'}.`},
  {id:'accentMapper', name:'Accent Mapper', source:'Belavadös biome table + accent atlas', role:'Maps the selected biome to fantasy accent, base accent, and race/class overlay behavior.', run:p=>p?.accent?`${p.accent.fantasyAccent} draws from ${p.accent.baseAccent}. Final feel: ${p.accent.finalFeel}`:'Choose a biome to map an accent.'},
  {id:'moodDirector', name:'Mood Director', source:'Music/prosody systems', role:'Uses music-generator ideas only as speech rhythm, not song generation.', run:p=>`Mood ${p?.mood || 'Neutral'} in ${p?.context || 'default context'} adjusts pitch, pace, emphasis, breath, and phrase shape.`},
  {id:'jarvisRouter', name:'JARVIS Router', source:'JARVIS voice assistant architecture', role:'Coordinates build, preview, command flow, and export status.', run:p=>`Ready route: build profile → preview → render WAV → backend MP3/WAV → save profile ${p?.id || ''}`},
  {id:'sourceMatcher', name:'Source Matcher', source:'Coqui pack + TTS repos + accent audio', role:'Finds the closest available voice sample/model reference to start from.', run:p=>p?.sourceVoice?`Selected ${p.sourceVoice.speaker || p.sourceVoice.source}: ${p.sourceVoice.file}`:'No source sample selected yet.'},
  {id:'auditGuard', name:'Safety / Audit Guard', source:'Vocoder artifact detector + docs', role:'Keeps generated files documented as fictional, synthetic, and consent-scoped.', run:p=>`Scope: ${p?.consentScope || 'fictional voices only'}. Export targets: ${(p?.exportTargets||[]).join(', ')}`}
];

export function renderAssistantCards(container, getProfile){
  container.innerHTML='';
  for(const a of ASSISTANTS){
    const card=document.createElement('article'); card.className='assistant';
    card.innerHTML=`<h3>${a.name}</h3><p><span class="pill">${a.source}</span></p><p>${a.role}</p><button type="button">Run helper</button><output></output>`;
    card.querySelector('button').addEventListener('click',()=>{card.querySelector('output').textContent=a.run(getProfile());});
    container.appendChild(card);
  }
}

export function runAllAssistants(getProfile){
  return ASSISTANTS.map(a=>`${a.name}: ${a.run(getProfile())}`).join('\n\n');
}
