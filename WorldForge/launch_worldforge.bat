@echo off
cd /d "%~dp0"
py -3 start_server.py 2>nul || python start_server.py
pause
