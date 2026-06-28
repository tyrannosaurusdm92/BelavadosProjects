(() => {
  'use strict';
  const S = window.BelavadosScanner;
  function splitLine(line, delim){
    if(delim === ',') return line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(s => s.replace(/^\"|\"$/g,'').trim());
    if(delim === '\t') return line.split('\t').map(s=>s.trim());
    if(delim === '•') return line.split('•').map(s=>s.trim());
    return line.split('|').map(s=>s.trim());
  }
  S.normalizeNpcObject = function(o){
    return {
      name:o.name || o.npc || o.label || '',
      biome:o.biome || o.environment || o.livedEnvironment || o.settlementBiome || '',
      race:o.race || o.ancestry || '',
      lineage:o.lineage || '',
      bloodline:o.bloodline || '',
      className:o.className || o.class || o.characterClass || '',
      subclass:o.subclass || o.subClass || '',
      genderIdentity:o.genderIdentity || o.gender || '',
      settlementType:o.settlementType || o.settlement || '',
      personalityText:o.personalityText || o.personality || o.mood || o.notes || o.description || '',
      emotion:o.emotion || 'Neutral / Base',
      originalInput:o
    };
  };
  S.parseBulk = function(text){
    const raw=String(text||'').trim(); if(!raw) return [];
    try{
      const parsed=JSON.parse(raw);
      const arr=Array.isArray(parsed) ? parsed : (Array.isArray(parsed.npcs) ? parsed.npcs : (Array.isArray(parsed.profiles) ? parsed.profiles.map(p=>p.character||p.input||p) : [parsed.character || parsed]));
      return arr.map(S.normalizeNpcObject);
    }catch(_){/* not JSON */}
    const lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(l => l && !/^[-|\s]+$/.test(l));
    if(!lines.length) return [];
    const first=lines[0].replace(/^\|/,'').replace(/\|$/,'');
    const delim=first.includes('|') ? '|' : (first.includes('\t') ? '\t' : (first.includes('•') ? '•' : ','));
    const headerCells=splitLine(first,delim).map(S.norm);
    const hasHeader=headerCells.some(c => ['name','npc','biome','race','ancestry','lineage','class','subclass','gender','personality','emotion'].includes(c));
    let start=0, map={};
    if(hasHeader){
      start=1;
      headerCells.forEach((h,i)=>{
        if(h.includes('name') || h==='npc') map.name=i;
        else if(h.includes('biome') || h.includes('environment')) map.biome=i;
        else if(h.includes('race') || h.includes('ancestry')) map.race=i;
        else if(h.includes('lineage')) map.lineage=i;
        else if(h.includes('bloodline')) map.bloodline=i;
        else if(h==='class' || h.includes('class name')) map.className=i;
        else if(h.includes('subclass')) map.subclass=i;
        else if(h.includes('gender')) map.genderIdentity=i;
        else if(h.includes('settlement')) map.settlementType=i;
        else if(h.includes('emotion')) map.emotion=i;
        else if(h.includes('personality') || h.includes('mood') || h.includes('notes')) map.personalityText=i;
      });
    }
    const out=[];
    for(const line of lines.slice(start)){
      if(line.startsWith('|') && line.includes('---')) continue;
      const cells=splitLine(line.replace(/^\|/,'').replace(/\|$/,''),delim);
      let npc={};
      if(hasHeader){ for(const [k,i] of Object.entries(map)) npc[k]=cells[i]||''; }
      else if(cells.length>=5){ [npc.name,npc.biome,npc.race,npc.className,npc.subclass,npc.genderIdentity,npc.personalityText] = cells; }
      else npc=S.parseLooseLine(line);
      out.push(S.normalizeNpcObject(npc));
    }
    return out.filter(n => Object.values(n).some(Boolean));
  };
  S.parseLooseLine = function(line){
    const text=String(line||'');
    const find=(items,get,extra)=>S.bestMatch(text, items, get, extra).item;
    const cls=S.findClassAndSubclass ? S.findClassAndSubclass({className:text,subclass:text}) : {classMatch:{},subMatch:{}};
    const emotion=find(S.state.resources.emotions, e=>e.name, e=>e.id)?.name || 'Neutral / Base';
    return {
      name:text.split(/[•|,]/)[0].slice(0,60).trim() || 'Unnamed NPC',
      biome:find(S.state.resources.biomes, b=>b.biome, b=>`${b.fantasyAccentName} ${b.finalVoiceFeel} ${(b.lineageRules||[]).join(' ')}`)?.biome || '',
      race:find(S.state.resources.races, r=>r.name, r=>`${r.racialCategory||''} ${r.raceSpeechArchetype||''}`)?.name || '',
      lineage:'', bloodline:'',
      className:cls.classMatch?.item?.name || '',
      subclass:cls.subMatch?.item?.fullName || cls.subMatch?.item?.name || '',
      genderIdentity:find(S.state.resources.genders, g=>g.name, g=>g.id || '')?.name || '',
      settlementType:'', personalityText:text, emotion
    };
  };
})();
