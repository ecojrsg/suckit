"""Pydantic models and utilities for the SuckIt video downloader API.

This module defines all request/response schemas, platform detection,
and URL validation used across the application.
"""

from __future__ import annotations

import re
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Platform enum & detection
# ---------------------------------------------------------------------------

class Platform(str, Enum):
    """Supported video platforms."""

    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    OTHER = "other"


# Compiled once at module load for performance.
_PLATFORM_PATTERNS: list[tuple[re.Pattern[str], Platform]] = [
    (
        re.compile(
            r"https?://(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)/",
            re.IGNORECASE,
        ),
        Platform.YOUTUBE,
    ),
    (
        re.compile(
            r"https?://(?:www\.|vm\.|vt\.)?tiktok\.com/",
            re.IGNORECASE,
        ),
        Platform.TIKTOK,
    ),
    (
        re.compile(
            r"https?://(?:www\.)?instagram\.com/",
            re.IGNORECASE,
        ),
        Platform.INSTAGRAM,
    ),
    (
        re.compile(
            r"https?://(?:www\.)?(?:twitter\.com|x\.com)/",
            re.IGNORECASE,
        ),
        Platform.TWITTER,
    ),
]


def detect_platform(url: str) -> Platform:
    """Detect the video platform from a URL.

    Args:
        url: The video URL to classify.

    Returns:
        The matched ``Platform`` enum member, or ``Platform.OTHER`` if no
        known pattern matches.
    """
    for pattern, platform in _PLATFORM_PATTERNS:
        if pattern.search(url):
            return platform
    return Platform.OTHER


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class VideoInfoRequest(BaseModel):
    """Request body for the ``/api/info`` endpoint."""

    url: str = Field(
        ...,
        min_length=10,
        max_length=2048,
        description="URL of the video to extract information from.",
        examples=["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Ensure the URL looks like a valid HTTP(S) link."""
        v = v.strip()
        if not re.match(r"https?://", v, re.IGNORECASE):
            raise ValueError("URL must start with http:// or https://")
        # Very lightweight structure check – yt-dlp will do the real validation.
        if not re.match(
            r"https?://[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}",
            v,
            re.IGNORECASE,
        ):
            raise ValueError("URL does not appear to be a valid web address")
        return v


class DownloadRequest(BaseModel):
    """Request body for the ``/api/download`` endpoint."""

    url: str = Field(
        ...,
        min_length=10,
        max_length=2048,
        description="URL of the video to download.",
    )
    format_id: str | None = Field(
        default=None,
        description=(
            "yt-dlp format ID to download.  Leave ``None`` to auto-select "
            "the best available format."
        ),
    )
    quality: str = Field(
        default="best",
        description="Quality preset when ``format_id`` is not specified.",
    )
    audio_format: Literal["mp3", "m4a"] = Field(
        default="mp3",
        description="Target audio format when downloading audio-only (mp3 or m4a).",
    )

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        """Re-use the same URL validation logic."""
        return VideoInfoRequest.validate_url(v)


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class VideoFormat(BaseModel):
    """A single downloadable format reported by yt-dlp."""

    format_id: str = Field(..., description="yt-dlp format identifier.")
    ext: str = Field(..., description="File extension (e.g. mp4, webm).")
    quality: str = Field(
        ...,
        description="Human-readable quality label (e.g. '1080p', '720p').",
    )
    filesize: int | None = Field(
        default=None,
        description="Estimated file size in bytes, if available.",
    )
    has_video: bool = Field(..., description="Whether this format includes a video stream.")
    has_audio: bool = Field(..., description="Whether this format includes an audio stream.")


class VideoInfoResponse(BaseModel):
    """Response from the ``/api/info`` endpoint."""

    title: str = Field(..., description="Video title.")
    thumbnail: str | None = Field(
        default=None,
        description="URL to the video thumbnail image.",
    )
    duration: float | None = Field(
        default=None,
        description="Video duration in seconds.",
    )
    platform: Platform = Field(..., description="Detected platform.")
    formats: list[VideoFormat] = Field(
        default_factory=list,
        description="Available download formats.",
    )
    url: str = Field(..., description="Original URL that was queried.")


class DownloadStatus(BaseModel):
    """Status of an in-progress or completed download task."""

    task_id: str = Field(..., description="Unique task identifier.")
    status: Literal["pending", "processing", "completed", "failed"] = Field(
        ...,
        description="Current task state.",
    )
    progress: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Download progress percentage (0–100).",
    )
    title: str | None = Field(
        default=None,
        description="Video title, populated once metadata is fetched.",
    )
    error: str | None = Field(
        default=None,
        description="Error message if the task failed.",
    )


class HealthResponse(BaseModel):
    """Response from the ``/api/health`` endpoint."""

    status: str = "ok"
    active_downloads: int = Field(
        default=0,
        description="Number of currently running download tasks.",
    )
    max_concurrent: int = Field(
        default=3,
        description="Maximum allowed concurrent downloads.",
    )
