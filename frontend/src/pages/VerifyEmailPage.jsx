import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import AppLogo from '../landing_page/components/ui/AppLogo';

const API_URL = 'http://localhost:8020';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputsRef = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('verifyEmail.incompleteCode'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t('verifyEmail.genericError'));
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || t('verifyEmail.genericError'));
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="glass rounded-3xl border border-border p-8">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t('verifyEmail.successTitle')}</h1>
            <p className="text-sm text-muted-foreground mb-6">{t('verifyEmail.successSubtitle')}</p>
            <Link
              to="/connexion"
              className="inline-block w-full py-3 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all"
            >
              {t('verifyEmail.goToLogin')}
            </Link>
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

        <div className="glass rounded-3xl border border-border p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-2">{t('verifyEmail.title')}</h1>
          <p className="text-sm text-muted-foreground mb-7">
            {t('verifyEmail.subtitle')} <span className="font-semibold text-foreground">{email}</span>
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl mb-5 text-left">
              <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-7">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-input border border-border rounded-xl outline-none focus:border-primary transition-colors"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('verifyEmail.verifying')}
                </>
              ) : (
                t('verifyEmail.verify')
              )}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={resending}
            className="mt-5 text-sm text-primary font-semibold hover:underline disabled:opacity-50"
          >
            {resending ? t('verifyEmail.resending') : t('verifyEmail.resendCode')}
          </button>
        </div>
      </div>
    </div>
  );
}