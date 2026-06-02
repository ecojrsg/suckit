@echo off
setlocal enabledelayedexpansion
title SuckIt Local Setup

echo ===================================================
echo   SuckIt Video Downloader - Local Developer Setup
echo ===================================================

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Node.js no esta instalado en el sistema.
    echo [INFO] Intentando instalar Node.js LTS automaticamente usando winget...
    where winget >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] Descargando e instalando Node.js LTS. Por favor, acepta los terminos si se solicita...
        winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
        if !errorlevel! equ 0 (
            echo [INFO] Node.js instalado con éxito. Actualizando PATH de la sesion...
            for /f "tokens=2*" %%A in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path') do set "SYS_PATH=%%B"
            for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path') do set "USR_PATH=%%B"
            set "PATH=!SYS_PATH!;!USR_PATH!"
            echo [INFO] PATH de Node.js actualizado correctamente en esta sesion.
        ) else (
            echo [ERROR] No se pudo completar la instalacion automatica de Node.js.
            echo Por favor, descargalo e instalalo manualmente desde: https://nodejs.org/
            pause
            exit /b 1
        )
    ) else (
        echo [ERROR] winget no esta disponible en tu sistema.
        echo Por favor, instala Node.js manualmente desde: https://nodejs.org/
        pause
        exit /b 1
    )
)
set NODE_MAJOR=0
for /f "delims=." %%a in ('node --version 2^>^&1') do set NODE_VER=%%a
if not "!NODE_VER!"=="" set NODE_MAJOR=!NODE_VER:v=!
set NODE_MAJOR=%NODE_MAJOR: =%

if !NODE_MAJOR! lss 20 (
    echo [WARNING] Se recomienda Node.js version 20 o superior. Tu version actual es menor.
)


:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if !errorlevel! neq 0 (
        echo [INFO] Python no esta instalado en el sistema.
        echo [INFO] Intentando instalar Python 3.12 automaticamente usando winget...
        where winget >nul 2>&1
        if !errorlevel! equ 0 (
            echo [INFO] Descargando e instalando Python 3.12. Por favor, acepta los terminos si se solicita...
            winget install Python.Python.3.12 --silent --accept-source-agreements --accept-package-agreements
            if !errorlevel! equ 0 (
                echo [INFO] Python instalado con éxito. Actualizando PATH de la sesion...
                for /f "tokens=2*" %%A in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path') do set "SYS_PATH=%%B"
                for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path') do set "USR_PATH=%%B"
                set "PATH=!SYS_PATH!;!USR_PATH!"
                set PYTHON_CMD=python
                echo [INFO] PATH de Python actualizado correctamente en esta sesion.
            ) else (
                echo [ERROR] No se pudo completar la instalacion automatica de Python.
                echo Por favor, descargalo e instalalo manualmente desde: https://www.python.org/
                pause
                exit /b 1
            )
        ) else (
            echo [ERROR] winget no esta disponible en tu sistema.
            echo Por favor, instala Python manualmente desde: https://www.python.org/
            pause
            exit /b 1
        )
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

:: Check Python version
set PY_MAJOR=0
set PY_MINOR=0
for /f "tokens=2 delims= " %%a in ('%PYTHON_CMD% --version 2^>^&1') do (
    for /f "tokens=1,2 delims=." %%b in ("%%a") do (
        set PY_MAJOR=%%b
        set PY_MINOR=%%c
    )
)
set PY_MAJOR=%PY_MAJOR: =%
set PY_MINOR=%PY_MINOR: =%

if "!PY_MAJOR!"=="" set PY_MAJOR=0
if "!PY_MINOR!"=="" set PY_MINOR=0

if !PY_MAJOR! lss 3 (
    echo [ERROR] Python 3.12+ es requerido. Tu version es muy antigua.
    pause
    exit /b 1
)
if !PY_MINOR! lss 12 (
    echo [WARNING] Se recomienda Python 3.12 o superior. Tu version es 3.!PY_MINOR!.
)

echo [INFO] Configurando dependencias del Frontend y de la Raiz...
call npm install
cd frontend
call npm install
cd ..

echo [INFO] Configurando dependencias del Backend...
if not exist backend\.venv (
    echo [INFO] Creando entorno virtual de Python - venv...
    %PYTHON_CMD% -m venv backend\.venv
)
echo [INFO] Actualizando pip e instalando dependencias de Python...
backend\.venv\Scripts\python.exe -m pip install --upgrade pip
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt

:: FFmpeg Auto-Download
echo [INFO] Verificando FFmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Se detecto FFmpeg instalado globalmente en el sistema.
) else (
    if exist backend\bin\ffmpeg.exe (
        echo [INFO] Se detecto FFmpeg local en backend\bin\
    ) else (
        echo [INFO] FFmpeg no fue detectado. Iniciando script de descarga automatizada para Windows...
        powershell -ExecutionPolicy Bypass -File backend\download_ffmpeg.ps1
    )
)

:: Environment Setup
echo [INFO] Generando archivos .env si no existen...
if not exist .env (
    echo NEXT_PUBLIC_API_URL=http://localhost:8000> .env
)
if not exist frontend\.env.local (
    echo NEXT_PUBLIC_API_URL=http://localhost:8000> frontend\.env.local
)
if not exist backend\.env (
    echo SUCKIT_DOWNLOAD_DIR=downloads> backend\.env
    echo SUCKIT_MAX_CONCURRENT=3>> backend\.env
    echo SUCKIT_FILE_TTL=1800>> backend\.env
)

echo ===================================================
echo   ¡Configuracion Completada con Exito!
echo ===================================================
echo.
set /p START_APP="¿Deseas iniciar la aplicacion en modo desarrollo ahora mismo? (S/N) [S]: "
if "%START_APP%"=="" set START_APP=S
if /i "%START_APP%"=="S" (
    echo [INFO] Iniciando aplicacion...
    npm run dev
) else (
    echo [INFO] Puedes iniciar la aplicacion mas tarde ejecutando: npm run dev
    pause
)
