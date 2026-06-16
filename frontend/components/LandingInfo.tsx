'use client';

import PlatformIcon from './PlatformIcon';
import styles from './LandingInfo.module.css';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className={styles.featureCard} tabIndex={0}>
      <div className={styles.featureIconWrapper} aria-hidden="true">
        {icon}
      </div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </article>
  );
}

interface PlatformCardProps {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  name: string;
  urlLabel: string;
}

function PlatformCard({ platform, name, urlLabel }: PlatformCardProps) {
  return (
    <div 
      className={`${styles.platformCard} ${styles[platform]}`} 
      tabIndex={0} 
      role="group" 
      aria-label={`Plataforma soportada: ${name}`}
    >
      <div className={styles.platformIconContainer}>
        <PlatformIcon platform={platform} size={36} />
      </div>
      <span className={styles.platformName}>{name}</span>
      <span className={styles.platformBadge}>{urlLabel}</span>
    </div>
  );
}

export default function LandingInfo() {
  return (
    <section className={styles.landingSection} aria-label="Información sobre SuckIt">
      {/* --- QUICK START GUIDE (PASO A PASO) --- */}
      <div className={styles.guideContainer}>
        <h2 className={styles.sectionHeading}>
          ¿Cómo descargar en <span className="text-gradient">3 simples pasos</span>?
        </h2>
        <div className={styles.stepsGrid}>
          <div className={styles.stepCard} tabIndex={0}>
            <div className={styles.stepNumber}>01</div>
            <h3 className={styles.stepTitle}>Pega el enlace</h3>
            <p className={styles.stepText}>
              Copia la URL del video de tu plataforma favorita y pégala en la barra de búsqueda de arriba.
            </p>
          </div>
          
          <div className={styles.stepCard} tabIndex={0}>
            <div className={styles.stepNumber}>02</div>
            <h3 className={styles.stepTitle}>Elige la calidad</h3>
            <p className={styles.stepText}>
              Analizaremos el video al instante para ofrecerte formatos de video y audio en diferentes calidades.
            </p>
          </div>
          
          <div className={styles.stepCard} tabIndex={0}>
            <div className={styles.stepNumber}>03</div>
            <h3 className={styles.stepTitle}>Disfruta tu archivo</h3>
            <p className={styles.stepText}>
              Presiona &quot;Iniciar descarga&quot; y en segundos el archivo estará listo en tu carpeta de descargas.
            </p>
          </div>
        </div>
      </div>

      {/* --- FEATURES SECTION --- */}
      <div className={styles.featuresContainer}>
        <h2 className={styles.sectionHeading}>
          ¿Por qué usar <span className="text-gradient">SuckIt</span>?
        </h2>
        <p className={styles.sectionSubtitle}>
          La herramienta definitiva para tener tus contenidos multimedia favoritos siempre contigo, sin complicaciones.
        </p>
        
        <div className={styles.featuresGrid}>
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
            title="Velocidad Increíble"
            description="Procesamos tus videos al instante con motores de descarga optimizados para ofrecerte la mayor rapidez."
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            title="Seguridad y Privacidad"
            description="No guardamos registros de tus descargas ni solicitamos datos personales. Tu navegación está 100% protegida."
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Totalmente Libre de Anuncios"
            description="Sin ventanas emergentes intrusivas, trampas publicitarias ni malware. Una interfaz limpia y enfocada en lo que necesitas."
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
            title="Compatibilidad Total"
            description="Extrae contenido de las redes sociales más populares y descarga formatos compatibles con cualquier reproductor."
          />
        </div>
      </div>

      {/* --- PLATFORMS SECTION --- */}
      <div className={styles.platformsContainer}>
        <h2 className={styles.sectionHeading}>
          Plataformas <span className="text-gradient">Soportadas</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          SuckIt es compatible con los principales servicios de distribución y redes sociales de internet.
        </p>

        <div className={styles.platformsGrid}>
          <PlatformCard platform="youtube" name="YouTube" urlLabel="youtube.com" />
          <PlatformCard platform="tiktok" name="TikTok" urlLabel="tiktok.com" />
          <PlatformCard platform="instagram" name="Instagram" urlLabel="instagram.com" />
          <PlatformCard platform="twitter" name="X / Twitter" urlLabel="x.com" />
        </div>
        <div className={styles.platformFooter}>
          <span className={styles.additionalPlatformsBadge}>Y más de 1000 sitios web adicionales soportados de forma indirecta</span>
        </div>
      </div>
    </section>
  );
}
