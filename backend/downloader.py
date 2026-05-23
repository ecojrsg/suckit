"""yt-dlp wrapper for video metadata extraction and downloading.

All interaction with yt-dlp happens through this module so the rest of the
application never imports ``yt_dlp`` directly.  This makes it easier to mock
in tests and to swap the download backend later if needed.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Callable

import yt_dlp

from models import Platform, VideoFormat, VideoInfoResponse, detect_platform

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared yt-dlp option helpers
# ---------------------------------------------------------------------------

# Maximum single-file size we allow (2 GiB).  yt-dlp will abort if exceeded.
_MAX_FILESIZE = 2 * 1024 * 1024 * 1024

_COMMON_OPTS: dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "no_color": True,
    "noplaylist": True,
    # Prefer mp4 container when merging separate video+audio streams.
    "merge_output_format": "mp4",
    # Use system FFmpeg.
    "ffmpeg_location": None,  # None → search $PATH
    # Safety limits
    "max_filesize": _MAX_FILESIZE,
    "socket_timeout": 30,
    "retries": 3,
    "fragment_retries": 3,
}


class DownloadError(Exception):
    """Raised when a download or metadata extraction fails."""


class UnsupportedURLError(DownloadError):
    """The URL is not supported by any yt-dlp extractor."""


class GeoRestrictionError(DownloadError):
    """The content is geo-restricted and cannot be accessed."""


# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

def extract_info(url: str) -> VideoInfoResponse:
    """Extract video metadata **without** downloading.

    Args:
        url: The video URL.

    Returns:
        A fully-populated ``VideoInfoResponse``.

    Raises:
        UnsupportedURLError: If yt-dlp has no extractor for the URL.
        GeoRestrictionError: If the video is geo-blocked.
        DownloadError: For any other yt-dlp error.
    """
    logger.info("Extracting metadata for URL: %s", url)
    opts: dict[str, Any] = {
        **_COMMON_OPTS,
        "skip_download": True,
        # We only want metadata – don't process anything.
        "extract_flat": False,
    }

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info: dict[str, Any] = ydl.extract_info(url, download=False) or {}
    except yt_dlp.utils.UnsupportedError as exc:
        raise UnsupportedURLError(f"URL not supported: {url}") from exc
    except yt_dlp.utils.GeoRestrictedError as exc:
        raise GeoRestrictionError(str(exc)) from exc
    except yt_dlp.utils.DownloadError as exc:
        raise DownloadError(str(exc)) from exc
    except Exception as exc:
        raise DownloadError(f"Unexpected error: {exc}") from exc

    platform = detect_platform(url)
    formats = parse_formats(info)

    return VideoInfoResponse(
        title=info.get("title", "Unknown"),
        thumbnail=info.get("thumbnail"),
        duration=info.get("duration"),
        platform=platform,
        formats=formats,
        url=url,
    )


# ---------------------------------------------------------------------------
# Format parsing
# ---------------------------------------------------------------------------

def _quality_label(fmt: dict[str, Any]) -> str:
    """Build a human-readable quality label for a single format dict.

    Args:
        fmt: A single format dictionary from yt-dlp's ``info_dict["formats"]``.

    Returns:
        A string like ``"1080p"``, ``"720p60"``, ``"audio only"``, etc.
    """
    height = fmt.get("height")
    fps = fmt.get("fps")

    if height:
        label = f"{height}p"
        if fps and fps > 30:
            label += str(int(fps))
        return label

    # Audio-only streams
    abr = fmt.get("abr") or fmt.get("tbr")
    if abr:
        return f"{int(abr)}kbps"

    return fmt.get("format_note", "unknown")


def parse_formats(info_dict: dict[str, Any]) -> list[VideoFormat]:
    """Parse the ``formats`` list from a yt-dlp info dict.

    Args:
        info_dict: The full info dict returned by ``yt_dlp.YoutubeDL.extract_info``.

    Returns:
        A list of ``VideoFormat`` objects sorted best-quality-first.
    """
    raw_formats: list[dict[str, Any]] = info_dict.get("formats") or []
    results: list[VideoFormat] = []

    for fmt in raw_formats:
        # Skip storyboard / manifest-only entries.
        if fmt.get("vcodec") == "none" and fmt.get("acodec") == "none":
            continue

        has_video = fmt.get("vcodec", "none") != "none"
        has_audio = fmt.get("acodec", "none") != "none"

        results.append(
            VideoFormat(
                format_id=str(fmt.get("format_id", "")),
                ext=fmt.get("ext", "mp4"),
                quality=_quality_label(fmt),
                filesize=fmt.get("filesize") or fmt.get("filesize_approx"),
                has_video=has_video,
                has_audio=has_audio,
            )
        )

    # Sort by height descending (video) then bitrate descending (audio).
    def _sort_key(vf: VideoFormat) -> tuple[int, int]:
        # Extract numeric height from quality label.
        match = __import__("re").match(r"(\d+)p", vf.quality)
        height = int(match.group(1)) if match else 0
        # Extract numeric bitrate from quality label.
        match_br = __import__("re").match(r"(\d+)kbps", vf.quality)
        bitrate = int(match_br.group(1)) if match_br else 0
        return (height, bitrate)

    results.sort(key=_sort_key, reverse=True)
    return results


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

ProgressCallback = Callable[[float, str], None]
"""Signature: ``(progress_pct: float, status_msg: str) -> None``."""


def _build_format_selector(
    format_id: str | None,
    quality: str,
) -> str:
    """Translate the API's quality preset into a yt-dlp format string.

    Args:
        format_id: Explicit format ID, or ``None`` to auto-select.
        quality: One of ``"best"``, ``"worst"``, ``"audio_only"``.

    Returns:
        A yt-dlp ``format`` selector string.
    """
    if format_id:
        return format_id

    match quality:
        case "best":
            return "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
        case "worst":
            return "worstvideo+worstaudio/worst"
        case "audio_only":
            return "bestaudio[ext=m4a]/bestaudio/best"
        case _:
            return "bestvideo+bestaudio/best"


def download_video(
    url: str,
    format_id: str | None = None,
    quality: str = "best",
    output_dir: str | Path = "/tmp/suckit_downloads",
    progress_callback: ProgressCallback | None = None,
) -> Path:
    """Download a video and return the path to the finished file.

    Args:
        url: The video URL.
        format_id: Optional explicit yt-dlp format ID.
        quality: Quality preset (``"best"``, ``"worst"``, ``"audio_only"``).
        output_dir: Directory to write the file into.
        progress_callback: Optional ``(progress_pct, status_msg)`` callable
            invoked as data arrives.

    Returns:
        ``Path`` to the downloaded file.

    Raises:
        UnsupportedURLError: If yt-dlp has no extractor for the URL.
        GeoRestrictionError: If the video is geo-blocked.
        DownloadError: For any other yt-dlp error (network, etc.).
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build the output template.  %(title)s is sanitised by yt-dlp.
    outtmpl = str(output_dir / "%(title).100B [%(id)s].%(ext)s")

    # Determine the format string and if it is audio-only
    is_audio_only = (quality == "audio_only")
    
    if format_id:
        # Extract info first to check format details
        opts_extract = {**_COMMON_OPTS, "skip_download": True}
        try:
            with yt_dlp.YoutubeDL(opts_extract) as ydl:
                info_dict = ydl.extract_info(url, download=False) or {}
            
            raw_formats = info_dict.get("formats", [])
            selected_fmt = next((f for f in raw_formats if str(f.get("format_id")) == format_id), None)
            
            if selected_fmt:
                has_vid = selected_fmt.get("vcodec", "none") != "none"
                has_aud = selected_fmt.get("acodec", "none") != "none"
                
                if has_vid and not has_aud:
                    # Video-only format: MUST merge with best audio
                    fmt_string = f"{format_id}+bestaudio/best"
                else:
                    # Combined or audio-only format
                    fmt_string = format_id
                    
                if has_aud and not has_vid:
                    is_audio_only = True
            else:
                fmt_string = format_id
        except Exception:
            # Fallback to direct format_id if extraction fails
            fmt_string = format_id
    else:
        fmt_string = _build_format_selector(None, quality)

    # Postprocessors: merge into mp4, embed thumbnail if available.
    postprocessors: list[dict[str, Any]] = [
        {
            "key": "FFmpegVideoConvertor",
            "preferedformat": "mp4",
        },
        {
            "key": "EmbedThumbnail",
            "already_have_thumbnail": False,
        },
    ]
    # If audio-only, convert to m4a instead of mp4.
    if is_audio_only:
        postprocessors = [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "m4a",
                "preferredquality": "192",
            }
        ]

    def _progress_hook(d: dict[str, Any]) -> None:
        """Forward yt-dlp progress events to our callback."""
        if progress_callback is None:
            return

        status = d.get("status", "")
        if status == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            if total > 0:
                pct = min(downloaded / total * 100, 99.9)
            else:
                pct = 0.0
            progress_callback(pct, "downloading")
        elif status == "finished":
            progress_callback(100.0, "finished")

    opts: dict[str, Any] = {
        **_COMMON_OPTS,
        "format": fmt_string,
        "outtmpl": outtmpl,
        "postprocessors": postprocessors,
        "progress_hooks": [_progress_hook],
        "writethumbnail": True,
        # Overwrite partial files from previous failed attempts.
        "overwrites": True,
    }

    downloaded_path: Path | None = None

    def _postprocessor_hook(d: dict[str, Any]) -> None:
        """Capture the final filepath after post-processing."""
        nonlocal downloaded_path
        if d.get("status") == "finished":
            filepath = d.get("info_dict", {}).get("filepath")
            if filepath:
                downloaded_path = Path(filepath)

    opts["postprocessor_hooks"] = [_postprocessor_hook]

    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True) or {}
    except yt_dlp.utils.UnsupportedError as exc:
        raise UnsupportedURLError(f"URL not supported: {url}") from exc
    except yt_dlp.utils.GeoRestrictedError as exc:
        raise GeoRestrictionError(str(exc)) from exc
    except yt_dlp.utils.DownloadError as exc:
        raise DownloadError(str(exc)) from exc
    except Exception as exc:
        raise DownloadError(f"Unexpected error: {exc}") from exc

    # Determine the output file path.
    if downloaded_path and downloaded_path.exists():
        return downloaded_path

    # Fallback: yt-dlp stores the prepared filename in info_dict.
    filepath = info.get("filepath") or info.get("requested_downloads", [{}])[0].get("filepath")
    if filepath:
        p = Path(filepath)
        if p.exists():
            return p

    # Last resort: glob the output directory for the file.
    video_id = info.get("id", "")
    if video_id:
        matches = list(output_dir.glob(f"*{video_id}*"))
        # Filter out thumbnail images.
        media = [m for m in matches if m.suffix.lower() in {".mp4", ".mkv", ".webm", ".m4a", ".mp3"}]
        if media:
            return media[0]

    raise DownloadError("Download appeared to succeed but the output file could not be located.")
