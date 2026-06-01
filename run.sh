#!/bin/bash
set -e

echo "==================================================="
echo "  SuckIt Video Downloader - Docker Launcher"
echo "==================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker no está instalado o no se encuentra en el PATH."
    echo "Por favor, instala Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "[ERROR] 'docker compose' no está disponible. Asegúrate de tener Docker Compose v2."
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "[WARNING] El demonio de Docker no se está ejecutando."
    echo "Por favor, inicia Docker Desktop o el servicio Docker en tu sistema."
    exit 1
fi

echo "[INFO] Levantando contenedores con Docker Compose..."
docker compose up -d --build

echo "[INFO] Esperando a que el servicio esté listo..."
sleep 5

echo "[INFO] Abriendo SuckIt en el navegador..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000"
    else
        echo "Por favor, abre manualmente: http://localhost:3000"
    fi
else
    echo "Por favor, abre manualmente: http://localhost:3000"
fi

echo "==================================================="
echo "  ¡Listo! SuckIt está corriendo en segundo plano."
echo "  Para detener los contenedores, ejecuta:"
echo "    docker compose down"
echo "==================================================="
