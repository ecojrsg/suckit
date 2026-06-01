# Diseño de Instalación y Configuración Sencilla para SuckIt

Este documento define la arquitectura y el plan para facilitar la instalación de **SuckIt** de manera dual (Docker Express para usuarios generales y Entorno Local Automatizado para desarrolladores).

## 1. Objetivos

* **Facilidad extrema para usuarios generales:** Lanzar el proyecto completo con un solo clic si ya tienen Docker instalado.
* **Automatización para desarrolladores:** Automatizar los pasos complejos locales, especialmente la instalación de dependencias, entornos virtuales y la obtención de **FFmpeg** sin requerir que el usuario lo instale de manera manual en su sistema operativo global.
* **Multiplataforma nativa:** Soporte nativo para Windows (`.bat` / `.cmd` / PowerShell) y macOS/Linux (`.sh` / POSIX shell).

---

## 2. Arquitectura de los Scripts de Lanzamiento

Se añadirán los siguientes scripts en la raíz del proyecto:

### 2.1 Lanzador de Docker Express (`run.bat` y `run.sh`)
Diseñado para usuarios no técnicos que solo quieren usar el descargador.
* **Comprobaciones:**
  * Si `docker` y `docker compose` (o `docker-compose` v1) están en el PATH.
  * Si el demonio de Docker está levantado.
* **Ejecución:**
  * Lanza `docker compose up -d --build` para asegurar que las imágenes estén al día.
  * Espera a que el contenedor de Next.js (`frontend`) y FastAPI (`backend`) estén saludables (health check).
* **Navegador:**
  * Abre automáticamente la dirección `http://localhost:3000` en el navegador por defecto del sistema.

### 2.2 Lanzador del Entorno de Desarrollo Local (`setup.bat` y `setup.sh`)
Diseñado para desarrolladores o usuarios que no deseen/puedan correr Docker.
* **Requisitos:**
  * Verifica Node.js >= 20.
  * Verifica Python >= 3.12.
* **Instalación de FFmpeg Local (Cero configuración global):**
  * Descarga y extrae la versión estática oficial de FFmpeg para la plataforma actual.
  * Coloca los ejecutables directamente en la carpeta `backend/bin/`.
  * *Windows:* Descarga el zip oficial de Gyan.dev y lo extrae con PowerShell `Expand-Archive`.
  * *macOS/Linux:* Descarga desde compiles estáticos estables (por ejemplo, `johnvansickle.com` para Linux o binarios estáticos similares) y les da permisos de ejecución (`chmod +x`).
* **Instalación de Node.js:**
  * Corre `npm install` en la raíz y en la carpeta `frontend/`.
* **Entorno Virtual de Python:**
  * Crea `backend/.venv` e instala las dependencias de `requirements.txt`.
* **Archivos `.env` Iniciales:**
  * Genera las variables de entorno iniciales en caso de no existir.

---

## 3. Integración en el Backend

El módulo `downloader.py` se adaptará para priorizar y buscar dinámicamente un ejecutable de FFmpeg local antes de recurrir a la búsqueda en el PATH global del sistema operativo:

```python
import os
from pathlib import Path

# Buscar directorio de binarios locales en backend/bin/
_LOCAL_BIN = Path(__file__).parent / "bin"

if (_LOCAL_BIN / "ffmpeg").exists() or (_LOCAL_BIN / "ffmpeg.exe").exists():
    _FFMPEG_LOC = str(_LOCAL_BIN)
else:
    _FFMPEG_LOC = None  # Indica a yt-dlp que busque en el PATH global
```

En la configuración de `yt-dlp` (`_COMMON_OPTS`), se le asignará `"ffmpeg_location": _FFMPEG_LOC`.

---

## 4. Scripts Unificados de Ejecución Local

Para facilitar la ejecución de desarrollo local en paralelo:
1. Añadir scripts en el `package.json` de la raíz:
   - `"dev"`: Corre tanto el backend como el frontend de forma simultánea.
   - `"setup"`: Apunta al script nativo de configuración según la plataforma del usuario.
