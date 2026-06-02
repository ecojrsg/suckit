#!/bin/bash
set -e

echo "==================================================="
echo "  SuckIt Video Downloader - Local Developer Setup"
echo "==================================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[INFO] Node.js no está instalado en tu sistema."
    echo "[INFO] Intentando instalar Node.js automáticamente..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "[INFO] Ejecutando: brew install node..."
            brew install node
        else
            echo "[ERROR] Homebrew no está instalado. Instala Node.js manualmente desde: https://nodejs.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            echo "[INFO] Ejecutando: sudo apt-get update && sudo apt-get install -y nodejs npm..."
            sudo apt-get update && sudo apt-get install -y nodejs npm
        else
            echo "[ERROR] Gestor de paquetes no soportado. Instala Node.js manualmente desde: https://nodejs.org/"
            exit 1
        fi
    else
        echo "[ERROR] Sistema operativo no soportado para instalación automática de Node.js."
        exit 1
    fi
fi

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "[INFO] Python 3 no está instalado en tu sistema."
    echo "[INFO] Intentando instalar Python 3 automáticamente..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            echo "[INFO] Ejecutando: brew install python..."
            brew install python
            PYTHON_CMD=python3
        else
            echo "[ERROR] Homebrew no está instalado. Instala Python manualmente desde: https://www.python.org/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            echo "[INFO] Ejecutando: sudo apt-get update && sudo apt-get install -y python3 python3-venv python3-pip..."
            sudo apt-get update && sudo apt-get install -y python3 python3-venv python3-pip
            PYTHON_CMD=python3
        else
            echo "[ERROR] Gestor de paquetes no soportado. Instala Python manualmente desde: https://www.python.org/"
            exit 1
        fi
    else
        echo "[ERROR] Sistema operativo no soportado para instalación automática de Python."
        exit 1
    fi
fi

# Check dependencies
echo "[INFO] Instalando dependencias del Frontend y de la Raíz..."
npm install
cd frontend
npm install
cd ..

echo "[INFO] Instalando dependencias del Backend..."
cd backend
if [ ! -d ".venv" ]; then
    echo "[INFO] Creando entorno virtual de Python (.venv)..."
    $PYTHON_CMD -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Verify FFmpeg
echo "[INFO] Verificando FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "[INFO] Se detectó FFmpeg instalado globalmente en el sistema."
else
    if [ -f "backend/bin/ffmpeg" ]; then
        echo "[INFO] Se detectó FFmpeg local en backend/bin/"
    else
        echo "[INFO] FFmpeg no fue detectado en el sistema."
        mkdir -p backend/bin
        
        # Check OS type for downloading
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Check architecture
            ARCH=$(uname -m)
            if [[ "$ARCH" == "x86_64" ]]; then
                echo "[INFO] Descargando compilación estática de FFmpeg para Linux x86_64..."
                FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz"
                curl -L -o backend/bin/ffmpeg.tar.xz "$FFMPEG_URL"
                tar -xf backend/bin/ffmpeg.tar.xz -C backend/bin --strip-components=1
                # Clean extra files, keep only ffmpeg and ffprobe
                find backend/bin -type f -not -name 'ffmpeg' -not -name 'ffprobe' -delete 2>/dev/null || true
                rm -f backend/bin/ffmpeg.tar.xz
                chmod +x backend/bin/ffmpeg backend/bin/ffprobe
                echo "[INFO] FFmpeg instalado correctamente en backend/bin/"
            else
                echo "[WARNING] No se encontró una compilación automatizada para tu arquitectura ($ARCH)."
                echo "Por favor, instala FFmpeg usando tu gestor de paquetes:"
                echo "  sudo apt-get install ffmpeg"
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "[INFO] Detectado macOS. Se recomienda instalar FFmpeg usando Homebrew."
            if command -v brew &> /dev/null; then
                echo "[INFO] Ejecutando: brew install ffmpeg..."
                brew install ffmpeg || echo "[WARNING] No se pudo instalar FFmpeg mediante Homebrew automáticamente. Por favor, hazlo manualmente."
            else
                echo "[WARNING] Homebrew no está instalado. Por favor, instala FFmpeg manualmente o mediante Homebrew: https://brew.sh/"
            fi
        else
            echo "[WARNING] Sistema operativo no soportado para descarga automática de FFmpeg."
            echo "Por favor, instala FFmpeg manualmente en tu sistema."
        fi
    fi
fi

# Environment files
echo "[INFO] Generando archivos .env iniciales..."
if [ ! -f ".env" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env
fi
if [ ! -f "frontend/.env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
fi
if [ ! -f "backend/.env" ]; then
    echo "SUCKIT_DOWNLOAD_DIR=downloads" > backend/.env
    echo "SUCKIT_MAX_CONCURRENT=3" >> backend/.env
    echo "SUCKIT_FILE_TTL=1800" >> backend/.env
fi

echo "==================================================="
echo "  ¡Configuración Completada con Éxito!"
echo "==================================================="
echo ""
read -p "¿Deseas iniciar la aplicación en modo desarrollo ahora mismo? (S/N) [S]: " START_APP
START_APP=${START_APP:-S}
if [[ "$START_APP" =~ ^[Ss]$ ]]; then
    echo "[INFO] Iniciando aplicación..."
    npm run dev
else
    echo "[INFO] Puedes iniciar la aplicación más tarde ejecutando: npm run dev"
fi
