@echo off
:: Publie les memes fichiers vers le site de test (dreame-test), avec les memes controles.
:: La beta garde son propre historique dans .git_test : le site officiel n'est pas touche.
setlocal
cd /d "%~dp0"

set "REPO_URL=https://github.com/savvyfnacdarty/dreame-test.git"

if not exist ".git_test" (
    echo Aucun depot de test trouve ici. Rattachement a GitHub...
    set "TMPCLONE=%TEMP%\hubclone_%RANDOM%%RANDOM%"
    call git clone "%REPO_URL%" "%%TMPCLONE%%"
    if errorlevel 1 (
        echo [ERREUR] Impossible de cloner %REPO_URL%.
        pause
        exit /b 1
    )
    call xcopy "%%TMPCLONE%%\.git" ".git_test" /e /h /i /y >nul
    attrib +h ".git_test" >nul 2>&1
    call rd /s /q "%%TMPCLONE%%"
)

:: --- Chaque historique ignore le dossier de l'autre (sinon "git add -A" l'ajouterait) ---
if not exist ".git_test\info" mkdir ".git_test\info"
findstr /x /c:".git_test/" ".git_test\info\exclude" >nul 2>&1 || >>".git_test\info\exclude" echo .git_test/
if exist ".git\info" findstr /x /c:".git_test/" ".git\info\exclude" >nul 2>&1 || >>".git\info\exclude" echo .git_test/

set "GIT_DIR=%CD%\.git_test"
set "GIT_WORK_TREE=%CD%"

:: --- Securite : refuse de continuer si .git_test ne pointe pas vers la beta ---
set "URL_ACTUELLE="
for /f "delims=" %%U in ('git remote get-url origin') do set "URL_ACTUELLE=%%U"
if /i not "%URL_ACTUELLE%"=="%REPO_URL%" (
    echo [ERREUR] .git_test pointe vers %URL_ACTUELLE% au lieu de la beta.
    pause
    exit /b 1
)

call "%~dp0publier.bat"
