# SuckIt — Descargador de Videos Multi-Plataforma

Aplicación web minimalista para descargar videos de YouTube, TikTok, Instagram, X y más de 1000 plataformas.

## 🚀 Inicio Rápido

SuckIt está diseñado para ser extremadamente fácil de instalar y ejecutar, ofreciendo dos caminos adaptados a tus necesidades.

---

### Camino A: Con Docker (Un solo clic - Recomendado para usuarios)

Este camino ejecuta la aplicación completa en contenedores aislados. **No requiere tener Node.js ni Python instalados en tu computadora.** Solo necesitas tener Docker activo.

* **Windows:**
  Haz doble clic en el archivo **`run.bat`** en la raíz del proyecto.
* **macOS / Linux:**
  Abre una terminal en la raíz del proyecto y ejecuta:
  ```bash
  ./run.sh
  ```

*La aplicación se compilará y abrirá automáticamente en tu navegador en `http://localhost:3000`.*

---

### Camino B: Instalación Local (Desarrollo y personalización)

Si eres desarrollador o prefieres ejecutar el proyecto directamente en tu sistema físico, puedes usar los scripts de configuración totalmente automatizados. 

Estos scripts **hacen todo el trabajo sucio por ti**:
1. Comprueban si tienes Node.js (>=20) y Python (>=3.12). Si no los tienes, **los instalan automáticamente** usando gestores oficiales (`winget` en Windows, `brew` en macOS o `apt` en Linux).
2. Instalan todas las dependencias de Node.js tanto en la raíz como en el frontend.
3. Crean el entorno virtual de Python (`.venv`) e instalan sus dependencias de forma robusta.
4. **Descargan FFmpeg de forma interna** en la carpeta local `backend/bin/` (evitando que tengas que instalarlo en tu sistema y configurar variables globales).
5. **Autogeneran todos los archivos `.env` necesarios** con valores de desarrollo seguros.
6. Te ofrecen iniciar la aplicación de forma interactiva e inmediata en modo desarrollo.

#### Cómo ejecutarlo:
* **Windows:**
  Haz doble clic en **`setup.bat`** (o ejecuta `npm run setup` en tu terminal).
* **macOS / Linux:**
  Ejecuta `chmod +x setup.sh && ./setup.sh` (o ejecuta `npm run setup` en tu terminal).

#### Ejecución Manual posterior:
Una vez configurado, si deseas iniciar manualmente el entorno de desarrollo local (Frontend + Backend en paralelo), simplemente ejecuta en la raíz:
```bash
npm run dev
```

*El frontend estará disponible en `http://localhost:3000` y la API del backend en `http://localhost:8000`.*

## 📦 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, TypeScript, Vanilla CSS |
| Backend | FastAPI, Python 3.12 |
| Motor de Descarga | yt-dlp + FFmpeg |
| Contenedores | Docker Compose |

## 🏗️ Arquitectura

```
Usuario → Next.js (3000) → FastAPI (8000) → yt-dlp → Archivo → Usuario
```

1. El usuario pega un URL
2. El frontend envía el URL al backend para obtener metadata
3. El usuario selecciona formato y calidad
4. El backend descarga el video con yt-dlp
5. El usuario descarga el archivo procesado
6. Los archivos se eliminan automáticamente después de 30 minutos

## 📁 Estructura

```
├── frontend/          # Next.js App
│   ├── app/           # Páginas y layouts
│   ├── components/    # Componentes React
│   ├── lib/           # Utilidades y API client
│   └── Dockerfile
├── backend/           # FastAPI API
│   ├── main.py        # Endpoints
│   ├── downloader.py  # yt-dlp wrapper
│   ├── models.py      # Schemas Pydantic
│   └── Dockerfile
└── docker-compose.yml
```

## 📝 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para obtener más detalles.
