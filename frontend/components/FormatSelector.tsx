'use client';

import { VideoFormat, formatFileSize } from '@/lib/types';
import styles from './FormatSelector.module.css';

interface FormatSelectorProps {
  formats: VideoFormat[];
  selectedFormatId: string;
  onSelect: (formatId: string) => void;
}

/** Group formats into meaningful categories for the user */
function categorizeFormats(formats: VideoFormat[]) {
  const videoFormats = formats
    .filter((f) => f.has_video)
    .sort((a, b) => {
      const qualityOrder = (q: string) => {
        const match = q.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      return qualityOrder(b.quality) - qualityOrder(a.quality);
    });

  const rawAudioFormats = formats
    .filter((f) => f.has_audio && !f.has_video)
    .sort((a, b) => (b.filesize || 0) - (a.filesize || 0));

  const virtualMp3: VideoFormat = {
    format_id: 'audio_only',
    ext: 'mp3',
    quality: 'Alta Calidad (192kbps)',
    filesize: null,
    has_video: false,
    has_audio: true,
  };

  const audioFormats = [virtualMp3, ...rawAudioFormats];

  return { videoFormats, audioFormats };
}

export default function FormatSelector({ formats, selectedFormatId, onSelect }: FormatSelectorProps) {
  const { videoFormats, audioFormats } = categorizeFormats(formats);

  return (
    <div className={styles.container}>
      {videoFormats.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </h3>
          <div className="pill-group">
            {videoFormats.map((f) => (
              <button
                key={f.format_id}
                onClick={() => onSelect(f.format_id)}
                className={`pill ${selectedFormatId === f.format_id ? 'active' : ''}`}
                aria-pressed={selectedFormatId === f.format_id}
              >
                <span className={styles.quality}>{f.quality}</span>
                <span className={styles.meta}>
                  {f.ext.toUpperCase()}
                  {f.filesize ? ` · ${formatFileSize(f.filesize)}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {audioFormats.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Audio
          </h3>
          <div className="pill-group">
            {audioFormats.map((f) => (
              <button
                key={f.format_id}
                onClick={() => onSelect(f.format_id)}
                className={`pill ${selectedFormatId === f.format_id ? 'active' : ''}`}
                aria-pressed={selectedFormatId === f.format_id}
              >
                <span className={styles.quality}>{f.ext.toUpperCase()}</span>
                <span className={styles.meta}>
                  {f.quality}
                  {f.filesize ? ` · ${formatFileSize(f.filesize)}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
