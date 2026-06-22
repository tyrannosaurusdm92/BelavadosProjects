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


## Why full legacy repos are not inside runtime

The uploaded lightning and paint repos include native macOS, iOS, Unity, Godot, Qt/QML, Delphi, Java, and large web-app source trees. Copying them wholesale into the production editor would make the project harder to open on Windows and mobile. Their usable concepts were ported into browser JavaScript, while source provenance is documented in `licenses/`, `source_readmes/`, `legacy_reference/`, and `LEGACY_SOURCE_MANIFEST.md`.
