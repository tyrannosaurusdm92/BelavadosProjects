# Accent Audio Reference Pack

Prepared for: Andrew Blake-Newton
Date: 2026-06-18

This pack contains researched accent-audio references for the requested accent list. It includes:

- `metadata/manifest.csv` and `metadata/manifest.json`: curated audio/resource entries, direct URLs when available, and rights notes.
- `playlist.html`: an offline HTML page that streams the direct audio URLs in your browser where the source allows direct listening/downloading.
- `scripts/download_clips.py`: a local downloader script that can fetch the direct audio URLs into an `audio/` folder on your computer.
- `links/*.url`: Windows-friendly shortcut files for each accent/resource.
- `sources_and_licensing.md`: detailed source and rights notes.

## Important limitation

I could not embed the actual MP3/WAV files directly into this ZIP because this execution environment blocks downloading audio binaries. Some excellent sources, especially IDEA, also explicitly prohibit redistribution of their sound files without written permission. To keep this safe and legally usable, I included direct listen/download links, a downloader script for the freely accessible direct audio URLs, and clear licensing notes instead of redistributing restricted audio.

## How to download the clips locally

1. Unzip this folder.
2. Make sure Python 3 is installed.
3. Open a terminal/PowerShell in the unzipped folder.
4. Run:

```bash
python scripts/download_clips.py
```

The script will create an `audio/` folder and download the direct audio clips listed as downloadable in the manifest.

## Accent list covered

- English with Welsh accent
- English with French accent
- English with German accent
- English West Country
- English with Russian accent
- English with Scottish accent
- Hawaiian-influenced English / Hawai‘i Creole English
- Louisiana Cajun / Creole-influenced English
- English with Italian accent
- English with Portuguese accent

Note: “English with French accent” appeared twice in the request; I deduplicated it but included multiple French-accent references.
