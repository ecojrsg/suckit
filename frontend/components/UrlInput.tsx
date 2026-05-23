'use client';

import { useState, useRef, useEffect } from 'react';
import { detectPlatform, Platform } from '@/lib/types';
import PlatformIcon from './PlatformIcon';
import styles from './UrlInput.module.css';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function UrlInput({ onSubmit, isLoading, disabled }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (url.length > 8) {
      const detected = detectPlatform(url);
      setPlatform(detected !== 'other' ? detected : null);
    } else {
      setPlatform(null);
    }
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading && !disabled) {
      onSubmit(url.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        const detected = detectPlatform(text);
        if (detected !== 'other') {
          setPlatform(detected);
        }
      }
    } catch {
      // Clipboard API not available or permission denied
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={`${styles.inputWrapper} ${isFocused ? styles.focused : ''}`}>
        {platform && (
          <div className={styles.platformBadge}>
            <PlatformIcon platform={platform} size={18} />
          </div>
        )}
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Pega el link del video aquí..."
          className={`${styles.input} ${platform ? styles.withPlatform : ''}`}
          disabled={disabled || isLoading}
          autoComplete="off"
          spellCheck="false"
          aria-label="URL del video"
          id="url-input"
        />
        {url && !isLoading && (
          <button
            type="button"
            onClick={() => { setUrl(''); setPlatform(null); inputRef.current?.focus(); }}
            className={styles.clearBtn}
            aria-label="Limpiar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        {!url && (
          <button
            type="button"
            onClick={handlePaste}
            className={styles.pasteBtn}
            aria-label="Pegar desde portapapeles"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Pegar</span>
          </button>
        )}
      </div>

      <button
        type="submit"
        className={`btn btn-primary btn-lg ${styles.submitBtn}`}
        disabled={!url.trim() || isLoading || disabled}
        id="submit-btn"
      >
        {isLoading ? (
          <>
            <span className={styles.spinner} />
            Analizando...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Descargar
          </>
        )}
      </button>
    </form>
  );
}
