@echo off
cd /d "%~dp0"
echo Starting Anunay Brini Portfolio Server...
start "" "http://localhost:3000/admin.html"
node server.js
pause
