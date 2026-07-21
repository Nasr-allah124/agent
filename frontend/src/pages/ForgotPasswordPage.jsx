import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import AppLogo from '../landing_page/components/ui/AppLogo';
import { forgotPassword } from '../services/authService';

const API_URL = 'http://localhost:8020';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  try {
    await forgotPassword(email);
    setSent(true);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-3xl border border-border p-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5">
              <Mail size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t('forgotPassword.sentTitle')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('forgotPassword.sentSubtitle')}</p>
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              className="inline-block w-full py-3 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all"
            >
              {t('forgotPassword.enterCode')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <AppLogo size={36} />
          <span className="font-extrabold text-xl gradient-text">{t('brand')}</span>
        </div>

        <div className="glass rounded-3xl border border-border p-8">
          <h1 className="text-xl font-bold text-foreground mb-2 text-center">{t('forgotPassword.title')}</h1>
          <p className="text-sm text-muted-foreground mb-7 text-center">{t('forgotPassword.subtitle')}</p>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl mb-5 text-left">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-semibold text-foreground mb-2">{t('forgotPassword.emailLabel')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full px-4 py-3 bg-input border border-border rounded-xl outline-none focus:border-primary transition-colors mb-6 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('forgotPassword.sending')}
                </>
              ) : (
                t('forgotPassword.send')
              )}
            </button>
          </form>

          <Link to="/connexion" className="block mt-5 text-sm text-primary font-semibold hover:underline text-center">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}