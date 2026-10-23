@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Synchronisation FAQ Narwal
echo ============================================
echo  Synchronisation FAQ et videos Narwal
echo  (fr.narwal.com + centre d'aide support.narwal.com)
echo ============================================
echo.
where py >nul 2>nul && (set PY=py) || (set PY=python)
if "%~1"=="" (
  echo Mode direct : lecture des sites Narwal ...
  %PY% sync_narwal.py
) else (
  echo Mode instantane : %~1
  %PY% sync_narwal.py --snapshot "%~1"
)
echo.
echo Termine. Le journal des ecarts est dans ..\data\journal_synchro.csv
echo Pensez a lancer sync_github.bat pour publier la mise a jour.
pause
