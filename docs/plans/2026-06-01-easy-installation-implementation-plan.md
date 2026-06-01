# Plan de Implementación de Instalación Sencilla

Este plan detalla los pasos para implementar el diseño de instalación fácil del proyecto **SuckIt**.

## Pasos de Implementación

### Paso 1: Modificar `backend/downloader.py`
* **Objetivo:** Permitir que `yt-dlp` detecte de manera dinámica la carpeta de binarios locales en `backend/bin/` y utilice la versión de FFmpeg de allí si existe.
* **Cambios:**
  - Importar `os` y `Path` de `pathlib`.
  - Crear la variable `_FFMPEG_LOC` que verifica la existencia de `backend/bin/ffmpeg` (o `ffmpeg.exe`).
  - Asignar `_FFMPEG_LOC` a la propiedad `ffmpeg_location` dentro de `_COMMON_OPTS`.

### Paso 2: Crear el Lanzador de Docker Express para Windows (`run.bat`)
* **Objetivo:** Proporcionar inicio con doble clic para Docker en Windows.
* **Acciones:**
  - Validar presencia de `docker` y de `docker compose`.
  - Verificar si el demonio de Docker está levantado.
  - Ejecutar `docker compose up -d --build`.
  - Abrir el navegador en `http://localhost:3000` automáticamente.

### Paso 3: Crear el Lanzador de Docker Express para macOS/Linux (`run.sh`)
* **Objetivo:** Proporcionar inicio de un solo comando en terminal Unix.
* **Acciones:**
  - Validar comandos de Docker.
  - Levantar contenedores.
  - Abrir el navegador según el SO del usuario (utilizando `open` o `xdg-open`).

### Paso 4: Crear el Instalador Local de Desarrollo para Windows (`setup.bat`)
* **Objetivo:** Configurar de forma totalmente desatendida el entorno en Windows.
* **Acciones:**
  - Validar Node.js >= 20 y Python >= 3.12.
  - Instalar dependencias del frontend (`npm install`).
  - Crear y configurar el entorno virtual de Python en `backend/.venv` e instalar dependencias.
  - Descargar automáticamente el binario estático oficial de FFmpeg para Windows (` Gyan.dev`), descomprimirlo en `backend/bin/` y limpiar los archivos temporales.
  - Crear archivos `.env` predeterminados.

### Paso 5: Crear el Instalador Local de Desarrollo para macOS/Linux (`setup.sh`)
* **Objetivo:** Configurar el entorno en Unix.
* **Acciones:**
  - Validar requisitos de sistema.
  - Descargar FFmpeg estático para Linux x86_64 o invocar Homebrew para macOS de manera automática.
  - Instalar dependencias del frontend y del backend.
  - Crear archivos `.env` predeterminados.
  - Aplicar permisos de ejecución (`chmod +x setup.sh run.sh`).

### Paso 6: Integrar Scripts en `package.json` de la Raíz
* **Objetivo:** Ofrecer comandos comunes sencillos en Node.js.
* **Acciones:**
  - Configurar `"scripts"` en el `package.json` de la raíz:
    - `"setup"`: Correr `setup.bat` o `setup.sh` según el sistema operativo detectado.
    - `"dev"`: Arrancar concurrentemente el frontend en `http://localhost:3000` y el backend en `http://localhost:8000` (usando dependencias ligeras o comandos simples de ejecución).

### Paso 7: Pruebas y Validación
* **Objetivo:** Validar que los scripts corren limpiamente en el entorno del usuario.
