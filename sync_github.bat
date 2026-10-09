@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

set "REPO_URL=https://github.com/savvyfnacdarty/HUB_drive_constructeurs.git"
set "BRANCH=main"

echo ============================================
echo   Synchronisation GitHub - HUB Drive constructeurs
echo ============================================
echo.

:: --- Verifie que Git est installe ---
where git >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Git n'est pas installe ou pas dans le PATH.
    echo Installe Git pour Windows : https://git-scm.com/download/win
    pause
    exit /b 1
)

:: --- Initialisation du depot si besoin (premiere utilisation) ---
:: On clone le depot GitHub dans un dossier temporaire puis on recupere
:: uniquement son historique (.git), sans toucher aux fichiers actuels.
if not exist ".git" (
    echo Aucun depot Git trouve ici.
    echo Rattachement a l'historique existant sur GitHub...
    set "TMPCLONE=%TEMP%\hubclone_%RANDOM%%RANDOM%"
    git clone "%REPO_URL%" "!TMPCLONE!"
    if errorlevel 1 (
        echo [ERREUR] Impossible de cloner %REPO_URL%.
        echo Verifie ta connexion internet et tes identifiants GitHub.
        pause
        exit /b 1
    )
    xcopy "!TMPCLONE!\.git" ".git" /e /h /i /y >nul
    rd /s /q "!TMPCLONE!"
    echo Depot GitHub rattache avec succes.
    echo.
)

:: --- Construit la liste des dossiers du hub (exclut .git et les dossiers "00_...") ---
set count=0
for /d %%D in (*) do (
    set "name=%%D"
    if /i not "!name!"==".git" (
        if /i not "!name:~0,3!"=="00_" (
            set /a count+=1
            set "folder[!count!]=%%D"
        )
    )
)
set /a rootChoice=count+1

echo Dossiers disponibles :
for /l %%i in (1,1,%count%) do echo   %%i. !folder[%%i]!
echo   %rootChoice%. Fichiers a la racine (html, js, md, etc.)
echo   0. TOUT synchroniser
echo.

set "sel="
set /p sel="Numeros a synchroniser, separes par des virgules (ex: 1,3,%rootChoice%) ou 0 pour tout : "

if not defined sel (
    echo Aucune selection, annulation.
    pause
    exit /b 0
)

if "%sel%"=="0" (
    echo.
    echo Ajout de TOUT le contenu...
    git add -A
) else (
    set "sel=%sel:,= %"
    for %%N in (%sel%) do (
        if "%%N"=="%rootChoice%" (
            echo Ajout des fichiers a la racine...
            for %%F in (*.html *.js *.md *.gitignore *.gitattributes *.nojekyll) do (
                if exist "%%F" git add "%%F"
            )
        ) else (
            if defined folder[%%N] (
                echo Ajout du dossier : !folder[%%N]!
                git add "!folder[%%N]!"
            ) else (
                echo   [ignore] Numero invalide : %%N
            )
        )
    )
)

echo.
git diff --cached --quiet
if not errorlevel 1 (
    set "AHEAD=0"
    for /f %%C in ('git rev-list --count origin/%BRANCH%..HEAD 2^>nul') do set "AHEAD=%%C"
    if "!AHEAD!"=="0" (
        echo Aucun changement a synchroniser dans la selection choisie.
        pause
        exit /b 0
    )
    echo Rien de nouveau a ajouter, mais !AHEAD! commit^(s^) local^(aux^) pas encore envoye^(s^) : envoi en cours...
    goto :pushstep
)

set "msg="
set /p msg="Message de commit (Entree = message automatique) : "
if not defined msg set "msg=Mise a jour du %date% %time%"

git commit -m "%msg%"
if errorlevel 1 (
    echo [ERREUR] Le commit a echoue.
    pause
    exit /b 1
)

:pushstep
echo.
echo Recuperation des modifications presentes sur GitHub...
:: Les "n" envoyes repondent automatiquement a toutes les questions "Should I try again? (y/n)" (dossier verrouille par OneDrive/Explorateur)
(for /l %%i in (1,1,500) do @echo n) | git pull --rebase --autostash origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] Conflit entre tes fichiers et ceux de GitHub.
    git rebase --abort >nul 2>&1
    echo La fusion a ete annulee : tes fichiers locaux sont intacts.
    echo Un meme fichier a ete modifie en local et sur GitHub : demande de l'aide pour le fusionner.
    pause
    exit /b 1
)

echo.
echo Envoi vers GitHub...
git push -u origin %BRANCH%
if errorlevel 1 (
    echo.
    echo [ERREUR] Le push a echoue. Verifie ta connexion / authentification GitHub.
    echo Si c'est le premier push, une fenetre de connexion GitHub a pu s'ouvrir.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Synchronisation terminee avec succes !
echo ============================================
pause
