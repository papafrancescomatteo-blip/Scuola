@echo off
chcp 65001 >nul
del /Q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\LettoreNFC.lnk" 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*lettore_nfc.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
echo Lettore NFC automatico rimosso.
pause
