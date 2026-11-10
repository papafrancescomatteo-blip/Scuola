@echo off
chcp 65001 >nul
title Installazione lettore NFC automatico
echo Installo il lettore NFC in modo che parta da solo all'accensione del PC...
where python >nul 2>nul
if errorlevel 1 (
  echo Python non e' installato. Scaricalo da https://www.python.org/downloads/
  echo e spunta "Add python.exe to PATH". Poi rilancia questo file.
  pause
  exit /b 1
)
python -m pip install --quiet --disable-pip-version-check pyscard websockets
if errorlevel 1 (
  echo Installazione dei componenti non riuscita. Controlla la connessione a Internet.
  pause
  exit /b 1
)
set "DEST=%LOCALAPPDATA%\LettoreNFC"
if not exist "%DEST%" mkdir "%DEST%"
copy /Y "%~dp0lettore_nfc.py" "%DEST%\lettore_nfc.py" >nul
if exist "%~dp0chiave_lettore.txt" if not exist "%DEST%\chiave_lettore.txt" copy /Y "%~dp0chiave_lettore.txt" "%DEST%\chiave_lettore.txt" >nul
if exist "%DEST%\chiave_lettore.txt" goto chiave_ok
echo.
echo Incolla la CHIAVE DEL LETTORE (quella messa su Render come NFC_READER_KEY) e premi Invio.
echo Serve perche' le tessere registrino ingresso e uscita anche se usi il sito dal telefono.
echo Se non ce l'hai ancora, premi solo Invio: puoi aggiungerla dopo nel file chiave_lettore.txt
set "KEY="
set /p KEY=Chiave: 
if not defined KEY goto chiave_ok
>"%DEST%\chiave_lettore.txt" echo %KEY%
:chiave_ok
set "PYW="
for /f "delims=" %%i in ('where pythonw 2^>nul') do if not defined PYW set "PYW=%%i"
if not defined PYW (
  for /f "delims=" %%i in ('where python') do if not defined PYW set "PYW=%%~dpipythonw.exe"
)
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\LettoreNFC.lnk'); $s.TargetPath='%PYW%'; $s.Arguments='\"%DEST%\lettore_nfc.py\"'; $s.WorkingDirectory='%DEST%'; $s.WindowStyle=7; $s.Save()"
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*lettore_nfc.py*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>nul
start "" "%PYW%" "%DEST%\lettore_nfc.py"
echo.
echo FATTO. Il lettore NFC e' attivo e partira' da solo ogni volta che accendi il PC.
echo Non serve piu' aprire nessuna finestra. Per toglierlo usa DISINSTALLA_AUTOMATICO.bat
pause
