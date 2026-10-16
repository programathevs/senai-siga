import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import axios from "axios";
import {
  Lock,
  CheckCircle2,
  Circle,
  Timer,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import senaiLogo from "../../assets/senai-logo.jpg";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle";
import styles from "./RedefinirSenha.module.css";

export function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Simulação regressiva do tempo de validade do token (25 minutos)
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `Expira em ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} min`;

  // Critérios regimentais SENAI
  const hasMinLength = password.length >= 8;
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [hasMinLength, hasCase, hasNumber, hasSymbol].filter(Boolean).length;

  function getStrengthDetails() {
    if (password.length === 0) {
      return { text: "Não informada", color: "var(--color-text-secondary)" };
    }
    if (criteriaMet <= 1) {
      return { text: "Muito fraca", color: "var(--color-primary)" };
    }
    if (criteriaMet === 2) {
      return { text: "Fraca", color: "var(--color-primary)" };
    }
    if (criteriaMet === 3) {
      return { text: "Média", color: "var(--color-warning)" };
    }
    return { text: "Forte (Excelente)", color: "var(--color-success)" };
  }

  const strength = getStrengthDetails();
  const passwordsMatch = password.length > 0 && password === passwordConfirmation;
  const hasConfirmText = passwordConfirmation.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Token de recuperação ausente. Solicite um novo link por e-mail.");
      return;
    }

    if (criteriaMet < 4) {
      setErrorMessage("Por favor, atenda a todos os critérios regimentais de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("As senhas digitadas não coincidem. Verifique os campos.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Garante o cookie CSRF
      await api.get("/sanctum/csrf-cookie");

      // 2. Dispara a redefinição de senha para a API
      const response = await api.post<{ message: string }>("/api/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMessage(
        response.data.message || "Senha redefinida com sucesso! Redirecionando para o login..."
      );

      // Redireciona para o login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const msg =
            err.response.data?.errors?.password?.[0] ||
            err.response.data?.errors?.token?.[0] ||
            err.response.data?.message ||
            "Este link de recuperação é inválido ou já expirou.";
          setErrorMessage(msg);
        } else {
          setErrorMessage("Não foi possível redefinir a senha. Solicite um novo link.");
        }
      } else {
        setErrorMessage("Ocorreu um erro inesperado ao conectar com o servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ThemeToggle variant="floating" />

      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={`${styles.bgAmbientOrb} ${styles.bgAmbientOrbTopLeft}`}></div>
        <div className={`${styles.bgAmbientOrb} ${styles.bgAmbientOrbBottomRight}`}></div>
        <svg className={styles.bgDotPattern} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dot-grid-pattern-redefinir"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="var(--color-dot-pattern)"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-pattern-redefinir)"></rect>
        </svg>
      </div>

      <main className={styles.pageWrapper}>
        <div className={styles.contentCenter}>
          <div className={styles.containerBox}>

            {/* Card Principal */}
            <div className={styles.resetCard}>
              <div className={styles.cardAccentBar} />
              <div className={styles.headerArea}>
                <div className={styles.brandLogoWrapper}>
                  <img
                    src={senaiLogo}
                    alt="Logo SENAI Oficial"
                    className={styles.brandLogo}
                    loading="lazy"
                  />
                </div>

                <div className={styles.badgePill}>
                  <span className={styles.badgeDot} />
                  Redefinição de Senha • Link Autenticado
                </div>

                <h1 className={styles.cardTitle}>Crie uma nova senha</h1>
                <p className={styles.cardDescription}>
                  {email ? (
                    <>
                      Seu link de recuperação foi validado para a conta institucional docente/colaborador{" "}
                      <strong className={styles.targetEmailBadge}>{email}</strong>.
                      Cadastre sua nova credencial de acesso regulamentar abaixo.
                    </>
                  ) : (
                    "Informe sua nova credencial de acesso regulamentar abaixo para restaurar o seu acesso."
                  )}
                </p>

                <div className={styles.timerBadge}>
                  <Timer size={15} color="var(--color-primary)" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              {/* Alerta de Link Ausente/Inválido */}
              {!token && (
                <div className={styles.errorAlert} role="alert" style={{ marginBottom: "1rem" }}>
                  <AlertCircle size={18} />
                  <span>
                    Nenhum token foi detectado neste link. Solicite uma nova recuperação na página inicial.
                  </span>
                </div>
              )}

              {/* Alertas de Retorno da API */}
              {errorMessage && (
                <div className={styles.errorAlert} role="alert" style={{ marginBottom: "1rem" }}>
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className={styles.successAlert} role="status" style={{ marginBottom: "1rem" }}>
                  <CheckCircle2 size={18} />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Formulário de Redefinição */}
              <form className={styles.resetForm} onSubmit={handleSubmit} method="POST">
                {/* Campo 1: Nova Senha */}
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.fieldLabel} htmlFor="new-password">
                      Nova Senha
                    </label>
                    <span className={styles.fieldHint}>Mínimo 8 caracteres</span>
                  </div>

                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={18} />
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={styles.inputField}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting || !token || !!successMessage}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibilityBtn}
                      onClick={() => setShowPassword((prev) => !prev)}
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Medidor de Força */}
                  <div className={styles.strengthMeterBox}>
                    <div className={styles.strengthHeader}>
                      <span className={styles.strengthLabel}>Nível de segurança:</span>
                      <span className={styles.strengthValue} style={{ color: strength.color }}>
                        {strength.text}
                      </span>
                    </div>

                    <div className={styles.strengthBars}>
                      <div
                        className={styles.strengthBar}
                        style={{
                          backgroundColor:
                            criteriaMet >= 1
                              ? criteriaMet <= 2
                                ? "var(--color-primary)"
                                : criteriaMet === 3
                                  ? "var(--color-warning)"
                                  : "var(--color-success)"
                              : undefined,
                        }}
                      />
                      <div
                        className={styles.strengthBar}
                        style={{
                          backgroundColor:
                            criteriaMet >= 2
                              ? criteriaMet === 2
                                ? "var(--color-primary)"
                                : criteriaMet === 3
                                  ? "var(--color-warning)"
                                  : "var(--color-success)"
                              : undefined,
                        }}
                      />
                      <div
                        className={styles.strengthBar}
                        style={{
                          backgroundColor:
                            criteriaMet >= 3
                              ? criteriaMet === 3
                                ? "var(--color-warning)"
                                : "var(--color-success)"
                              : undefined,
                        }}
                      />
                      <div
                        className={styles.strengthBar}
                        style={{
                          backgroundColor: criteriaMet === 4 ? "var(--color-success)" : undefined,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Campo 2: Confirmar Nova Senha */}
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.fieldLabel} htmlFor="confirm-password">
                      Confirmar Nova Senha
                    </label>
                    {hasConfirmText && (
                      <span
                        className={
                          passwordsMatch ? styles.matchStatusValid : styles.matchStatusInvalid
                        }
                      >
                        {passwordsMatch ? "✓ Senhas coincidem" : "✕ Senhas não coincidem"}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputWrapper}>
                    <ShieldCheck className={styles.inputIcon} size={18} />
                    <input
                      id="confirm-password"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.inputField}
                      placeholder="••••••••••••"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      disabled={isSubmitting || !token || !!successMessage}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibilityBtn}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Requisitos Regimentais Checklist */}
                <div className={styles.criteriaBox}>
                  <div className={styles.criteriaHeader}>
                    <Shield size={14} />
                    <span>Requisitos Regimentais de Segurança (SENAI)</span>
                  </div>

                  <div className={styles.criteriaGrid}>
                    <div
                      className={`${styles.criteriaItem} ${hasMinLength ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasMinLength ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={15} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={15} />
                      )}
                      <span>Mínimo de 8 caracteres</span>
                    </div>
                    <div
                      className={`${styles.criteriaItem} ${hasCase ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasCase ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={15} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={15} />
                      )}
                      <span>Maiúscula e minúscula</span>
                    </div>
                    <div
                      className={`${styles.criteriaItem} ${hasNumber ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasNumber ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={15} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={15} />
                      )}
                      <span>Pelo menos um número</span>
                    </div>
                    <div
                      className={`${styles.criteriaItem} ${hasSymbol ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasSymbol ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={15} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={15} />
                      )}
                      <span>Caractere especial (!@#$%)</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className={styles.btnGroup}>
                  <button
                    type="submit"
                    className={`${styles.submitBtn} ${successMessage ? styles.submitBtnSuccess : ""
                      }`}
                    disabled={
                      isSubmitting ||
                      !token ||
                      criteriaMet < 4 ||
                      !passwordsMatch ||
                      !!successMessage
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />
                        <span>Atualizando credencial...</span>
                      </>
                    ) : successMessage ? (
                      <>
                        <CheckCircle2 size={18} />
                        <span>Senha atualizada com sucesso!</span>
                      </>
                    ) : (
                      <>
                        <span>Redefinir senha e entrar</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <Link to="/login" className={styles.cancelLink}>
                    <ArrowLeft size={16} />
                    <span>Cancelar e voltar ao login</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
