import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppLogo from "../../landing_page/components/ui/AppLogo";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { login } from "../../services/authService";
import { useAuth } from "./AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';

export default function LoginForm({ onSwitchToSignup }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setAuthError("");
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/");
    } catch (err) {
      setAuthError(err.message || t("auth.login.errors.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate("/")}
        className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        {t("Auth.signup.backToHome")}
      </button>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <AppLogo size={32} />
        <span className="font-extrabold text-xl gradient-text">
          {t("brand")}
        </span>
      </div>

      <h1 className="text-2xl font-extrabold text-foreground mb-1">
        {t("auth.login.title")}
      </h1>
      <p className="text-sm text-muted-foreground mb-7">
        {t("auth.login.noAccount")}{" "}
        <button
          onClick={onSwitchToSignup}
          className="text-primary font-semibold hover:underline"
        >
          {t("auth.login.createOne")}
        </button>
      </p>

      {authError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl mb-5">
          <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">
            {t("auth.login.emailLabel")}
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              {...register("email", {
                required: t("auth.login.errors.emailRequired"),
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: t("auth.login.errors.emailInvalid"),
                },
              })}
              type="email"
              placeholder={t("auth.login.emailPlaceholder")}
              className={`w-full pl-10 pr-4 py-3 text-sm bg-input border rounded-xl outline-none transition-colors focus:border-primary ${
                errors.email ? "border-danger" : "border-border"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-danger mt-1.5">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-foreground">
              {t("auth.login.passwordLabel")}
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary font-semibold hover:underline"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              {...register("password", {
                required: t("auth.login.errors.passwordRequired"),
                minLength: {
                  value: 6,
                  message: t("auth.login.errors.passwordMinLength"),
                },
              })}
              type={showPw ? "text" : "password"}
              placeholder={t("auth.login.passwordPlaceholder")}
              className={`w-full pl-10 pr-11 py-3 text-sm bg-input border rounded-xl outline-none transition-colors focus:border-primary ${
                errors.password ? "border-danger" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={
                showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger mt-1.5">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register("remember")}
            type="checkbox"
            id="remember"
            className="w-4 h-4 accent-primary rounded"
          />
          <label
            htmlFor="remember"
            className="text-sm text-muted-foreground font-medium"
          >
            {t("auth.login.rememberMe")}
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </button>
      </form>
    </div>
  );
}
