import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Sparkles, Users, Building2 } from 'lucide-react';

const stats = [
  { id: 'agents', icon: Sparkles },
  { id: 'formats', icon: Building2 },
  { id: 'accuracy', icon: Target },
  { id: 'focus', icon: Users },
];

export default function AboutSection() {
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
    <section id="testimonials" className="py-24 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* LEFT — Texte */}
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-soft rounded-full border border-primary/20 w-fit">
            <Building2 size={14} className="text-primary" />
            <span className="text-sm font-semibold text-primary">{t('about.badge')}</span>
          </div>

          <h2 className="text-section font-extrabold text-foreground">
            {t('about.titleLine1')}{' '}
            <span className="keyword-gradient">{t('about.titleHighlight')}</span>
          </h2>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {t('about.paragraph1')}
          </p>

          <p className="text-base text-muted-foreground leading-relaxed">
            {t('about.paragraph2')}{' '}
            <span className="keyword-gradient font-semibold">{t('about.paragraph2Highlight')}</span>
            {' '}{t('about.paragraph3')}
          </p>
        </div>

        {/* RIGHT — Stats card */}
        <div
          ref={ref}
          className="glass rounded-3xl border border-border p-8 shadow-glow-purple"
        >
          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, i) => (
              <div
                key={stat.id}
                className={`flex flex-col gap-3 p-5 rounded-2xl bg-purple-soft transition-all duration-500 ${
                  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 120}ms` }}
              >
                <div className="w-11 h-11 rounded-xl gradient-bg flex items-center justify-center shadow-glow-purple">
                  <stat.icon size={20} className="text-white" />
                </div>
                <span className="text-2xl font-extrabold keyword-gradient">
                  {t(`about.stats.${stat.id}.value`)}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  {t(`about.stats.${stat.id}.label`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}