'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import UrlInput from '@/components/UrlInput';
import VideoCard from '@/components/VideoCard';
import FormatSelector from '@/components/FormatSelector';
import DownloadButton from '@/components/DownloadButton';
import ToastContainer, { showToast } from '@/components/Toast';
import LandingInfo from '@/components/LandingInfo';
import { fetchVideoInfo, startDownload } from '@/lib/api';
import { VideoInfo } from '@/lib/types';
import styles from './page.module.css';

type AppState = 'idle' | 'loading-info' | 'ready' | 'downloading' | 'completed';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  const handleUrlSubmit = useCallback(async (url: string) => {
    setState('loading-info');
    setVideoInfo(null);
    setSelectedFormat('');
    setTaskId(null);
    setCurrentUrl(url);

    try {
      const info = await fetchVideoInfo(url);
      setVideoInfo(info);
      // Auto-select best video format
      const bestVideo = info.formats.find((f) => f.has_video);
      if (bestVideo) {
        setSelectedFormat(bestVideo.format_id);
      }
      setState('ready');
    } catch (err) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'No se pudo obtener la información del video';
      showToast('error', message);
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!currentUrl || !selectedFormat) return;

    setState('downloading');
    try {
      const selected = videoInfo?.formats.find(f => f.format_id === selectedFormat);
      const result = await startDownload(currentUrl, selectedFormat, selected?.quality || 'best');
      setTaskId(result.task_id);
    } catch (err) {
      setState('ready');
      const message = err instanceof Error ? err.message : 'No se pudo iniciar la descarga';
      showToast('error', message);
    }
  }, [currentUrl, selectedFormat, videoInfo]);

  const handleDownloadComplete = useCallback(() => {
    setState('completed');
    showToast('success', '¡Descarga completada!');
  }, []);

  const handleDownloadError = useCallback((error: string) => {
    setState('ready');
    showToast('error', error);
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setVideoInfo(null);
    setSelectedFormat('');
    setTaskId(null);
    setCurrentUrl('');
  }, []);

  return (
    <>
      <div className="aurora-blob blob-primary" aria-hidden="true" />
      <div className="aurora-blob blob-secondary" aria-hidden="true" />
      <div className="aurora-blob blob-tertiary" aria-hidden="true" />
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Hero */}
          <section className={styles.hero}>
            <h1 className={styles.title}>
              Descarga videos de{' '}
              <span className="text-gradient">cualquier plataforma</span>
            </h1>
            <p className={styles.subtitle}>
              YouTube, TikTok, Instagram, X y más. Pega el link y listo.
            </p>
          </section>

          {/* URL Input */}
          <section className={styles.inputSection}>
            <UrlInput
              onSubmit={handleUrlSubmit}
              isLoading={state === 'loading-info'}
              disabled={state === 'downloading'}
            />
          </section>

          {/* Results */}
          {videoInfo && (
            <section className={styles.resultsSection}>
              <VideoCard info={videoInfo} />

              <div className={styles.formatSection}>
                <FormatSelector
                  formats={videoInfo.formats}
                  selectedFormatId={selectedFormat}
                  onSelect={setSelectedFormat}
                />

                {state === 'ready' && (
                  <button
                    onClick={handleDownload}
                    className={`btn btn-primary btn-lg ${styles.startDownload}`}
                    disabled={!selectedFormat}
                    id="start-download-btn"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Iniciar descarga
                  </button>
                )}

                {(state === 'downloading' || state === 'completed') && (
                  <DownloadButton
                    taskId={taskId}
                    onComplete={handleDownloadComplete}
                    onError={handleDownloadError}
                  />
                )}
              </div>
            </section>
          )}

          {/* Reset button when video loaded */}
          {videoInfo && state !== 'downloading' && (
            <button onClick={handleReset} className={styles.resetBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Descargar otro video
            </button>
          )}

          {/* Landing Info Section */}
          <LandingInfo />
        </div>
      </main>
      <ToastContainer />
    </>
  );
}
