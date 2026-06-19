#!/usr/bin/env python3
"""Download direct accent-audio clips listed in metadata/manifest.json.

This script skips link-only/restricted resources and downloads only entries that
have a direct_audio_url and downloadable_by_script == "yes".
"""
from __future__ import annotations
import json
import re
import sys
import time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "metadata" / "manifest.json"
OUT = ROOT / "audio"
OUT.mkdir(exist_ok=True)

def safe_name(text: str) -> str:
    text = text.lower().replace("/", "-").replace("—", "-")
    text = re.sub(r"[^a-z0-9._ -]+", "", text)
    text = re.sub(r"\s+", "_", text).strip("_.-")
    return text[:120] or "clip"

with MANIFEST.open("r", encoding="utf-8") as f:
    entries = json.load(f)

count = 0
for e in entries:
    url = e.get("direct_audio_url") or ""
    if e.get("downloadable_by_script") != "yes" or not url:
        print(f"SKIP: {e['clip_name']} (link-only/restricted/no direct URL)")
        continue
    ext = Path(url.split("?")[0]).suffix or ".mp3"
    filename = safe_name(e["accent_requested"] + "__" + e["clip_name"]) + ext
    dest = OUT / filename
    if dest.exists() and dest.stat().st_size > 0:
        print(f"EXISTS: {dest.name}")
        continue
    print(f"DOWNLOADING: {e['clip_name']} -> {dest.name}")
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 accent-reference-downloader"})
    try:
        with urlopen(req, timeout=45) as response, dest.open("wb") as out:
            out.write(response.read())
        count += 1
        time.sleep(0.5)
    except (HTTPError, URLError, TimeoutError) as err:
        print(f"ERROR: Could not download {url}: {err}", file=sys.stderr)

print(f"Done. Downloaded {count} new file(s) into: {OUT}")
