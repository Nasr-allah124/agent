import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ShieldCheck, Layers, MessageSquareText, Gauge, History } from 'lucide-react';

const features = [
  { id: 'search', icon: Search },
  { id: 'security', icon: ShieldCheck },
  { id: 'formats', icon: Layers },
  { id: 'chat', icon: MessageSquareText },
  { id: 'speed', icon: Gauge },
  { id: 'history', icon: History },
];

export default function FeaturesSection() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-24 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-soft rounded-full border border-primary/20 mb-6">
          <Layers size={14} className="text-primary" />
          <span className="text-sm font-semibold text-primary">{t('features.badge')}</span>
        </div>
        <h2 className="text-section font-extrabold text-foreground mb-4">
          {t('features.titleLine1')}{' '}
          <span className="keyword-gradient">{t('features.titleHighlight')}</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('features.subtitle')}
        </p>
      </div>

      <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {features.map((feature, i) => (
          <div
            key={feature.id}
            className={`glass rounded-2xl border border-border p-6 card-hover transition-all duration-500 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-5 shadow-glow-purple">
              <feature.icon size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t(`features.items.${feature.id}.title`)}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(`features.items.${feature.id}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}