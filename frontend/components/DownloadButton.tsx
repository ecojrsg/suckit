'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getDownloadStatus, getDownloadFileUrl } from '@/lib/api';
import { DownloadStatusType } from '@/lib/types';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  taskId: string | null;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function DownloadButton({ taskId, onComplete, onError }: DownloadButtonProps) {
  const [status, setStatus] = useState<DownloadStatusType>('pending');
  const [progress, setProgress] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!taskId) return;

    setStatus('pending');
    setProgress(0);

    const poll = async () => {
      try {
        const data = await getDownloadStatus(taskId);
        setStatus(data.status);
        setProgress(data.progress);

        if (data.status === 'completed') {
          stopPolling();
          // Auto-trigger download
          const url = getDownloadFileUrl(taskId);
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          onComplete?.();
        } else if (data.status === 'failed') {
          stopPolling();
          onError?.(data.error || 'Download failed');
        }
      } catch (err) {
        stopPolling();
        onError?.(err instanceof Error ? err.message : 'Connection error');
      }
    };

    // Poll immediately, then every second
    poll();
    pollRef.current = setInterval(poll, 1000);

    return stopPolling;
  }, [taskId, onComplete, onError, stopPolling]);

  if (!taskId) return null;

  return (
    <div className={styles.container}>
      {(status === 'pending' || status === 'processing') && (
        <div className={styles.progressSection}>
          <div className={styles.statusRow}>
            <span className={styles.statusText}>
              {status === 'pending' ? 'Preparando...' : 'Descargando...'}
            </span>
            <span className={styles.percentage}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {status === 'completed' && (
        <a
          href={getDownloadFileUrl(taskId)}
          download
          className={`btn btn-primary btn-lg ${styles.downloadReady}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Descargar de nuevo
        </a>
      )}

      {status === 'failed' && (
        <div className={styles.error}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          Error en la descarga
        </div>
      )}
    </div>
  );
}
