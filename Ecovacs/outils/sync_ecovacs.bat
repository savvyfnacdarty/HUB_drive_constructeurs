@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Synchronisation FAQ Ecovacs
echo ============================================
echo  Synchronisation FAQ Ecovacs (DEEBOT/WINBOT/GOAT)
echo ============================================
echo.
where py >nul 2>nul && (set PY=py) || (set PY=python)
if "%~1"=="" (
  echo Mode direct : lecture du site help.ecovacs.com ...
  %PY% sync_ecovacs.py
) else (
  echo Mode instantane : %~1
  %PY% sync_ecovacs.py --snapshot "%~1"
)
echo.
echo Termine. Le journal des ecarts est dans ..\data\journal_synchro.csv
echo Pensez a lancer sync_github.bat pour publier la mise a jour.
pause
