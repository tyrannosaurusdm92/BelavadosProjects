"""Belavadös Voice Adapter - weighted layer payload sketch.

This file is intentionally small and safe for GitHub. It does not ship voice models.
Connect it to your own Piper/Kokoro/PyThaiTTS/KhanomTan/Thonburian services and only
render assets with an explicit allowed permission type.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List

ALLOWED_PERMISSION_TYPES = {"own_voice", "licensed_actor", "public_domain_character_asset", "synthetic_original"}

@dataclass
class WeightedLayer:
    model_id: str
    fantasy_accent_name: str
    normalized_weight: float
    engine: str | None = None
    language_hint: str | None = None


def validate_permission(asset_permission_type: str | None) -> None:
    if asset_permission_type not in ALLOWED_PERMISSION_TYPES:
        raise ValueError("Voice asset blocked: label it as own_voice, licensed_actor, public_domain_character_asset, or synthetic_original before rendering.")


def normalize_layers(layers: List[Dict[str, Any]]) -> List[WeightedLayer]:
    enabled = [l for l in layers if l.get("enabled", True)]
    raw_total = sum(float(l.get("rawIntensityPercent", l.get("intensityPercent", 0)) or 0) for l in enabled)
    if raw_total <= 0:
        raw_total = float(len(enabled) or 1)
        for l in enabled:
            l["rawIntensityPercent"] = 1
    return [
        WeightedLayer(
            model_id=str(l.get("modelId") or l.get("model_id") or ""),
            fantasy_accent_name=str(l.get("fantasyAccentName") or l.get("fantasy_accent_name") or ""),
            normalized_weight=round(float(l.get("rawIntensityPercent", l.get("intensityPercent", 0)) or 0) / raw_total, 6),
            engine=l.get("engine"),
            language_hint=l.get("languageHint"),
        )
        for l in enabled
    ]


def render_weighted_voice_plan(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Return a render plan for your engine workers.

    Production implementation should:
    1. Decode uploaded MP3/WAV only when permission is valid.
    2. Analyze pitch/timing/formants/breath/roughness/nasality.
    3. Apply voice_profile and internal_parameters.
    4. Render each enabled layer with its selected engine.
    5. Blend layer waveforms by normalized_weight.
    6. Return one output audio URL/blob and never play multiple clips at once in the UI.
    """
    validate_permission(payload.get("asset_permission_type", "synthetic_original"))
    layers = normalize_layers(payload.get("weighted_layers", []))
    return {
        "schema": "belavados.voice.backendRenderPlan.v2",
        "text": payload.get("text", ""),
        "text_language": payload.get("text_language", "en"),
        "render_mode": payload.get("renderMode", "weighted_crossover_layers"),
        "layers": [layer.__dict__ for layer in layers],
        "voice_profile": payload.get("voice_profile", {}),
        "internal_parameters": payload.get("internal_parameters", {}),
        "output_policy": {
            "single_active_clip": True,
            "controls": ["play_or_resume", "pause", "stop", "rewind_5_seconds", "fast_forward_5_seconds"],
            "store_raw_audio_separately": True,
            "store_abstract_parameters_separately": True,
        },
    }
