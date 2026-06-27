@echo off
cd /d "%~dp0"
python -m http.server 8080
echo Open http://localhost:8080 in your browser.
pause
