import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle, Zap, FileText, TrendingUp } from 'lucide-react';
import HeroDashboardCard from './HeroDashboardCard';

const animatedWordKeys = ['analyze', 'understand', 'discover', 'automate', 'explore'];

const stats = [
  { icon: Zap, valueKey: 'stat1Value', labelKey: 'stat1Label' },
  { icon: FileText, valueKey: 'stat2Value', labelKey: 'stat2Label' },
  { icon: TrendingUp, valueKey: 'stat3Value', labelKey: 'stat3Label' },
];

export default function HeroSection() {
  const { t } = useTranslation();
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);

      setTimeout(() => {
        setWordIndex((i) => (i + 1) % animatedWordKeys.length);
        setVisible(true);
      }, 300);

    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center w-full">

        {/* LEFT */}
        <div className="flex flex-col gap-8">

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-soft rounded-full border border-primary/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />

            <span className="text-sm font-semibold text-primary">
              <span className="keyword-gradient font-bold">
                {t('hero.badgeAi')}
              </span>{' '}
              {t('hero.badgeText')}
            </span>
          </div>

          <div>
            <h1 className="text-hero font-extrabold leading-tight tracking-tight text-foreground">
              {t('hero.titleLine1')}{' '}
              <span className="keyword-gradient">
                {t('hero.titleDocuments')}
              </span>

              <br />

              {t('hero.titleWith')}{' '}

              <span
                className={`keyword-gradient transition-all duration-300 ${
                  visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-2'
                }`}
                style={{ display: 'inline-block' }}
              >
                {t(`hero.words.${animatedWordKeys[wordIndex]}`)}
              </span>

              <br />

              <span className="gradient-text">
                {t('hero.titlePoweredByAi')}
              </span>
            </h1>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {t('hero.description1')}{' '}
            <span className="keyword-gradient font-semibold">
              {t('hero.badgeAi')}
            </span>{' '}
            {t('hero.description2')}
          </p>

          {/* Bouton */}
          <div className="flex flex-wrap gap-4">
            <a
              href="/connexion"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-bold text-white gradient-bg rounded-2xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-95"
            >
              {t('start')}
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              {t('hero.check1')}
            </p>

            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle size={16} className="text-success" />
              {t('hero.check2')}
            </p>
          </div>

          <div className="flex items-center gap-8 pt-2">
            {stats.map((stat) => (
              <div
                key={stat.labelKey}
                className="flex flex-col"
              >
                <div className="flex items-center gap-1.5">
                  <stat.icon
                    size={16}
                    className="text-primary"
                  />

                  <span className="text-2xl font-extrabold keyword-gradient tabular-nums">
                    {t(`hero.${stat.valueKey}`)}
                  </span>
                </div>

                <span className="text-xs text-muted-foreground font-medium">
                  {t(`hero.${stat.labelKey}`)}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT */}
        <div className="relative hidden xl:flex items-center justify-center">
          <HeroDashboardCard />
        </div>

      </div>
    </section>
  );
}