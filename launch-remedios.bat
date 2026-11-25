@echo off
cd /d "C:\Users\Acer VX 15\.gemini\antigravity\scratch\remedios-electron"
if exist "node_modules\electron\dist\electron.exe" (
  start "" "node_modules\electron\dist\electron.exe" .
  exit /b 0
)
start "" "C:\Users\Acer VX 15\.gemini\antigravity\scratch\remedios-electron\index.html"
