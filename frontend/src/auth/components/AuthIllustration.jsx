import AppLogo from '../../landing_page/components/ui/AppLogo';
import { useTranslation } from 'react-i18next';
import { Brain, Star, Users, Zap } from 'lucide-react';

export default function AuthIllustration({ mode }) {
  const { t } = useTranslation();

  const floatingStats = [
    { id: 'stat-score', icon: Star, label: t('auth.illustration.stats.matchScore'), value: '96%', color: 'text-yellow-400' },
    { id: 'stat-cvs', icon: Brain, label: t('auth.illustration.stats.cvsAnalyzed'), value: '2 agents', color: 'text-primary' },
    { id: 'stat-companies', icon: Users, label: t('auth.illustration.stats.companies'), value: '4 formats', color: 'text-violet-400' },
    { id: 'stat-faster', icon: Zap, label: t('auth.illustration.stats.fasterHiring'), value: '10x', color: 'text-green-400' },
  ];

  return (
    <div
      className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden flex-col items-center justify-center p-12"
      style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f3e 40%, #0d1a3e 100%)' }}
    >
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6c63ff 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #4f8bff 0%, transparent 70%)', filter: 'blur(60px)' }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="absolute top-8 left-8 flex items-center gap-2">
        <AppLogo size={32} />
        <span className="font-extrabold text-lg text-white">{t('brand')}</span>
      </div>

      <div className="relative z-10 text-center mb-10">
        <h2 className="text-4xl font-extrabold text-white mb-3 leading-tight">
          {mode === 'login' ? t('auth.illustration.loginTitle') : t('auth.illustration.signupTitle')}
        </h2>
        <p className="text-base text-white/60 max-w-sm mx-auto">
          {mode === 'login' ? t('auth.illustration.loginSubtitle') : t('auth.illustration.signupSubtitle')}
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-sm">
        {floatingStats.map((stat) => (
          <div
            key={stat.id}
            className="p-4 rounded-2xl border border-white/10 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}
          >
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
              <stat.icon size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-white/50 font-medium">{stat.label}</p>
              <p className={`text-lg font-extrabold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="absolute bottom-8 text-sm text-white/40 italic max-w-xs text-center">
        « {t('auth.illustration.quote')} »
        <br />
        <span className="not-italic font-semibold text-white/60">{t('auth.illustration.quoteAuthor')}</span>
      </p>
    </div>
  );
}
