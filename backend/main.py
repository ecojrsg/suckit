"""SuckIt Video Downloader — FastAPI backend.

Entry-point module that wires up the FastAPI application, CORS, background
task management (thread-pool downloads, auto-cleanup), and all API endpoints.

Run in development with::

    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from downloader import (
    DownloadError,
    GeoRestrictionError,
    UnsupportedURLError,
    download_video,
    extract_info,
)
from models import (
    DownloadRequest,
    DownloadStatus,
    HealthResponse,
    VideoInfoRequest,
    VideoInfoResponse,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DOWNLOAD_DIR = Path(os.getenv("SUCKIT_DOWNLOAD_DIR", "/tmp/suckit_downloads"))
MAX_CONCURRENT_DOWNLOADS: int = int(os.getenv("SUCKIT_MAX_CONCURRENT", "3"))
FILE_TTL_SECONDS: int = int(os.getenv("SUCKIT_FILE_TTL", str(30 * 60)))  # 30 min
CLEANUP_INTERVAL_SECONDS: int = 60  # check every minute

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger("suckit")

# ---------------------------------------------------------------------------
# In-memory task store
# ---------------------------------------------------------------------------

# task_id → mutable dict that mirrors DownloadStatus fields + extras.
_tasks: dict[str, dict[str, Any]] = {}

# Thread-pool for CPU/IO-bound yt-dlp work.
_executor = ThreadPoolExecutor(
    max_workers=MAX_CONCURRENT_DOWNLOADS,
    thread_name_prefix="dl",
)


def _active_download_count() -> int:
    """Return the number of tasks currently in *processing* state."""
    return sum(1 for t in _tasks.values() if t["status"] == "processing")


# ---------------------------------------------------------------------------
# Background download logic (runs in a worker thread)
# ---------------------------------------------------------------------------

def _run_download(task_id: str, url: str, format_id: str | None, quality: str, audio_format: str = "mp3") -> None:
    """Execute the download synchronously inside a thread-pool worker.

    Updates ``_tasks[task_id]`` in place so the status endpoint can read
    live progress.
    """
    task = _tasks[task_id]
    task["status"] = "processing"
    logger.info("Task %s: starting download — %s", task_id, url)

    def _on_progress(pct: float, msg: str) -> None:
        task["progress"] = round(pct, 1)

    try:
        result_path = download_video(
            url=url,
            format_id=format_id,
            quality=quality,
            audio_format=audio_format,
            output_dir=DOWNLOAD_DIR,
            progress_callback=_on_progress,
        )
        task["status"] = "completed"
        task["progress"] = 100.0
        task["file_path"] = str(result_path)
        task["completed_at"] = time.time()
        logger.info("Task %s: completed — %s", task_id, result_path.name)

    except (UnsupportedURLError, GeoRestrictionError, DownloadError) as exc:
        task["status"] = "failed"
        task["error"] = str(exc)
        logger.warning("Task %s: failed — %s", task_id, exc)

    except Exception as exc:  # noqa: BLE001
        task["status"] = "failed"
        task["error"] = f"Internal error: {exc}"
        logger.exception("Task %s: unexpected failure", task_id)


# ---------------------------------------------------------------------------
# Cleanup coroutine
# ---------------------------------------------------------------------------

async def _cleanup_loop() -> None:
    """Periodically delete downloaded files older than ``FILE_TTL_SECONDS``.

    Also prunes corresponding task entries once their files are gone.
    """
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
        now = time.time()
        stale_ids: list[str] = []

        for tid, task in list(_tasks.items()):
            completed_at = task.get("completed_at")
            if completed_at and (now - completed_at) > FILE_TTL_SECONDS:
                # Delete file if it still exists.
                fpath = task.get("file_path")
                if fpath:
                    try:
                        Path(fpath).unlink(missing_ok=True)
                        logger.info("Cleanup: deleted %s", fpath)
                    except OSError as exc:
                        logger.warning("Cleanup: could not delete %s — %s", fpath, exc)
                stale_ids.append(tid)

            # Also purge failed tasks after TTL so the dict doesn't grow forever.
            created_at = task.get("created_at", 0)
            if task["status"] == "failed" and (now - created_at) > FILE_TTL_SECONDS:
                stale_ids.append(tid)

        for tid in set(stale_ids):
            _tasks.pop(tid, None)

        if stale_ids:
            logger.info("Cleanup: pruned %d stale task(s)", len(set(stale_ids)))


# ---------------------------------------------------------------------------
# Lifespan (startup / shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def _lifespan(app: FastAPI):  # noqa: ANN001, ARG001
    """Application lifespan handler — start cleanup, shut down executor."""
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    cleanup_task = asyncio.create_task(_cleanup_loop())
    logger.info(
        "SuckIt backend started — downloads → %s, max concurrent = %d",
        DOWNLOAD_DIR,
        MAX_CONCURRENT_DOWNLOADS,
    )
    yield
    cleanup_task.cancel()
    _executor.shutdown(wait=False, cancel_futures=True)
    logger.info("SuckIt backend shut down")


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SuckIt Video Downloader API",
    version="0.1.0",
    description="Download videos from YouTube, TikTok, Instagram, and X/Twitter.",
    lifespan=_lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dev mode — lock down for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Return service health and concurrency stats."""
    return HealthResponse(
        status="ok",
        active_downloads=_active_download_count(),
        max_concurrent=MAX_CONCURRENT_DOWNLOADS,
    )


