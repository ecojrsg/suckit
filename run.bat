@echo off
setlocal enabledelayedexpansion
title SuckIt Docker Launcher

echo ===================================================
echo   SuckIt Video Downloader - Docker Launcher
echo ===================================================

:: Check if Docker is installed
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado o no se encuentra en el PATH.
    echo Por favor, instala Docker Desktop: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

:: Check if docker compose is available
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 'docker compose' no esta disponible. Asegurate de tener Docker Desktop v2+ o Docker Compose v2.
    pause
    exit /b 1
)

:: Check if Docker daemon is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Docker no parece estar iniciado. Intentando iniciar...
    echo Por favor, abre Docker Desktop y espera a que este activo, luego presiona cualquier tecla.
    pause
    docker info >nul 2>&1
    if !errorlevel! neq 0 (
        echo [ERROR] Docker sigue sin estar activo. Saliendo...
        pause
        exit /b 1
    )
)

echo [INFO] Levantando contenedores con Docker Compose...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al levantar los contenedores.
    pause
    exit /b 1
)

echo [INFO] Esperando a que el servicio este listo...
timeout /t 5 /nobreak >nul

echo [INFO] Abriendo SuckIt en el navegador...
start http://localhost:3000

echo ===================================================
echo   ¡Listo! SuckIt esta corriendo en segundo plano.
echo   Para detener los contenedores, ejecuta:
echo     docker compose down
echo ===================================================
pause
