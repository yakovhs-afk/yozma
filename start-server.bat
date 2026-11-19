@echo off
rem Double-click to start the Yozma platform + back office on this computer.
rem Keep this window open while using the site. Close it to stop the server.
cd /d "%~dp0"
start "" "http://localhost:8766/admin"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8766
pause
