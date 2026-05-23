'use client';

import { VideoInfo, formatDuration } from '@/lib/types';
import PlatformIcon from './PlatformIcon';
import styles from './VideoCard.module.css';

interface VideoCardProps {
  info: VideoInfo;
}

export default function VideoCard({ info }: VideoCardProps) {
  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.thumbnailWrapper}>
        {info.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={info.thumbnail}
            alt={info.title}
            className={styles.thumbnail}
            loading="eager"
          />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <PlatformIcon platform={info.platform} size={40} />
          </div>
        )}
        {info.duration && (
          <span className={styles.duration}>{formatDuration(info.duration)}</span>
        )}
      </div>

      <div className={styles.details}>
        <div className={styles.platformRow}>
          <PlatformIcon platform={info.platform} size={16} />
          <span className={styles.platformName}>
            {info.platform.charAt(0).toUpperCase() + info.platform.slice(1)}
          </span>
        </div>
        <h2 className={styles.title}>{info.title}</h2>
      </div>
    </div>
  );
}
