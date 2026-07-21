import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Database, BrainCircuit, MessagesSquare } from 'lucide-react';

const steps = [
  { id: 'upload', icon: UploadCloud },
  { id: 'vectorize', icon: Database },
  { id: 'analyze', icon: BrainCircuit },
  { id: 'chat', icon: MessagesSquare },
];

export default function HowItWorksSection() {
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
    <section id="how-it-works" className="py-24 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-soft rounded-full border border-primary/20 mb-6">
          <BrainCircuit size={14} className="text-primary" />
          <span className="text-sm font-semibold text-primary">{t('howItWorks.badge')}</span>
        </div>
        <h2 className="text-section font-extrabold text-foreground mb-4">
          {t('howItWorks.titleLine1')}{' '}
          <span className="keyword-gradient">{t('howItWorks.titleHighlight')}</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('howItWorks.subtitle')}
        </p>
      </div>

      <div ref={ref} className="relative max-w-5xl mx-auto">
        {/* Ligne de connexion horizontale (desktop uniquement) */}
        <div className="hidden lg:block absolute top-8 left-0 right-0 h-0.5 bg-border" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`relative flex flex-col items-center text-center transition-all duration-500 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="relative z-10 w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-glow-purple mb-5">
                <step.icon size={28} className="text-white" />
              </div>
              <span className="text-xs font-bold text-primary tracking-wider mb-2">
                {t('howItWorks.stepLabel')} {i + 1}
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {t(`howItWorks.steps.${step.id}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t(`howItWorks.steps.${step.id}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}