/* Belavadös Voice Studio - Page controller */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const Analysis = window.BelavadosVoiceAnalysis;
  const Synth = window.BelavadosVoiceSynthesis;
  const Presets = window.BelavadosVoicePresets;
  const Mapper = window.BelavadosVoiceJsonMapper;
  const Exporter = window.BelavadosVoiceExporter;
  const Emotions = window.BelavadosVoiceEmotions;
  const Pack = window.BelavadosVoiceGeneratorPack;
  const Accents = window.BelavadosBiomeAccents;
  const Recorder = window.BelavadosVoiceRecorder;
  const Humanization = () => window.BelavadosVoiceHumanization;
  const $ = id => document.getElementById(id);

  const state = {
    manifest: [],
    originalManifest: [],
    taxonomy: null,
    npc: {},
    profile: { ...Core.DEFAULT_PROFILE },
    baseProfile: { ...Core.DEFAULT_PROFILE },
    selectedClipIds: new Set(),
    analyzed: new Map(),
    waveform: 'triangle',
    influences: { race:100, gender:100, personality:100, biome:100, baseAudio:45 },
    biomeAccent: null,
    biomeCadence: {},
    audioAssetsEnabled: false,
    recordedClip: null,
    emotionCache: []
  };

  const allClips = () => (state.audioAssetsEnabled && state.recordedClip) ? [state.recordedClip] : [];
  const getSelectedClips = () => allClips().filter(c => state.selectedClipIds.has(c.id)).map(c => state.analyzed.get(c.id) || c);
  const getSpeakerReference = () => {
    if (!state.audioAssetsEnabled || !state.recordedClip) return null;
    const analyzed = state.analyzed.get(state.recordedClip.id);
    return analyzed?.liveAnalysis?.speakerReference || state.recordedClip?.liveAnalysis?.speakerReference || null;
  };

  const getInfluencesFromInputs = () => ({
    race: +($('influenceRace')?.value ?? state.influences.race ?? 100),
    gender: +($('influenceGender')?.value ?? state.influences.gender ?? 100),
    personality: +($('influencePersonality')?.value ?? state.influences.personality ?? 100),
    biome: +($('influenceBiome')?.value ?? state.influences.biome ?? 100),
    baseAudio: +($('influenceBaseAudio')?.value ?? state.influences.baseAudio ?? 45)
  });

  const syncInfluenceOutputs = () => {
    state.influences = getInfluencesFromInputs();
    [['Race','race'],['Gender','gender'],['Personality','personality'],['Biome','biome'],['BaseAudio','baseAudio']].forEach(([id,key]) => {
      const out = $(`out_influence${id}`);
      if (out) out.textContent = `${Math.round(state.influences[key])}%`;
    });
  };

  const applyBiomeToProfile = (profile, npc) => {
    const biomeKey = Accents?.resolveBiomeKey($('npcBiome')?.value || npc.biome || npc.regionBiome || 'none') || 'none';
    const result = Accents ? Accents.applyAccent(profile, { ...npc, biome: biomeKey }, { biomeKey, influence: state.influences.biome }) : { profile, accent:null, cadence:{} };
    state.biomeAccent = result.accent;
    state.biomeCadence = result.cadence || {};
    state.npc.biome = biomeKey;
    state.npc.biomeAccent = result.accent;
    return result.profile || profile;
  };

  const refreshProfileFromBase = () => {
    state.profile = applyBiomeToProfile({ ...state.baseProfile }, state.npc || {});
    renderTraitRows();
    updateOutputs();
  };

  const renderTraitRows = () => {
    const target = $('voiceSliders');
    target.innerHTML = Core.TRAITS.map(t => `
      <div class="slider-row" data-trait="${t.key}">
        <div class="slider-head"><label for="trait_${t.key}">${t.label}</label><output id="out_${t.key}">${Core.normalizeTrait(state.profile[t.key]).toFixed(1)}</output></div>
        <input id="trait_${t.key}" type="range" min="0" max="10" step="0.1" value="${Core.normalizeTrait(state.profile[t.key])}">
        <div class="hint"><span>${t.left}</span><code>${Core.makeCharacterSheetSlider(t, state.profile[t.key])}</code><span>${t.right}</span></div>
        <small>${t.help || ''}</small>
      </div>`).join('');
    Core.TRAITS.forEach(t => {
      $(`trait_${t.key}`).addEventListener('input', ev => {
        state.profile[t.key] = +ev.target.value;
        state.baseProfile[t.key] = +ev.target.value;
        updateOutputs();
      });
    });
  };

  const getCurrentEmotionSelection = () => ({
    key: $('emotionSelect')?.value || 'neutral',
    intensity: +($('emotionIntensity')?.value || 100)
  });

  const renderEmotionControls = () => {
    const select = $('emotionSelect');
    if (!select || !Emotions) return;
    select.innerHTML = Emotions.emotionList().map(e => `<option value="${e.key}">${e.label}</option>`).join('');
    $('emotionIntensity').value = 75;
    $('out_emotionIntensity').textContent = '75%';
    select.addEventListener('change', updateEmotionDescription);
    $('emotionIntensity').addEventListener('input', () => {
      $('out_emotionIntensity').textContent = `${Math.round(+$('emotionIntensity').value)}%`;
      updateEmotionDescription();
    });
    updateEmotionDescription();
    renderEmotionCache();
  };

  const updateEmotionDescription = () => {
    if (!Emotions || !$('emotionDescription')) return;
    const { key, intensity } = getCurrentEmotionSelection();
    $('emotionDescription').textContent = Emotions.describeEmotion(key, intensity);
  };

  const renderEmotionCache = () => {
    const target = $('emotionCacheList');
    if (!target) return;
    if (!state.emotionCache.length) {
      target.innerHTML = '<div class="mini">No emotions cached yet. Add an emotion after previewing it, and it will be included in the exported character voice JavaScript.</div>';
      return;
    }
    target.innerHTML = state.emotionCache.map((e, i) => `
      <div class="emotion-pill">
        <span><b>${e.label}</b><small>${e.intensity}% · ${e.description || ''}</small></span>
        <button class="btn tiny warning" data-remove-emotion="${i}" type="button">Remove</button>
      </div>`).join('');
    target.querySelectorAll('[data-remove-emotion]').forEach(btn => btn.addEventListener('click', () => {
      state.emotionCache.splice(+btn.dataset.removeEmotion, 1);
      renderEmotionCache();
      updateOutputs();
    }));
  };

  const readableEngine = () => {
    const engine = Core.profileToEngine(state.profile, { waveform: Core.guessWaveform(state.profile) });
    const emotion = getCurrentEmotionSelection();
    const opts = { npc: state.npc, emotionKey: emotion.key, emotionIntensity: emotion.intensity, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() };
    const vocalModel = window.BelavadosVocalModel ? window.BelavadosVocalModel.describeModel(state.profile, opts) : {};
    const plan = window.BelavadosVoiceProsody ? window.BelavadosVoiceProsody.previewPlan($('sampleText')?.value || 'this is what I sound like', state.profile, opts) : null;
    return {
      voiceHeight: `${state.profile.pitch.toFixed(1)} / 10`,
      speakingSpeed: `${state.profile.speed.toFixed(1)} / 10`,
      expressiveness: `${state.profile.inflection.toFixed(1)} / 10`,
      hesitations: `${state.profile.stutter.toFixed(1)} / 10`,
      softness: `${state.profile.breath.toFixed(1)} / 10`,
      gruffEdge: `${state.profile.roughness.toFixed(1)} / 10`,
      bodyDepth: `${state.profile.resonance.toFixed(1)} / 10`,
      speechStyle: `${state.profile.formality.toFixed(1)} / 10`,
      smoothPreview: true,
      optionalRecordingReferenceEnabled: state.audioAssetsEnabled,
      baseAudioInfluence: `${Math.round(state.influences.baseAudio || 0)}%`,
      naturalnessGuard: window.BelavadosNaturalnessGuard?.describe?.() || null,
      referenceAudioLearning: window.BELAVADOS_REFERENCE_AUDIO_LEARNING?.overall || null,
      recordedBaseVoice: state.recordedClip ? 'available' : 'none',
      biomeAccent: state.biomeAccent ? Accents.describeAccent(state.biomeAccent) : 'none',
      basePitchHz: engine.f0,
      speechRate: engine.speech_rate,
      pauseMilliseconds: engine.pause_ms,
      breathGroupWords: engine.breath_group_words,
      prosodyMotion: engine.prosody_motion,
      speechPreviewModel: vocalModel,
      currentEmotionPreview: plan ? { emotion: plan.emotionKey, strength: `${Math.round(plan.emotionIntensity)}%`, spokenSegments: plan.segments, humanizationReference: plan.humanizationReference || null } : null,
      emotionCache: state.emotionCache.map(e => `${e.label} ${e.intensity}%`),
      jsonPack: Pack ? Pack.packSummary() : 'basic taxonomy only',
      selectedRaceProfile: state.npc?.race || '',
      selectedSubclassProfile: state.npc?.subclass || '',
      resourceHumanization: Humanization()?.describeReference?.(state.npc || {}, state.biomeAccent || null) || null,
      mathLayers: { sourceFilter: !!engine.source_filter, stftMelLpcRecordingAnalysis: true, psolaSchedule: !!engine.psola, formantBank: !!engine.formants, jitterShimmer: !!engine.instability, transparentVocoderParams: !!engine.vocoder, resourceDerivedHumanization: !!Humanization() }
    };
  };

  const updateOutputs = () => {
    Core.TRAITS.forEach(t => {
      const val = Core.normalizeTrait(state.profile[t.key]);
      const input = $(`trait_${t.key}`); const out = $(`out_${t.key}`);
      if (input && Math.abs(+input.value - val) > .01) input.value = val;
      if (out) out.textContent = val.toFixed(1);
      const row = document.querySelector(`[data-trait="${t.key}"] code`);
      if (row) row.textContent = Core.makeCharacterSheetSlider(t, val);
    });
    syncInfluenceOutputs();
    state.waveform = Core.guessWaveform(state.profile);
    const engine = Core.profileToEngine(state.profile, { waveform: state.waveform });
    $('engineReadout').textContent = JSON.stringify(readableEngine(), null, 2);
    $('profileCode').value = Exporter.buildExport(exportBundle());
    const selected = getSelectedClips();
    let selectedText = selected.length ? selected.map(c => c.displayName || c.filename).join(' + ') : 'No optional recorded/uploaded reference selected.';
    if (!state.recordedClip) selectedText = 'No recording or upload saved. Generator is running from math + character sliders only.';
    else if (!state.audioAssetsEnabled) selectedText = 'Base voice reference saved but disabled. Generator is running without it.';
    else selectedText = 'Using optional recorded/uploaded roleplay reference.';
    $('selectedClipText').textContent = selectedText;
  };

  const fillSelect = (el, items, blank = '—') => {
    if (!el) return;
    el.innerHTML = [`<option value="">${blank}</option>`].concat((items || []).map(x=>`<option value="${String(x).replace(/"/g,'&quot;')}">${x}</option>`)).join('');
  };

  const updateSubclassSelect = (selected = '') => {
    const el = $('npcSubclass');
    if (!el) return;
    const className = $('npcClass')?.value || state.npc.class || '';
    const list = Pack ? Pack.listSubclasses(className) : [];
    fillSelect(el, list, list.length ? 'Any subclass / base path' : 'Choose a class first');
    if (selected && list.includes(selected)) el.value = selected;
  };

  const initTaxonomy = async () => {
    state.taxonomy = await Presets.loadTaxonomy();
    fillSelect($('npcRace'), Pack ? Pack.listRaces() : Object.keys(state.taxonomy.raceProfiles || {}), 'Any race or lineage');
    fillSelect($('npcGender'), state.taxonomy.genders || [], 'Any gender identity');
    fillSelect($('npcClass'), Pack ? Pack.listClasses() : Object.keys(state.taxonomy.classes || {}), 'Any class');
    updateSubclassSelect();
    fillSelect($('npcAlignment'), state.taxonomy.traditionalAlignments || [], 'Any traditional alignment');
    const biomeEl = $('npcBiome');
    if (biomeEl && Accents) {
      biomeEl.innerHTML = Accents.listOptions().map(o => `<option value="${o.key}">${o.label}</option>`).join('');
      biomeEl.value = 'none';
    }
    if ($('packSummary')) $('packSummary').textContent = Pack ? `${Pack.packSummary()} Regional biome accent model loaded with ${Accents ? Accents.BIOMES.length - 1 : 0} fantasy accents. Humanized resource references loaded from the supplied media/JSON packs.` : 'Basic voice taxonomy loaded.';
  };

  const renderClipLibrary = () => {
    const wrap = $('clipLibrary');
    if (!wrap) return;
    if (!state.recordedClip) {
      wrap.innerHTML = '<div class="mini">No packaged audio clips are included. The studio generates voices on its own; record or upload your own voice only if you want an optional roleplay reference.</div>';
      return;
    }
    const c = state.analyzed.get(state.recordedClip.id) || state.recordedClip;
    wrap.innerHTML = `
      <label class="clip-card" title="Optional self-recorded reference">
        <input type="checkbox" value="${state.recordedClip.id}" ${state.audioAssetsEnabled && state.selectedClipIds.has(state.recordedClip.id) ? 'checked' : ''}>
        <span><b>${c.displayName || 'My Recorded Base Voice'}</b><small>${state.audioAssetsEnabled ? 'enabled as reference' : 'saved but disabled'} · ${(c.tags || []).join(', ')}</small><small>pitch hint ${c.estimatedF0Hz || c.liveAnalysis?.estimatedF0Hz || '?'} Hz · tone hint ${c.spectralCentroidHz || c.liveAnalysis?.spectralCentroidHz || '?'} Hz</small></span>
      </label>`;
    wrap.querySelectorAll('input[type="checkbox"]').forEach(box => box.addEventListener('change', () => {
      state.audioAssetsEnabled = !!box.checked;
      const toggle = $('useAudioAssets'); if (toggle) toggle.checked = state.audioAssetsEnabled;
      box.checked ? state.selectedClipIds.add(box.value) : state.selectedClipIds.delete(box.value);
      updateOutputs(); renderClipLibrary();
    }));
  };

  const loadManifest = async () => {
    state.originalManifest = [];
    state.manifest = [];
    state.selectedClipIds = state.recordedClip && state.audioAssetsEnabled ? new Set([state.recordedClip.id]) : new Set();
    renderClipLibrary();
  };

  const collectNpcFromFields = () => ({
    name: $('npcName').value.trim() || 'Unnamed Voice',
    race: $('npcRace').value,
    genderIdentity: $('npcGender').value,
    class: $('npcClass').value,
    subclass: $('npcSubclass') ? $('npcSubclass').value : '',
    alignment: $('npcAlignment').value,
    biome: $('npcBiome') ? $('npcBiome').value : 'none',
    personality: $('npcPersonality').value.trim(),
    voiceInfluences: getInfluencesFromInputs(),
    belavadosAlignment: { Altruism:+$('axisAltruism').value, Lawfulness:+$('axisLawfulness').value, Cooperation:+$('axisCooperation').value, Honor:+$('axisHonor').value }
  });

  const applyNpc = async (npcInput) => {
    syncInfluenceOutputs();
    const result = await Mapper.autoSelectForNpc(npcInput, [], state.influences);
    state.npc = result.npc;
    if (!state.npc.biome && typeof npcInput === 'string' && Accents) state.npc.biome = Accents.inferFromText(npcInput) || 'none';
    if (!state.npc.biome) state.npc.biome = $('npcBiome')?.value || 'none';
    state.baseProfile = { ...result.preset.profile };
    if (Humanization()) state.baseProfile = Humanization().profileNudgeFromSpeechPatterns(state.baseProfile, state.npc, state.influences);
    state.profile = applyBiomeToProfile({ ...state.baseProfile }, state.npc);
    state.selectedClipIds = (state.audioAssetsEnabled && state.recordedClip) ? new Set([state.recordedClip.id]) : new Set();
    $('npcName').value = result.npc.name || '';
    if (result.npc.race) $('npcRace').value = result.npc.race;
    if (result.npc.genderIdentity) $('npcGender').value = result.npc.genderIdentity;
    if (result.npc.class) $('npcClass').value = result.npc.class;
    updateSubclassSelect(result.npc.subclass || result.preset.subclass || '');
    if (result.npc.subclass && $('npcSubclass')) $('npcSubclass').value = result.npc.subclass;
    if (result.npc.alignment) $('npcAlignment').value = result.npc.alignment;
    if ($('npcBiome')) $('npcBiome').value = Accents?.resolveBiomeKey(state.npc.biome || 'none') || 'none';
    $('npcPersonality').value = result.npc.personality || '';
    const accentLine = state.biomeAccent ? `\nBiome accent: ${Accents.describeAccent(state.biomeAccent)}` : '\nBiome accent: none selected.';
    $('autoSummary').textContent = Mapper.makeNpcSummary(result) + accentLine;
    renderTraitRows(); renderClipLibrary(); updateOutputs();
  };

  const exportBundle = () => ({
    npc: { ...state.npc, biomeAccent: state.biomeAccent || null },
    profile: state.profile,
    engine: Core.profileToEngine(state.profile, { waveform: state.waveform }),
    clips: state.audioAssetsEnabled ? getSelectedClips() : [],
    sampleText: $('sampleText').value,
    emotions: state.emotionCache,
    influences: state.influences,
    audioAssetsEnabled: state.audioAssetsEnabled,
    recordedVoice: (state.audioAssetsEnabled && state.recordedClip) ? { ...state.recordedClip, file: state.recordedClip.embeddedDataUrl || state.recordedClip.file } : null,
    biomeAccent: state.biomeAccent,
    accentCadence: state.biomeCadence,
    speakerReference: getSpeakerReference(),
    dataPack: Pack ? { summary: Pack.packSummary(), counts: Pack.counts(), sourceFiles: Pack.sourceFiles(), humanizationResources: window.BELAVADOS_VOICE_HUMANIZATION_REFERENCES?.resourceCounts || null } : null
  });

  const setAudioAssetsEnabled = (enabled) => {
    state.audioAssetsEnabled = !!enabled;
    if (state.audioAssetsEnabled && state.recordedClip) {
      state.selectedClipIds = new Set([state.recordedClip.id]);
      $('analysisStatus').textContent = 'Optional recorded/uploaded reference enabled. The generator still uses math sliders first; the recording only nudges the base profile.';
    } else {
      state.selectedClipIds = new Set();
      $('analysisStatus').textContent = state.recordedClip ? 'Recording saved but disabled. Preview uses generated math voice only.' : 'No recording active. Preview uses generated math voice only.';
    }
    renderClipLibrary();
    updateOutputs();
  };

  const installRecordedClip = async (clip, analyze = true) => {
    if (!clip) return;
    state.recordedClip = clip;
    state.audioAssetsEnabled = true;
    const toggle = $('useAudioAssets'); if (toggle) toggle.checked = true;
    state.selectedClipIds = new Set([clip.id]);
    if (analyze) {
      try {
        const analyzed = await Analysis.analyzeClip(clip);
        state.analyzed.set(clip.id, analyzed);
        if (analyzed.liveAnalysis?.profile) {
          state.baseProfile = Core.weightedMerge([state.baseProfile, analyzed.liveAnalysis.profile], [3, Math.max(0.1, (state.influences.baseAudio || 45) / 45)]);
          state.profile = applyBiomeToProfile({ ...state.baseProfile }, state.npc || {});
        }
        $('recordingStatus').textContent = 'Base voice reference is ready as an optional roleplay reference and lightly blended into the current voice profile.';
      } catch (err) {
        $('recordingStatus').textContent = `Recording saved, but live analysis could not run here: ${err.message}`;
      }
    }
    renderTraitRows(); renderClipLibrary(); updateOutputs();
  };

  const wireRecorder = () => {
    $('startRecording')?.addEventListener('click', async () => {
      try {
        const result = await Recorder.start();
        $('recordingStatus').textContent = `Recording… speak a clean sample such as “this is what I sound like.” (${result.mimeType || 'browser audio'})`;
      } catch (err) {
        $('recordingStatus').textContent = `Could not start recording: ${err.message}`;
      }
    });
    $('stopRecording')?.addEventListener('click', async () => {
      try {
        const result = await Recorder.stop();
        const audio = $('recordedAudio');
        if (result.url && audio) { audio.src = result.url; audio.style.display = 'block'; }
        $('recordingStatus').textContent = result.blob ? 'Recording captured. Preview it or use it as the base voice.' : 'No active recording to stop.';
      } catch (err) { $('recordingStatus').textContent = `Could not stop recording: ${err.message}`; }
    });
    $('previewRecording')?.addEventListener('click', () => {
      const audio = $('recordedAudio');
      if (!audio?.src) { $('recordingStatus').textContent = 'Record a base voice first.'; return; }
      audio.currentTime = 0;
      if (window.BelavadosPlaybackHub) window.BelavadosPlaybackHub.playAudio('recording', audio); else audio.play();
    });
    $('useRecordingAsBase')?.addEventListener('click', async () => {
      const current = Recorder.current();
      if (!current.clip) { $('recordingStatus').textContent = 'Record a base voice first.'; return; }
      await installRecordedClip(current.clip, true);
    });
    $('clearRecording')?.addEventListener('click', () => {
      window.BelavadosPlaybackHub?.stop?.('recording');
      Recorder.clear();
      state.recordedClip = null;
      state.selectedClipIds = new Set();
      state.audioAssetsEnabled = false;
      const toggle = $('useAudioAssets'); if (toggle) toggle.checked = false;
      const audio = $('recordedAudio'); if (audio) { audio.removeAttribute('src'); audio.style.display = 'none'; }
      $('recordingStatus').textContent = 'Recording deleted. Generator is back to math + character sliders only.';
      renderClipLibrary();
      updateOutputs();
    });

    let uploadedBase = { url:'', dataUrl:'', clip:null };
    const blobToDataUrl = (blob) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = reject; reader.readAsDataURL(blob); });
    $('uploadBaseVoice')?.addEventListener('change', async ev => {
      const file = ev.target.files?.[0];
      if (!file) return;
      window.BelavadosPlaybackHub?.stop?.('upload');
      if (uploadedBase.url) { try { URL.revokeObjectURL(uploadedBase.url); } catch {} }
      uploadedBase.url = URL.createObjectURL(file);
      uploadedBase.dataUrl = await blobToDataUrl(file);
      uploadedBase.clip = {
        id: 'uploaded-own-voice-base',
        filename: file.name || 'uploaded-base-voice',
        displayName: 'My Uploaded Base Voice',
        file: uploadedBase.url,
        embeddedDataUrl: uploadedBase.dataUrl,
        duration: 0,
        tags: ['uploaded','custom','voice reference','base','clean'],
        source: 'local uploaded audio reference',
        uploadedAt: new Date().toISOString()
      };
      const audio = $('uploadedAudio');
      if (audio) { audio.src = uploadedBase.url; audio.style.display = 'block'; }
      $('uploadStatus').textContent = 'Uploaded audio is ready. Preview it or use it as the optional base voice reference. Typed preview text remains the spoken text.';
    });
    $('previewUploadedVoice')?.addEventListener('click', () => {
      const audio = $('uploadedAudio');
      if (!audio?.src) { $('uploadStatus').textContent = 'Upload an audio file first.'; return; }
      audio.currentTime = 0; if (window.BelavadosPlaybackHub) window.BelavadosPlaybackHub.playAudio('upload', audio); else audio.play();
    });
    $('useUploadedVoiceAsBase')?.addEventListener('click', async () => {
      if (!uploadedBase.clip) { $('uploadStatus').textContent = 'Upload an audio file first.'; return; }
      await installRecordedClip(uploadedBase.clip, true);
      $('uploadStatus').textContent = 'Uploaded base voice is active as an optional roleplay reference. The preview still speaks your typed text.';
    });
    $('clearUploadedVoice')?.addEventListener('click', () => {
      if (uploadedBase.url) { try { URL.revokeObjectURL(uploadedBase.url); } catch {} }
      uploadedBase = { url:'', dataUrl:'', clip:null };
      const input = $('uploadBaseVoice'); if (input) input.value = '';
      const audio = $('uploadedAudio'); if (audio) { audio.removeAttribute('src'); audio.style.display = 'none'; }
      if (state.recordedClip?.id === 'uploaded-own-voice-base') {
        state.recordedClip = null; state.selectedClipIds = new Set(); state.audioAssetsEnabled = false;
        const toggle = $('useAudioAssets'); if (toggle) toggle.checked = false;
      }
      $('uploadStatus').textContent = 'Uploaded base voice deleted. Generator is back to math + character sliders unless a recording is enabled.';
      renderClipLibrary(); updateOutputs();
    });
  };

  const wire = () => {
    renderEmotionControls();
    wireRecorder();
    if (window.BelavadosPlaybackHub) {
      window.BelavadosPlaybackHub.registerAudio('recording', $('recordedAudio'));
      window.BelavadosPlaybackHub.registerAudio('upload', $('uploadedAudio'));
      document.querySelectorAll('[data-player-action]').forEach(btn => btn.addEventListener('click', async () => {
        const id = btn.dataset.playerId; const action = btn.dataset.playerAction;
        if (action === 'play') {
          if (id === 'base') await window.BelavadosPlaybackHub.playSpeech('base', $('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() });
          else if (id === 'emotion') { const { key, intensity } = getCurrentEmotionSelection(); await window.BelavadosPlaybackHub.playSpeech('emotion', $('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, emotionKey:key, emotionIntensity:intensity, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() }); }
          else if (id === 'recording') window.BelavadosPlaybackHub.playAudio('recording', $('recordedAudio'));
          else if (id === 'upload') window.BelavadosPlaybackHub.playAudio('upload', $('uploadedAudio'));
        } else if (action === 'pause') window.BelavadosPlaybackHub.pause(id);
        else if (action === 'resume') window.BelavadosPlaybackHub.resume(id);
        else if (action === 'stop') window.BelavadosPlaybackHub.stop(id);
        else if (action === 'rewind') window.BelavadosPlaybackHub.rewind(id, 5);
        else if (action === 'forward') window.BelavadosPlaybackHub.forward(id, 5);
      }));
    }
    $('sampleText').addEventListener('input', updateOutputs);
    ['npcName','npcRace','npcGender','npcClass','npcSubclass','npcAlignment','npcBiome','npcPersonality','axisAltruism','axisLawfulness','axisCooperation','axisHonor'].forEach(id => { const el = $(id); if (el) el.addEventListener('change', async () => { if (id === 'npcClass') updateSubclassSelect(); await applyNpc(collectNpcFromFields()); }); });
    ['influenceRace','influenceGender','influencePersonality','influenceBiome','influenceBaseAudio'].forEach(id => {
      $(id)?.addEventListener('input', () => { syncInfluenceOutputs(); refreshProfileFromBase(); });
      $(id)?.addEventListener('change', () => applyNpc(collectNpcFromFields()));
    });
    $('useAudioAssets')?.addEventListener('change', ev => setAudioAssetsEnabled(ev.target.checked));
    $('applyNpc').addEventListener('click', () => applyNpc(collectNpcFromFields()));
    $('jsonFile').addEventListener('change', async ev => { const file = ev.target.files[0]; if (!file) return; const json = await Mapper.readJsonFile(file); $('jsonInput').value = typeof json === 'string' ? json : JSON.stringify(json, null, 2); await applyNpc(json); });
    $('useJsonText').addEventListener('click', async () => { const text = $('jsonInput').value.trim(); if (!text) return alert('Paste JSON or plain personality notes first.'); const parsed = Core.safeJsonParse(text, null); await applyNpc(parsed || text); });
    $('analyzeSelected').addEventListener('click', async () => {
      if (!state.audioAssetsEnabled || !state.recordedClip) { $('analysisStatus').textContent = 'No optional recording reference is enabled. The generated voice still works without analysis.'; return; }
      $('analysisStatus').textContent = 'Scanning optional self-recorded reference with F0/STFT/mel/LPC math…';
      for (const clip of getSelectedClips()) {
        if (!state.analyzed.has(clip.id)) state.analyzed.set(clip.id, await Analysis.analyzeClip(clip));
      }
      const analyzed = getSelectedClips().map(c => c.liveAnalysis?.profile).filter(Boolean);
      if (analyzed.length) {
        state.baseProfile = Core.weightedMerge([state.baseProfile, Core.weightedMerge(analyzed)], [2,1]);
        state.profile = applyBiomeToProfile({ ...state.baseProfile }, state.npc || {});
      }
      $('analysisStatus').textContent = `Scanned ${analyzed.length} recording reference(s) and blended pitch/tone/formant hints into the voice.`;
      renderTraitRows(); updateOutputs();
    });
    $('previewSynth').addEventListener('click', async () => {
      $('analysisStatus').textContent = state.biomeAccent ? `Speaking base voice with ${state.biomeAccent.name} at ${state.biomeAccent.influence}%.` : 'Speaking base voice smoothly: this is what I sound like';
      await (window.BelavadosPlaybackHub ? window.BelavadosPlaybackHub.playSpeech('base', $('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() }) : Synth.speakBrowserPreview($('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() }));
      updateOutputs();
    });
    $('previewEmotion').addEventListener('click', async () => {
      const { key, intensity } = getCurrentEmotionSelection();
      const label = Emotions.emotionByKey(key).label;
      $('analysisStatus').textContent = `Speaking with ${label} at ${Math.round(intensity)}%.`;
      await (window.BelavadosPlaybackHub ? window.BelavadosPlaybackHub.playSpeech('emotion', $('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, emotionKey: key, emotionIntensity: intensity, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() }) : Synth.speakBrowserPreview($('sampleText').value || Synth.PREVIEW_PHRASE, state.profile, { npc: state.npc, emotionKey: key, emotionIntensity: intensity, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent, speakerReference: getSpeakerReference() }));
      updateOutputs();
    });
    $('addEmotionToCache').addEventListener('click', () => {
      const { key, intensity } = getCurrentEmotionSelection();
      const meta = Emotions.emotionByKey(key);
      const existing = state.emotionCache.findIndex(e => e.key === key);
      const entry = { key, label: meta.label, intensity: Math.round(intensity), description: meta.description, accentCadence: state.biomeCadence, biomeAccent: state.biomeAccent };
      if (existing >= 0) state.emotionCache[existing] = entry;
      else state.emotionCache.push(entry);
      $('analysisStatus').textContent = `${meta.label} was added to this character’s export cache.`;
      renderEmotionCache();
      updateOutputs();
    });
    $('clearEmotionCache').addEventListener('click', () => { state.emotionCache = []; renderEmotionCache(); updateOutputs(); });
    $('previewClips').addEventListener('click', () => {
      if (!state.audioAssetsEnabled || !state.recordedClip) { $('analysisStatus').textContent = 'No optional recording reference is enabled. Use Preview Base Voice for generated speech.'; return; }
      const { key, intensity } = getCurrentEmotionSelection();
      Synth.playTransformedClip(getSelectedClips(), state.profile, { mergeMode: $('mergeMode').value, emotionKey: key, emotionIntensity: intensity, accentCadence: state.biomeCadence });
    });
    $('exportJs').addEventListener('click', () => Exporter.exportJs(exportBundle()));
    $('exportJson').addEventListener('click', () => Exporter.exportJson(exportBundle()));
    $('copyCode').addEventListener('click', async () => { await navigator.clipboard.writeText($('profileCode').value); $('analysisStatus').textContent = 'Copied generated JavaScript to clipboard.'; });
    $('randomizeVoice').addEventListener('click', () => { Core.TRAITS.forEach(t => { state.baseProfile[t.key] = Core.round(Math.random()*10,1); }); state.profile = applyBiomeToProfile({ ...state.baseProfile }, state.npc || {}); renderTraitRows(); updateOutputs(); });
    $('resetVoice').addEventListener('click', () => applyNpc(collectNpcFromFields()));
  };

  document.addEventListener('DOMContentLoaded', async () => {
    renderTraitRows();
    const useAudio = $('useAudioAssets'); if (useAudio) useAudio.checked = state.audioAssetsEnabled;
    wire();
    await initTaxonomy();
    await loadManifest();
    await applyNpc({ name:'Belavadös NPC Voice', race:'Human', genderIdentity:'Non-Binary', class:'Bard', alignment:'True Neutral', biome:'none', personality:'warm, adaptive, inclusive storyteller', voiceInfluences: state.influences });
  });
})();
