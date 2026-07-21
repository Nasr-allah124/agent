import { useRef, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Brain,
  Receipt,
  ArrowRight,
  FileText,
  CheckCircle,
} from "lucide-react";

const services = [
  {
    id: "resume",
    icon: Brain,
    color: "from-blue-500 to-primary",
    bgGlow: "rgba(59, 130, 246, 0.1)",
    formats: ["PDF", "Word (.docx)"],
    featureCount: 5,
    href: "/connexion",
  },
  {
    id: "invoice",
    icon: Receipt,
    color: "from-violet-500 to-secondary",
    bgGlow: "rgba(139, 92, 246, 0.1)",
    formats: ["PDF", "Excel (.xlsx)", "CSV"],
    featureCount: 5,
    href: "/connexion",
  },
];

export default function ServiceSelection() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="services"
      className="py-24 px-6 lg:px-10 max-w-screen-2xl mx-auto"
    >
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-soft rounded-full border border-primary/20 mb-6">
          <Brain size={14} className="text-primary" />
          <span className="text-sm font-semibold text-primary">
            {t("services.badge")}
          </span>
        </div>
        <h2 className="text-section font-extrabold text-foreground mb-4">
          {t("services.titleLine1")}{" "}
          <span className="keyword-gradient">
            {t("services.titleHighlight")}
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t("services.subtitle1")}{" "}
          <span className="keyword-gradient font-semibold">
            {t("services.subtitleHighlight")}
          </span>{" "}
          {t("services.subtitle2")}
        </p>
      </div>

      <div
        ref={ref}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
      >
        {services.map((service, i) => (
          <div
            key={service.id}
            className={`relative glass rounded-3xl border border-white/60 p-8 card-hover transition-all duration-500 overflow-hidden ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{
              transitionDelay: `${i * 150}ms`,
              boxShadow: `0 20px 60px ${service.bgGlow}`,
            }}
          >
            {/* Background glow */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${service.bgGlow} 0%, transparent 70%)`,
              }}
            />

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-soft rounded-full border border-primary/20 mb-6">
              <span className="text-xs font-semibold text-primary">
                {t(`services.items.${service.id}.badge`)}
              </span>
            </div>

            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-5">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <service.icon size={26} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground keyword-gradient mb-1">
                  {t(`services.items.${service.id}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`services.items.${service.id}.subtitle`)}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t(`services.items.${service.id}.description`)}
            </p>

            {/* Features */}
            <div className="flex flex-col gap-2 mb-6">
              {Array.from({ length: service.featureCount }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    className="text-success flex-shrink-0"
                  />
                  <span className="text-sm text-foreground font-medium">
                    {t(`services.items.${service.id}.features.${idx}`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Supported formats */}
            <div className="mb-7">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {t("services.formatsLabel")}
              </p>
              <div className="flex flex-wrap gap-2">
                {service.formats.map((fmt) => (
                  <div
                    key={fmt}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border border-border"
                  >
                    <FileText size={12} className="text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      {fmt}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {/* CTA */}
            <a
              href={service.href}
              className={`inline-flex items-center gap-2 w-full justify-center px-6 py-3.5 text-sm font-bold text-white bg-gradient-to-r ${service.color} rounded-2xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-95`}
            >
              {t("services.openService")}
              <ArrowRight size={16} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
