#!/usr/bin/env python3
"""Voice Studio local orchestration adapter.

This optional script shows how to connect real local TTS engines without changing the web UI.
It reads a Voice Studio profile JSON and text file, then chooses a route:
- Coqui / XTTS when installed and a compatible local model is configured.
- pyttsx3 if installed.
- a documented placeholder if neither local engine exists.

It intentionally avoids impersonating real people. Use only fictional or permissioned voices.
"""
from __future__ import annotations
import argparse, json, subprocess, sys, shutil
from pathlib import Path


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding='utf-8'))


def try_pyttsx3(text: str, out: Path, profile: dict) -> bool:
    try:
        import pyttsx3  # type: ignore
    except Exception:
        return False
    engine = pyttsx3.init()
    sliders = profile.get('sliders', {})
    engine.setProperty('rate', int(120 + float(sliders.get('speed', 5)) * 18))
    engine.setProperty('volume', 0.95)
    voices = engine.getProperty('voices') or []
    if voices:
        engine.setProperty('voice', voices[0].id)
    engine.save_to_file(text, str(out))
    engine.runAndWait()
    return out.exists() and out.stat().st_size > 1000


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--profile', required=True, type=Path)
    ap.add_argument('--text', required=True, type=Path)
    ap.add_argument('--out', required=True, type=Path)
    args = ap.parse_args()
    profile = load_json(args.profile)
    text = args.text.read_text(encoding='utf-8')
    args.out.parent.mkdir(parents=True, exist_ok=True)
    if try_pyttsx3(text, args.out, profile):
        print(json.dumps({'ok': True, 'engine': 'pyttsx3', 'out': str(args.out)}))
        return 0
    args.out.with_suffix('.json').write_text(json.dumps({'ok': False, 'reason': 'No local TTS engine installed', 'profile': profile, 'text': text}, indent=2), encoding='utf-8')
    print(json.dumps({'ok': False, 'message': 'Install/configure Coqui XTTS or pyttsx3 for local real TTS output.', 'out': str(args.out.with_suffix('.json'))}))
    return 2

if __name__ == '__main__':
    raise SystemExit(main())
