@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "BRANCH=main"

:: publier_beta.bat definit GIT_DIR : tout le script agit alors sur le depot de test
set "CIBLE=HUB Drive constructeurs"
set "DEPOT=.git"
if defined GIT_DIR (
    set "CIBLE=BETA dreame-test"
    set "DEPOT=.git_test"
)

echo ============================================
echo   Publication - !CIBLE!
echo ============================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installe ou pas dans le PATH.
    pause
    exit /b 1
)
where python >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou pas dans le PATH.
    pause
    exit /b 1
)
if exist "!DEPOT!\rebase-merge" goto :rebase_en_cours
if exist "!DEPOT!\rebase-apply" goto :rebase_en_cours

:: --- Controle : rien ne part si un probleme bloquant est detecte ---
python _outils\controle_publication.py
if errorlevel 1 (
    pause
    exit /b 1
)
echo.

set "AHEAD=0"
for /f %%C in ('git rev-list --count origin/%BRANCH%..HEAD 2^>nul') do set "AHEAD=%%C"
set "CHANGES="
for /f "delims=" %%L in ('git status --porcelain') do set "CHANGES=1"
if not defined CHANGES if "!AHEAD!"=="0" (
    echo Aucun changement a publier.
    pause
    exit /b 0
)

set "rep="
set /p rep="Publier TOUS ces changements sur !CIBLE! ? (O/N) : "
if /i not "!rep!"=="O" (
    echo Publication annulee, rien n'a ete envoye.
    pause
    exit /b 0
)

if not defined CHANGES goto :pushstep

set "msg="
set /p msg="Message de commit (Entree = message automatique) : "
if not defined msg set "msg=Mise a jour du %date% %time%"
set "msg=!msg:"=!"

git add -A
if errorlevel 1 (
    echo [ERREUR] L'ajout des fichiers a echoue.
    pause
    exit /b 1
)
git commit -q -m "!msg!"
if errorlevel 1 (
    echo [ERREUR] Le commit a echoue.
    pause
    exit /b 1
)

:pushstep
echo.
echo Recuperation des modifications presentes sur GitHub...
:: Les "n" repondent aux questions "Should I try again? (y/n)" (dossier verrouille par OneDrive/Explorateur)
(for /l %%i in (1,1,500) do @echo n) | git pull --rebase origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] Un meme fichier a ete modifie ici et sur GitHub.
    git rebase --abort >nul 2>&1
    echo La fusion a ete annulee, rien n'a ete envoye. Ton commit local est conserve.
    pause
    exit /b 1
)

:: --- Nouveau controle : la fusion peut avoir apporte des fichiers de GitHub ---
python _outils\controle_publication.py >nul
if errorlevel 1 (
    echo [ERREUR] Le controle echoue apres la fusion avec GitHub. Rien n'a ete envoye.
    python _outils\controle_publication.py
    pause
    exit /b 1
)

echo Envoi vers GitHub...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] L'envoi a echoue. Verifie ta connexion et ton compte GitHub.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Publication terminee. Le site sera a jour
echo   dans quelques minutes.
echo ============================================
pause
exit /b 0

:rebase_en_cours
echo [ERREUR] Une fusion Git inachevee est en cours : demande de l'aide avant de publier.
pause
exit /b 1
