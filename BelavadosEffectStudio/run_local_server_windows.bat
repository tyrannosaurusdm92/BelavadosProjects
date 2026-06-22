@echo off
cd /d "%~dp0"
echo Serving Belavados Effect Layer Studio at http://localhost:8765/
python -m http.server 8765
if errorlevel 1 py -m http.server 8765
pause
