# Voice Runtime Stripped to Placeholders

This build preserves the visible voice tools but removes the built-in voice/TTS/accent/audio generation runtime.

## Preserved user-facing tools

- Page 3 Voice Studio controls
- Voice Testing Lab text box, emotion menu, sliders, browser voice selector, asset selector, upload controls, and buttons
- Voice JSON export/download buttons
- Character Sheet voice/audio player panel and related context fields

## Removed or neutralized

- Packaged audio references and 996 audio files in `media/a/`
- Built-in Web Speech API preview calls
- Voice/TTS/accent math runtime JS files
- Deep voice math JSON files
- Voice/audio/speech/accent manifests
- AudioContext/filter processing from the Page 3 repair script

## Replacement hook

Attach your new engine with:

```js
window.BelavadosVoiceBridge.registerAdapter({
  buildProfile(fields, context) { /* return your profile */ },
  speak(fields) { /* generate or preview speech */ },
  stop() {},
  pause() {},
  resume() {},
  findMatchingAsset(fields) {},
  exportProfile(fields, context) { return { schema: 'your.voice.schema', fields }; }
});
```

The placeholder exports a safe JSON object from the existing visible fields until your replacement adapter is registered.
