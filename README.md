# SuckIt — Descargador de Videos Multi-Plataforma

Aplicación web minimalista para descargar videos de YouTube, TikTok, Instagram, X y más de 1000 plataformas.

## 🚀 Inicio Rápido

### Requisitos
- [Docker](https://docs.docker.com/get-docker/) y Docker Compose
- O para desarrollo local: Node.js 20+ y Python 3.12+

### Con Docker (Producción)
```bash
docker compose up --build
```
La app estará disponible en `http://localhost:3000`

### Desarrollo Local

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

> ⚠️ El backend requiere [FFmpeg](https://ffmpeg.org/) instalado y en el PATH del sistema.

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

Uso personal. Consulta las leyes locales sobre descarga de contenido protegido.
