import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(next);
    localStorage.setItem('docmind-lang', next);
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-purple-soft"
    >
      <Globe size={16} />
      <span>{i18n.language.toUpperCase()}</span>
      <ChevronDown size={14} />
    </button>
  );
}