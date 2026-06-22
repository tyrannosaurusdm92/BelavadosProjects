# Voice Model Strategy

## Static site layer

The site can preview phrases with browser `speechSynthesis`. This is only a preview and depends on voices installed in the user/browser environment.

## Production layer

Use the JSON payload from the page with a backend adapter:

- Piper or Voices Java for local ONNX-style voice inference.
- Kokoro / Kokoro ONNX / Kokoro FastAPI for multilingual voices and voice blending.
- PyThaiTTS, ThaiSpeechKit, KhanomTan, or Thonburian for Thai-accent routes.
- LibriTTS British Accents and CommonAccent as reference/training/accent datasets for Irish, Scottish, Welsh English, West Country, and similar regional overlays.
- Piper Recording Studio or TextyMcSpeechy for building custom Piper voices from lawful/consented datasets.

## English phrase rule

Every request should send English text:

```json
{
  "text": "The tide remembers every promise.",
  "text_language": "en",
  "accent_id": "Tidecrest Cant",
  "model_id": "piper_pt_pt_tugao_medium"
}
```

The accent is selected by `accent_id` and `model_id`, not by changing the typed language.
