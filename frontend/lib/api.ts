import { VideoInfo, DownloadStatus } from './types';

const API_BASE = '';

/**
 * Custom error class for API errors with status codes.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Helper to fetch with an explicit timeout to prevent UI hang deadlocks.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 25000 // 25 seconds (generous for yt-dlp metadata)
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'El servidor tardó demasiado en responder. Por favor, intenta de nuevo.');
    }
    throw err;
  }
}

/**
 * Fetch video metadata from a URL.
 * Returns title, thumbnail, available formats, duration, and detected platform.
 */
export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const response = await fetchWithTimeout(`${API_BASE}/api/info`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: 'Error desconocido del servidor' }));
    throw new ApiError(response.status, data.detail || 'No se pudo obtener la información del video');
  }

  return response.json();
}

/**
 * Start a video download.
 * Returns a task_id that can be used to poll for progress.
 */
export async function startDownload(
  url: string,
  formatId: string,
  quality: string
): Promise<{ task_id: string }> {
  const response = await fetchWithTimeout(`${API_BASE}/api/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, format_id: formatId, quality }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new ApiError(response.status, data.detail || 'No se pudo iniciar la descarga');
  }

  return response.json();
}

/**
 * Get the current status of a download task.
 * Poll this endpoint to track progress.
 */
export async function getDownloadStatus(taskId: string): Promise<DownloadStatus> {
  // Shorter timeout for polling status updates
  const response = await fetchWithTimeout(`${API_BASE}/api/download/${taskId}/status`, {}, 8000);

  if (!response.ok) {
    const data = await response.json().catch(() => ({ detail: 'Error al consultar estado' }));
    throw new ApiError(response.status, data.detail || 'No se pudo consultar el estado');
  }

  return response.json();
}

/**
 * Get the download URL for a completed task.
 * Returns the URL to directly download the file.
 */
export function getDownloadFileUrl(taskId: string): string {
  return `${API_BASE}/api/download/${taskId}/file`;
}
