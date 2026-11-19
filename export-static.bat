@echo off
rem Double-click before uploading to GitHub: copies the back-office site content into published-config.js
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0export-static.ps1"
pause
