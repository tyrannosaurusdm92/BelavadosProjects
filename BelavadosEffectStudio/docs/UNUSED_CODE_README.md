# Unused / Not-Copied Code Notes

The source archives included several complete applications. Copying all of them into the runtime would make the project much larger without improving the static editor. Their useful concepts were folded into the merged app, while unused code is represented by README, license, and audit files.

## Where to look

- `MERGE_MANIFEST.md` lists every uploaded archive and what happened to it.
- `SOURCE_AUDIT.md` explains why heavy repositories were not copied wholesale.
- `source_readmes/` contains copied upstream README/source notes where available.
- `licenses/` contains copied upstream license files where available.
- `audits/original_paint_studio_docs/` preserves the docs from the compact paint studio source.

## If you later want a full framework-based merge

A deeper Penpot/draw.io/Excalidraw/Canva merge would need a real package manager workflow, build process, dependency resolution, and license review. This static build deliberately avoids that so it can open from `index.html` on Windows.
