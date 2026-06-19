# Belavadös Audio Voice Creator Studio

This page is a static/offline-friendly NPC and bot voice creator. It keeps the visible HTML simple while the JavaScript handles deeper voice behavior.

## What changed in the repository-assisted revision

- The preview voice now uses a **clean segmented prosody engine** instead of static/noise layers.
- Sliders affect the spoken phrase more noticeably by changing:
  - browser speech voice choice
  - pitch
  - speech rate
  - phrase grouping
  - pause length
  - pitch motion across the sentence
  - word stress
  - hesitation and stutter insertion
  - formal vs casual cadence
  - soft, gruff, warm, commanding, fearful, angry, tender, etc. emotion cadence
- Base clip preview still supports selected audio clips, but the main character preview is intentionally clean and intelligible.
- The visible page keeps simple labels. Internal oscillator/formant-style details stay hidden in JavaScript.
- Exported NPC JavaScript includes the same clean segmented speech runtime.

## Important browser note

The main preview relies on the browser's `speechSynthesis` voices. Different browsers and devices provide different local voices, so the exact sound can vary. The exported JavaScript keeps the same prosody logic and chooses the best available browser voice at runtime.

## Files added for this revision

- `js/voice-vocal-model.js` — converts slider values into natural speech settings.
- `js/voice-prosody-engine.js` — speaks preview text through expressive chunks with rate/pitch/pause variation.
- `docs/REPO_PARSE_VOICE_ASSISTANCE.md` — local parse summary of the attached repositories and what concepts were adapted.

## Exported character API

Each exported NPC JavaScript file exposes:

```js
NPCVoiceRuntime.speakPreview();
NPCVoiceRuntime.speakPreview({ text: "this is what I sound like" });
NPCVoiceRuntime.speakEmotion("anger", "this is what I sound like");
NPCVoiceRuntime.listEmotions();
NPCVoiceRuntime.previewPlan("compassion");
NPCVoiceRuntime.stop();
```

Cached emotions are exported with both the modified trait profile and cadence information.
