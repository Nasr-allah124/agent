import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Receipt,
  ArrowRight,
  LogOut,
  CheckCircle,
} from "lucide-react";
import AppLogo from "../landing_page/components/ui/AppLogo";
import ThemeToggle from "../landing_page/components/ui/ThemeToggle";
import LanguageSwitcher from "../landing_page/components/ui/LanguageSwitcher";
import { useAuth } from "../auth/components/AuthContext";

const agents = [
  {
    id: "resume",
    icon: Brain,
    color: "from-blue-500 to-primary",
    href: "/workspace/resume",
  },
  {
    id: "invoice",
    icon: Receipt,
    color: "from-violet-500 to-secondary",
    href: "/workspace/invoice",
  },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userFirstName = user?.full_name?.split(" ")[0] || "";
  const handleLogout = async () => {
  await logout();
  navigate("/connexion");
};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 lg:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppLogo size={32} />
          <span className="font-extrabold text-lg gradient-text">
            {t("brand")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground rounded-lg hover:bg-purple-soft transition-colors"
          >
            <LogOut size={16} />
            {t("Dashboard.logout")}
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-5xl mx-auto px-6 lg:px-10 py-16">
        <div className="text-center mb-14">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            {t("Dashboard.welcome", { name: userFirstName })}
          </h1>
          <p className="text-muted-foreground">{t("Dashboard.chooseAgent")}</p>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
  {agents.map((agent) => (
    <div
      key={agent.id}
      className="relative glass rounded-3xl border border-white/60 p-8 card-hover transition-all duration-500 overflow-hidden"
      style={{
        boxShadow:
          agent.id === "resume"
            ? "0 20px 60px rgba(59,130,246,.1)"
            : "0 20px 60px rgba(139,92,246,.1)",
      }}
    >
      {/* Background Glow */}
      <div
        className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{
          background:
            agent.id === "resume"
              ? "radial-gradient(circle, rgba(59,130,246,.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(139,92,246,.15) 0%, transparent 70%)",
        }}
      />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-soft rounded-full border border-primary/20 mb-6">
        <span className="text-xs font-semibold text-primary">
          {t(`Dashboard.agents.${agent.id}.badge`)}
        </span>
      </div>

      {/* Icon + Title */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg flex-shrink-0`}
        >
          <agent.icon size={26} className="text-white" />
        </div>

        <div>
          <h3 className="text-xl font-extrabold keyword-gradient mb-1">
            {t(`Dashboard.agents.${agent.id}.title`)}
          </h3>

          <p className="text-sm text-muted-foreground">
            {t(`Dashboard.agents.${agent.id}.subtitle`)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">
        {t(`Dashboard.agents.${agent.id}.description`)}
      </p>

      {/* Features */}
      <div className="flex flex-col gap-2 mb-7">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle size={14} className="text-success flex-shrink-0" />
            <span className="text-sm font-medium">
              {t(`Dashboard.agents.${agent.id}.features.${i}`)}
            </span>
          </div>
        ))}
      </div>

      {/* Bouton */}
      <button
        onClick={() => navigate(agent.href)}
        className={`inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r ${agent.color} rounded-2xl shadow-glow-purple hover:opacity-90 transition-all`}
      >
        {t("Dashboard.openAgent")}
        <ArrowRight size={16} />
      </button>
    </div>
  ))}
</div>
      </main>
    </div>
  );
}
