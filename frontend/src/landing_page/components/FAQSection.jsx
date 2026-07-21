import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const faqIds = ['formats', 'documentTypes', 'privacy', 'chat', 'compare', 'accuracy', 'export'];

export default function FAQSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState('formats');

  return (
    <section id="faq" className="py-24 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-section font-extrabold text-foreground mb-4">
          {t('faq.titleLine1')}{' '}
          <span className="keyword-gradient">{t('faq.titleHighlight')}</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          {t('faq.subtitle1')}{' '}
          <span className="keyword-gradient font-semibold">{t('faq.subtitleHighlight')}</span>.
        </p>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col gap-3">
        {faqIds.map((id) => (
          <div
            key={id}
            className={`glass rounded-2xl border transition-all duration-200 overflow-hidden ${
              open === id ? 'border-primary/30 shadow-glow-purple' : 'border-border'
            }`}
          >
            <button
              onClick={() => setOpen(open === id ? null : id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-sm font-bold text-foreground pr-4">
                {t(`faq.items.${id}.q`)}
              </span>
              <ChevronDown
                size={18}
                className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                  open === id ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open === id && (
              <div className="px-6 pb-5 animate-fade-in">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`faq.items.${id}.a`)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}