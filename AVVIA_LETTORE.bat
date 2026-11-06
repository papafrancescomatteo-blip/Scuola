@echo off
chcp 65001 >nul
title Lettore NFC - Laboratorio di Metrologia
where python >nul 2>nul
if errorlevel 1 (
  echo Python non e' installato. Scaricalo da https://www.python.org/downloads/
  echo e durante l'installazione spunta "Add python.exe to PATH". Poi rilancia questo file.
  pause
  exit /b 1
)
python -m pip install --quiet --disable-pip-version-check pyscard websockets
python "%~dp0lettore_nfc.py"
pause
