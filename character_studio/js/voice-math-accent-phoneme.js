/* Belavadös Voice Studio - audible fantasy accent renderer
   This does not name real-world accents in the UI. It converts the selected biome style into
   safe fantasy mouth-feel spelling, cadence metadata, and voice-language hints when the browser has them. */
(() => {
  'use strict';
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const clean = s => String(s||'').replace(/\s+/g,' ').trim();
  const STYLE = {
    Tidecrest:{vowelStretch:.035,cadence:'rolling', marker:'tide', replacements:[[/\bsound\b/gi,'sownd'],[/\blike\b/gi,'lyke'],[/\bwhat\b/gi,'wot'],[/\bthis\b/gi,'dees']]},
    Reefglass:{vowelStretch:.020,cadence:'clear', marker:'reef', replacements:[[/\bthis\b/gi,'thi-su'],[/\bwhat\b/gi,'wa-tu'],[/\bsound\b/gi,'soun-do'],[/\blike\b/gi,'rai-ku']]},
    Deepcurrent:{vowelStretch:.045,cadence:'low-sung', marker:'deep', replacements:[[/\bthis\b/gi,'thiiis'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'saaound'],[/\blike\b/gi,'laaike']]},
    Plainwind:{vowelStretch:0,cadence:'open', marker:'plain', replacements:[]},
    Ironstep:{vowelStretch:0,cadence:'grounded', marker:'iron', replacements:[[/\bthis\b/gi,'zis'],[/\bwhat\b/gi,'vat'],[/\bsound\b/gi,'saund'],[/\blike\b/gi,'laik']]},
    Hearthfield:{vowelStretch:.020,cadence:'warm', marker:'hearth', replacements:[[/\bthis\b/gi,'thish'],[/\bwhat\b/gi,'whut'],[/\bsound\b/gi,'sownd'],[/\blike\b/gi,'loik']]},
    Cragthane:{vowelStretch:0,cadence:'clipped', marker:'crag', replacements:[[/\bthis\b/gi,'this'],[/\bwhat\b/gi,'whaht'],[/\bsound\b/gi,'soond'],[/\blike\b/gi,'lahk']]},
    Vinesong:{vowelStretch:.025,cadence:'lyrical', marker:'vine', replacements:[[/\bthis\b/gi,'thees'],[/\bwhat\b/gi,'whaht-a'],[/\bsound\b/gi,'sown-da'],[/\blike\b/gi,'lee-keh']]},
    Stonehollow:{vowelStretch:.018,cadence:'echoed', marker:'stone', replacements:[[/\bthis\b/gi,'thys'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'sownd'],[/\blike\b/gi,'liek']]},
    Rootmere:{vowelStretch:0,cadence:'dense', marker:'root', replacements:[[/\bthis\b/gi,'zis'],[/\bwhat\b/gi,'vhat'],[/\bsound\b/gi,'zound'],[/\blike\b/gi,'like']]},
    Sundapple:{vowelStretch:.014,cadence:'lively', marker:'sun', replacements:[[/\bthis\b/gi,'dis'],[/\bwhat\b/gi,'wat'],[/\bsound\b/gi,'soun'],[/\blike\b/gi,'likeh']]},
    Highbranch:{vowelStretch:.022,cadence:'airy', marker:'branch', replacements:[[/\bthis\b/gi,'zees'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'saund'],[/\blike\b/gi,'leek']]},
    Mirecurl:{vowelStretch:.045,cadence:'drawn', marker:'mire', replacements:[[/\bthis\b/gi,'dis'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'sowwn'],[/\blike\b/gi,'lahk']]},
    Brightshore:{vowelStretch:.025,cadence:'bright', marker:'shore', replacements:[[/\bthis\b/gi,'dees'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'sownd'],[/\blike\b/gi,'lykee']]},
    Wavebloom:{vowelStretch:.034,cadence:'soft-wave', marker:'wave', replacements:[[/\bthis\b/gi,'dis'],[/\bwhat\b/gi,'wah'],[/\bsound\b/gi,'saound'],[/\blike\b/gi,'laike']]},
    Bramblewood:{vowelStretch:.012,cadence:'rustic', marker:'bramble', replacements:[[/\bthis\b/gi,'thes'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'zound'],[/\blike\b/gi,'loike']]},
    Millfield:{vowelStretch:0,cadence:'practical', marker:'mill', replacements:[[/\bthis\b/gi,'this'],[/\bwhat\b/gi,'vot'],[/\bsound\b/gi,'sound'],[/\blike\b/gi,'like']]}
  };
  const styleFromAccent = accent => { const name=String(accent?.name||'Plainwind').split(/\s+/)[0] || 'Plainwind'; return STYLE[name] ? { key:name, ...STYLE[name] } : { key:'Plainwind', ...STYLE.Plainwind }; };
  const stretchVowels = (word, amount) => {
    if (amount <= .015 || word.length < 4) return word;
    return word.replace(/([aeiouy])([bcdfghjklmnpqrstvwxz]{0,2})$/i, (m,v,c)=> v + (amount>.032 ? v : '') + c);
  };
  const softenElf = s => s.replace(/\bth/gi,'dh').replace(/r\b/gi,'');
  const clipDwarf = s => s.replace(/([aeiou])([mnrl])\b/gi,'$1$2').replace(/\s*,\s*/g, ', ');
  const forceOrc = s => s.replace(/\bsoftly,\s*/i,'').replace(/\bthis\b/gi,'diss').replace(/\blike\b/gi,'lyk');
  const flowAquatic = s => s.replace(/\bI\b/g,'Ih').replace(/\bsound\b/gi,'saound').replace(/\s+/g,' ');
  const warmHalfling = s => s.replace(/\bwhat\b/gi,'whut').replace(/\blike\b/gi,'loike');
  const beastRhythm = s => s.replace(/\bthis is\b/gi,'this, this is');
  const applyRaceColor = (s, accent, profile={}) => {
    const label = String(accent?.raceOverlay||'').toLowerCase();
    if (/elf/.test(label)) return softenElf(s);
    if (/dwarf/.test(label)) return clipDwarf(s);
    if (/orc/.test(label)) return forceOrc(s);
    if (/aquatic/.test(label)) return flowAquatic(s);
    if (/halfling/.test(label)) return warmHalfling(s);
    if (/beast/.test(label)) return beastRhythm(s);
    return s;
  };
  const applyClassColor = (s, accent) => {
    const label = String(accent?.classOverlay||'').toLowerCase();
    if (/warrior/.test(label)) return s.replace(/[.?!]*$/,'!');
    if (/rogue/.test(label)) return s.replace(/[.?!]*$/,'...');
    if (/mage|scholar/.test(label)) return s.replace(/[.?!]*$/,'.');
    if (/cleric|priest/.test(label)) return s.replace(/[.?!]*$/,'...');
    if (/bard/.test(label)) return s.replace(/[.?!]*$/,'!');
    return s;
  };
  const applyTextColor = (text='', accent=null, profile={}, intensity=100) => {
    const accentColor = Math.max(0, Math.min(10, +profile.accentColor || 5));
    const adjustedIntensity = Math.max(0, Math.min(100, (+intensity || 0) * (accentColor / 7)));
    if (window.BelavadosVoiceHumanization && accent) {
      return window.BelavadosVoiceHumanization.humanizeAccentText(text, accent, profile, { influence:adjustedIntensity });
    }
    let phrase = clean(text) || 'this is what I sound like';
    const amt = clamp(adjustedIntensity,0,100)/100;
    if (!accent || amt < .06) return phrase;
    const style = styleFromAccent(accent);
    if (style.key === 'Plainwind' && amt < .75) return phrase;
    style.replacements.forEach(([re,to]) => { phrase = phrase.replace(re, to); });
    if (amt > .45) {
      phrase = phrase.split(/(\s+)/).map(part => /[A-Za-zÀ-ÿ]{4,}/.test(part) ? stretchVowels(part, style.vowelStretch*amt) : part).join('');
      phrase = applyRaceColor(phrase, accent, profile);
    }
    if (amt > .70) phrase = applyClassColor(phrase, accent);
    // Do not add fantasy labels out loud; just make the mouth-feel audible.
    return clean(phrase);
  };
  const cadenceFromAccent = (accent=null, intensity=100) => {
    if (!accent) return {};
    const style=styleFromAccent(accent), amt=clamp(intensity,0,100)/100, v=accent.vector||{};
    const dur=(v.durationMultiplier??1);
    return { accentStyle:style.key, accentCadence:style.cadence, forceAccentText:true, durationMultiplier:dur, rateBias:((1-dur)*.28 + (style.cadence==='clipped'?.055:style.cadence==='drawn'?-.055:0))*amt, pauseBias:Math.max(-.10, Math.min(.12, (dur-1)*.16 - (v.legatoDelta||0)*.07))*amt, pitchBias:((v.pitchRangeSemitonesDelta||0)*.012+(v.toneStrengthDelta||0)*.016)*amt, pitchRangeSemitonesDelta:(v.pitchRangeSemitonesDelta||0)*amt, toneStrengthDelta:(v.toneStrengthDelta||0)*amt, pitchAccentDelta:(v.pitchAccentDelta||0)*amt, legatoDelta:(v.legatoDelta||0)*amt, consonantForceDelta:(v.consonantForceDelta||0)*amt, gutturalResonanceDelta:(v.gutturalResonanceDelta||0)*amt, vowelStretch:(style.vowelStretch||0)*amt, stress:((v.consonantForceDelta||0)*.22+(v.gutturalResonanceDelta||0)*.16)*amt, voiceLangHints:accent.voiceLangHints||[] };
  };
  window.BelavadosAccentPhonemeMath = { STYLE, styleFromAccent, applyTextColor, cadenceFromAccent };
})();