@app.post("/api/info", response_model=VideoInfoResponse, tags=["video"])
async def get_video_info(body: VideoInfoRequest) -> VideoInfoResponse:
    """Extract metadata (title, thumbnail, formats) from a video URL.

    This does **not** download the video — it only fetches metadata.
    """
    loop = asyncio.get_running_loop()
    try:
        info = await loop.run_in_executor(_executor, extract_info, body.url)
    except UnsupportedURLError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except GeoRestrictionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except DownloadError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return info


@app.post("/api/download", response_model=DownloadStatus, tags=["download"])
async def start_download(body: DownloadRequest) -> DownloadStatus:
    """Queue a new download.  Returns immediately with a ``task_id``.

    Poll ``GET /api/download/{task_id}/status`` for progress.
    """
    # Enforce concurrency limit.
    if _active_download_count() >= MAX_CONCURRENT_DOWNLOADS:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Too many concurrent downloads ({MAX_CONCURRENT_DOWNLOADS}). "
                "Please try again shortly."
            ),
        )

    task_id = uuid.uuid4().hex[:12]

    # Pre-populate task entry.
    _tasks[task_id] = {
        "task_id": task_id,
        "status": "pending",
        "progress": 0.0,
        "title": None,
        "error": None,
        "file_path": None,
        "created_at": time.time(),
        "completed_at": None,
    }

    # Fire-and-forget in the thread pool.
    _executor.submit(_run_download, task_id, body.url, body.format_id, body.quality, body.audio_format)

    logger.info("Task %s: queued download for %s", task_id, body.url)
    return DownloadStatus(**{k: _tasks[task_id][k] for k in DownloadStatus.model_fields})


@app.get("/api/download/{task_id}/status", response_model=DownloadStatus, tags=["download"])
async def download_status(task_id: str) -> DownloadStatus:
    """Check the progress of a download task."""
    task = _tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Unknown task: {task_id}")
    return DownloadStatus(**{k: task[k] for k in DownloadStatus.model_fields})


@app.get("/api/download/{task_id}/file", tags=["download"])
async def download_file(task_id: str) -> FileResponse:
    """Serve the downloaded file once the task has completed.

    Returns a ``FileResponse`` with ``Content-Disposition: attachment``.
    """
    task = _tasks.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Unknown task: {task_id}")

    if task["status"] != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Task is not completed (current status: {task['status']})",
        )

    file_path = Path(task["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=410, detail="File has been cleaned up.")

    return FileResponse(
        path=file_path,
        filename=file_path.name,
        media_type="application/octet-stream",
    )
