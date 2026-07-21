import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppLogo from "./ui/AppLogo";
import { Menu, X, ChevronDown, Globe, Moon, Sun } from "lucide-react";

const navKeys = ["features", "services", "how", "resources", "about"];

const navHrefs = {
  features: "#features",
  services: "#services",
  how: "#how-it-works",
  resources: "#faq",
  about: "#testimonials",
};

export default function LandingNav() {
  const { t, i18n } = useTranslation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("docmind-theme");
    const isDark = savedTheme ? savedTheme === "dark" : true;

    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleDark = () => {
    const next = !darkMode;

    setDarkMode(next);

    document.documentElement.classList.toggle("dark", next);

    localStorage.setItem("docmind-theme", next ? "dark" : "light");
  };

  const toggleLang = () => {
    const next = i18n.language === "fr" ? "en" : "fr";

    i18n.changeLanguage(next);

    localStorage.setItem("docmind-lang", next);
  };

  const headerClass =
    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 " +
    (scrolled ? "glass shadow-glass py-3" : "bg-transparent py-5");

  const sunClass =
    "absolute inset-0 flex items-center justify-center transition-all duration-300 " +
    (darkMode
      ? "opacity-100 rotate-0 scale-100"
      : "opacity-0 rotate-90 scale-50");

  const moonClass =
    "flex items-center justify-center transition-all duration-300 " +
    (darkMode
      ? "opacity-0 -rotate-90 scale-50"
      : "opacity-100 rotate-0 scale-100");

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 flex-shrink-0 whitespace-nowrap">
          <AppLogo size={36} />
          <span
  className="font-bold text-xl tracking-tight gradient-text whitespace-nowrap"
>
            {t("brand")}
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 justify-center gap-3">
          {navKeys.map((key) => (
            <a
              key={key}
              href={navHrefs[key]}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-purple-soft whitespace-nowrap"
            >
              {t(`nav.${key}`)}
            </a>
          ))}
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-purple-soft"
          >
            <Globe size={16} />
            <span>{i18n.language.toUpperCase()}</span>
            <ChevronDown size={14} />
          </button>

          {mounted && (
            <button
              onClick={toggleDark}
              className="relative p-2 text-muted-foreground hover:text-foreground transition-all duration-300 rounded-lg hover:bg-purple-soft overflow-hidden"
              aria-label="Changer le thème"
            >
              <span className={sunClass}>
                <Sun size={18} />
              </span>

              <span className={moonClass}>
                <Moon size={18} />
              </span>
            </button>
          )}

          <a
            href="/connexion"
            className="px-4 py-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            {t("Login")}
          </a>

          <a
            href="/connexion"
            className="px-5 py-2.5 text-sm font-semibold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-95"
          >
            {t("start")}
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-purple-soft transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
     {mobileOpen && (
  <div className="lg:hidden glass border-t border-border mt-1 px-6 py-4 flex flex-col gap-2 animate-fade-in">
    <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-purple-soft"
      >
        <Globe size={16} />
        <span>{i18n.language.toUpperCase()}</span>
        <ChevronDown size={14} />
      </button>

      {mounted && (
        <button
          onClick={toggleDark}
          className="relative p-2 text-muted-foreground hover:text-foreground transition-all duration-300 rounded-lg hover:bg-purple-soft overflow-hidden"
          aria-label="Changer le thème"
        >
          <span className={sunClass}>
            <Sun size={18} />
          </span>

          <span className={moonClass}>
            <Moon size={18} />
          </span>
        </button>
      )}
    </div>

    {navKeys.map((key) => (
      <a
        key={key}
        href={navHrefs[key]}
        className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-purple-soft rounded-lg transition-colors"
        onClick={() => setMobileOpen(false)}
      >
        {t(`nav.${key}`)}
      </a>
    ))}

    <div className="flex gap-3 pt-2">
      <a
        href="/connexion"
        className="flex-1 text-center px-4 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-purple-soft transition-colors"
      >
        {t("login")}
      </a>

      <a
        href="/connexion"
        className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-white gradient-bg rounded-xl"
      >
        {t("start")}
      </a>
    </div>
  </div>
)}
    </header>
  );
}
