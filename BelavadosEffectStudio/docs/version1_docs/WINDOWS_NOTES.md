# Windows Notes

## Fast open

Double-click `index.html` or `open_index_windows.bat`.

## Local server fallback

Some browser settings are stricter with local files. If an export/download/import action seems blocked, double-click `run_local_server_windows.bat`. It will try Python first and serve the current folder at `http://localhost:8765/`.

## Path safety

Runtime folders use short normal names:

- `css`
- `js`
- `js/vendor`
- `docs`
- `examples`
- `exports`

No symlinks or platform-specific path separators are required.
