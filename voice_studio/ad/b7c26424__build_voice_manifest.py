#!/usr/bin/env python3
from pathlib import Path
import json, mimetypes
ROOT = Path(__file__).resolve().parents[2]
AUDIO_EXTS = {'.wav','.mp3','.flac','.ogg','.m4a'}
items=[]
for base in [ROOT/'resources'/'voice_sources', ROOT/'resources'/'accent_sources']:
    if not base.exists():
        continue
    for p in base.rglob('*'):
        if p.is_file() and p.suffix.lower() in AUDIO_EXTS:
            rel=p.relative_to(ROOT).as_posix()
            parts=p.relative_to(base).parts
            items.append({
                'source': parts[0] if parts else base.name,
                'speaker': parts[1] if len(parts)>1 and base.name=='voice_sources' else None,
                'file': rel,
                'bytes': p.stat().st_size,
                'kind': 'reference_sample' if base.name=='voice_sources' else 'accent_reference'
            })
(ROOT/'src'/'data'/'voice-source-manifest.json').write_text(json.dumps(items,indent=2),encoding='utf-8')
print(len(items), 'audio resources indexed')
