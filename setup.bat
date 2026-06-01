@echo off
setlocal enabledelayedexpansion
title SuckIt Local Setup

echo ===================================================
echo   SuckIt Video Downloader - Local Developer Setup
echo ===================================================

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=2 delims=v." %%a in ('node --version') do set NODE_MAJOR=%%a
if !NODE_MAJOR! lss 20 (
    echo [WARNING] Se recomienda Node.js version 20 o superior. Tu version actual es menor.
)

:: Check Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Python no esta instalado. Descargalo desde: https://www.python.org/
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py
    )
) else (
    set PYTHON_CMD=python
)

:: Check Python version
for /f "tokens=2 delims= " %%a in ('%PYTHON_CMD% --version') do (
    for /f "tokens=1,2 delims=." %%b in ("%%a") do (
        set PY_MAJOR=%%b
        set PY_MINOR=%%c
    )
)
if !PY_MAJOR! lss 3 (
    echo [ERROR] Python 3.12+ es requerido. Tu version es muy antigua.
    pause
    exit /b 1
)
if !PY_MINOR! lss 12 (
    echo [WARNING] Se recomienda Python 3.12 o superior. Tu version es 3.!PY_MINOR!.
)

echo [INFO] Configurando dependencias del Frontend...
cd frontend
call npm install
cd ..

echo [INFO] Configurando dependencias del Backend...
cd backend
if not exist .venv (
    echo [INFO] Creando entorno virtual de Python (.venv)...
    %PYTHON_CMD% -m venv .venv
)
call .venv\Scripts\activate.bat
pip install --upgrade pip
pip install -r requirements.txt
cd ..

:: FFmpeg Auto-Download
echo [INFO] Verificando FFmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Se detecto FFmpeg instalado globalmente en el sistema.
) else (
    if exist backend\bin\ffmpeg.exe (
        echo [INFO] Se detecto FFmpeg local en backend\bin\
    ) else (
        echo [INFO] FFmpeg no fue detectado. Descargando compilacion estatica para Windows de forma automatizada...
        mkdir backend\bin >nul 2>&1
        
        :: Gyandev provides stable windows static builds
        set FFMPEG_URL=https://github.com/GyanD/codexffmpeg/releases/download/7.1/ffmpeg-7.1-essentials_build.zip
        echo [INFO] Descargando desde !FFMPEG_URL!...
        powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!FFMPEG_URL!' -OutFile 'backend\bin\ffmpeg.zip'"
        
        if !errorlevel! neq 0 (
            echo [ERROR] No se pudo descargar FFmpeg de forma automatizada.
            echo Por favor, instalalo manualmente o descargalo de https://ffmpeg.org/
        ) else (
            echo [INFO] Descomprimiendo FFmpeg...
            powershell -Command "Expand-Archive -Path 'backend\bin\ffmpeg.zip' -DestinationPath 'backend\bin\temp'"
            
            :: Move files to backend\bin
            move backend\bin\temp\ffmpeg-*-essentials_build\bin\ffmpeg.exe backend\bin\ >nul 2>&1
            move backend\bin\temp\ffmpeg-*-essentials_build\bin\ffprobe.exe backend\bin\ >nul 2>&1
            move backend\bin\temp\ffmpeg-*-essentials_build\bin\ffplay.exe backend\bin\ >nul 2>&1
            
            :: Cleanup
            del /q backend\bin\ffmpeg.zip >nul 2>&1
            rmdir /s /q backend\bin\temp >nul 2>&1
            
            if exist backend\bin\ffmpeg.exe (
                echo [INFO] FFmpeg instalado correctamente en backend\bin\
            ) else (
                echo [ERROR] No se pudo extraer FFmpeg correctamente.
            )
        )
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
echo   Para arrancar la aplicacion en desarrollo, ejecuta:
echo     npm run dev
echo ===================================================
pause
