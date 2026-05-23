/** Platform identifiers for supported video sources */
export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'other';

/** Available video/audio formats */
export interface VideoFormat {
  format_id: string;
  ext: string;
  quality: string;
  filesize: number | null;
  has_video: boolean;
  has_audio: boolean;
}

/** Video metadata response from the backend */
export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: number | null;
  platform: Platform;
  formats: VideoFormat[];
  url: string;
}

/** Download task status */
export type DownloadStatusType = 'pending' | 'processing' | 'completed' | 'failed';

/** Download status response from the backend */
export interface DownloadStatus {
  task_id: string;
  status: DownloadStatusType;
  progress: number;
  title: string | null;
  error: string | null;
}

/** Toast notification types */
export type ToastType = 'success' | 'error' | 'info';

/** Toast notification */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

/**
 * Detect the platform from a URL string.
 * Returns a platform identifier for icon/color display.
 */
export function detectPlatform(url: string): Platform {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
    if (hostname.includes('tiktok.com')) return 'tiktok';
    if (hostname.includes('instagram.com')) return 'instagram';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    return 'other';
  } catch {
    return 'other';
  }
}

/**
 * Format file size from bytes to human-readable string.
 */
export function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return 'Unknown';
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS string.
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
