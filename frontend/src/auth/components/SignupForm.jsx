import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppLogo from "../../landing_page/components/ui/AppLogo";
import { ArrowLeft } from "lucide-react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { signup } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export default function SignupForm({ onSwitchToLogin }) {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const optionStyle = {
    backgroundColor: isDark ? "#12101c" : "#ffffff",
    color: isDark ? "#f5f3ff" : "#16121f",
  };

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupError, setSignupError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const pw = watch("password");

  // adapte le chemin

  const onSubmit = async (formData) => {
    setSignupError("");
    setLoading(true);
    try {
      await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        company: formData.company,
        role: formData.role,
        password: formData.password,
      });
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err) {
      setSignupError(err.message || t("auth.signup.errors.genericError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">
          {t("auth.signup.successTitle")}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("auth.signup.successSubtitle")}
        </p>
        <button
          onClick={onSwitchToLogin}
          className="w-full py-3.5 text-sm font-bold text-white gradient-bg rounded-xl"
        >
          {t("auth.signup.goToSignIn")}
        </button>
      </div>
    );
  }

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
        {t("auth.signup.title")}
      </h1>
      <p className="text-sm text-muted-foreground mb-7">
        {t("auth.signup.haveAccount")}{" "}
        <button
          onClick={onSwitchToLogin}
          className="text-primary font-semibold hover:underline"
        >
          {t("auth.signup.signIn")}
        </button>
      </p>

      {signupError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-danger/10 border border-danger/20 rounded-xl mb-5">
          <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{signupError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {t("auth.signup.firstNameLabel")}
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                {...register("firstName", {
                  required: t("auth.signup.errors.required"),
                })}
                placeholder={t("auth.signup.firstNamePlaceholder")}
                className={`w-full pl-9 pr-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                  errors.firstName ? "border-danger" : "border-border"
                }`}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs text-danger mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {t("auth.signup.lastNameLabel")}
            </label>
            <input
              {...register("lastName", {
                required: t("auth.signup.errors.required"),
              })}
              placeholder={t("auth.signup.lastNamePlaceholder")}
              className={`w-full px-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                errors.lastName ? "border-danger" : "border-border"
              }`}
            />
            {errors.lastName && (
              <p className="text-xs text-danger mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {t("auth.signup.emailLabel")}
          </label>
          <div className="relative">
            <Mail
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              {...register("email", {
                required: t("auth.signup.errors.emailRequired"),
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: t("auth.signup.errors.emailInvalid"),
                },
              })}
              type="email"
              placeholder={t("auth.signup.emailPlaceholder")}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                errors.email ? "border-danger" : "border-border"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-danger mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {t("auth.signup.companyLabel")}
          </label>
          <div className="relative">
            <Building2
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              {...register("company", {
                required: t("auth.signup.errors.companyRequired"),
              })}
              placeholder={t("auth.signup.companyPlaceholder")}
              className={`w-full pl-9 pr-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                errors.company ? "border-danger" : "border-border"
              }`}
            />
          </div>
          {errors.company && (
            <p className="text-xs text-danger mt-1">{errors.company.message}</p>
          )}
        </div>

        <div>
          
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              {t("auth.signup.roleLabel")}
            </label>
            <select
              {...register("role", {
                required: t("auth.signup.errors.roleRequired"),
              })}
              className={`w-full px-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                errors.role ? "border-danger" : "border-border"
              }`}
            >
              <option value="" style={optionStyle}>
                {t("auth.signup.rolePlaceholder")}
              </option>
              <option value="hr-manager" style={optionStyle}>
                {t("auth.signup.roles.hrManager")}
              </option>
              <option value="talent-acquisition" style={optionStyle}>
                {t("auth.signup.roles.talentAcquisition")}
              </option>
              <option value="recruiter" style={optionStyle}>
                {t("auth.signup.roles.recruiter")}
              </option>
              <option value="hr-director" style={optionStyle}>
                {t("auth.signup.roles.hrDirector")}
              </option>
              <option value="founder" style={optionStyle}>
                {t("auth.signup.roles.founder")}
              </option>
              <option value="other" style={optionStyle}>
                {t("auth.signup.roles.other")}
              </option>
            </select>
            {errors.role && (
              <p className="text-xs text-danger mt-1">{errors.role.message}</p>
            )}
          </div>
          {errors.role && (
            <p className="text-xs text-danger mt-1">{errors.role.message}</p>
          )}
          {errors.role && (
            <p className="text-xs text-danger mt-1">{errors.role.message}</p>
          )}
          {errors.role && (
            <p className="text-xs text-danger mt-1">{errors.role.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {t("auth.signup.passwordLabel")}
          </label>
          <div className="relative">
            <Lock
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              {...register("password", {
                required: t("auth.signup.errors.passwordRequired"),
                minLength: {
                  value: 8,
                  message: t("auth.signup.errors.passwordMinLength"),
                },
              })}
              type={showPw ? "text" : "password"}
              placeholder={t("auth.signup.passwordPlaceholder")}
              className={`w-full pl-9 pr-10 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
                errors.password ? "border-danger" : "border-border"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Afficher/masquer le mot de passe"
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            {t("auth.signup.confirmPasswordLabel")}
          </label>
          <input
            {...register("confirmPassword", {
              required: t("auth.signup.errors.confirmRequired"),
              validate: (v) =>
                v === pw || t("auth.signup.errors.passwordsMismatch"),
            })}
            type="password"
            placeholder={t("auth.signup.confirmPasswordPlaceholder")}
            className={`w-full px-3 py-2.5 text-sm bg-input border rounded-xl outline-none focus:border-primary transition-colors ${
              errors.confirmPassword ? "border-danger" : "border-border"
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-danger mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            {...register("terms", {
              required: t("auth.signup.errors.termsRequired"),
            })}
            type="checkbox"
            id="terms"
            className="w-4 h-4 accent-primary rounded mt-0.5"
          />
          <label
            htmlFor="terms"
            className="text-xs text-muted-foreground leading-relaxed"
          >
            {t("auth.signup.agreeTerms")}{" "}
            <a href="#" className="text-primary hover:underline">
              {t("auth.signup.termsOfService")}
            </a>{" "}
            {t("auth.signup.and")}{" "}
            <a href="#" className="text-primary hover:underline">
              {t("auth.signup.privacyPolicy")}
            </a>
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-danger -mt-2">{errors.terms.message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 text-sm font-bold text-white gradient-bg rounded-xl shadow-glow-purple hover:opacity-90 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t("auth.signup.submitting")}
            </>
          ) : (
            t("auth.signup.submit")
          )}
        </button>
      </form>
    </div>
  );
}
