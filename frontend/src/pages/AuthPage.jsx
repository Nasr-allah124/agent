import { useState } from 'react';
import LoginForm from '../auth/components/LoginForm';
import SignupForm from '../auth/components/SignupForm';
import AuthIllustration from '../auth/components/AuthIllustration';
import ThemeToggle from '../landing_page/components/ui/ThemeToggle';
import LanguageSwitcher from '../landing_page/components/ui/LanguageSwitcher';

export default function AuthPage() {
  const [mode, setMode] = useState('login');

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      <AuthIllustration mode={mode} />

      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-background relative z-10">
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <LoginForm onSwitchToSignup={() => setMode('signup')} />
          ) : (
            <SignupForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}