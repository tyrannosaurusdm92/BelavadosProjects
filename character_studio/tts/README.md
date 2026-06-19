# TTS Notes

The scanner uses browser `speechSynthesis` for preview. This is a preview path, not a full TTS backend.

Uploaded or recorded audio is treated as reference influence metadata only. The scanner does not clone voices and does not force playback from uploaded clips.

Future Character Studio integration can map scanner exports to deeper modules such as `voice-speech-api.js`, `voice-prosody-engine.js`, `voice-analysis.js`, and `voice-reference-audio-learning.js`.
