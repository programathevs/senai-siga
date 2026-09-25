import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  ArrowRight,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import { useAuth, type User } from "../../contexts/AuthContext";
import senaiLogo from "../../assets/senai-logo.jpg";
import { ThemeToggle } from "../../components/ThemeToggle/ThemeToggle";
import styles from "./PrimeiroAcesso.module.css";

export function PrimeiroAcesso() {
  const { updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Critérios regimentais SENAI
  const hasMinLength = password.length >= 8;
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaMet = [hasMinLength, hasCase, hasNumber, hasSymbol].filter(Boolean).length;

  // Medidor de força
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

    if (criteriaMet < 4) {
      setErrorMessage("Por favor, atenda a todos os 4 critérios regimentais de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("As senhas digitadas não coincidem. Verifique os campos.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<{ message: string; user: User }>(
        "/api/first-access/update-password",
        {
          password,
          password_confirmation: passwordConfirmation,
        }
      );

      // Atualiza o estado da sessão local do usuário com o retorno da API
      updateUser(response.data.user);

      // Redireciona para o Dashboard liberado
      navigate("/");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const msg =
            err.response.data?.errors?.password?.[0] ||
            err.response.data?.message ||
            "Erro de validação ao salvar a senha.";
          setErrorMessage(msg);
        } else {
          setErrorMessage("Não foi possível atualizar a senha. Tente novamente.");
        }
      } else {
        setErrorMessage("Ocorreu um erro inesperado ao conectar com o servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelAndExit() {
    await logout();
    navigate("/login");
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
              id="dot-grid-pattern-primeiro"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="var(--color-dot-pattern)"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-pattern-primeiro)"></rect>
        </svg>
      </div>

      <main className={styles.pageWrapper}>


        {/* Conteúdo Central */}
        <div className={styles.contentCenter}>
          <div className={styles.containerBox}>
            <div className={styles.accessCard}>
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
                  Primeiro Acesso • Segurança
                </div>

                <h1 className={styles.cardTitle}>Bem-vindo! Crie sua nova senha</h1>
              </div>

              {/* Alerta de erro */}
              {errorMessage && (
                <div className={styles.errorAlert} role="alert">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Formulário de Criação de Senha */}
              <form className={styles.accessForm} onSubmit={handleSubmit} method="POST">
                {/* Campo 1: Nova Senha */}
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.fieldLabel} htmlFor="new-password">
                      Nova Senha
                    </label>
                    <span className={styles.requiredBadge}>Obrigatório</span>
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
                      disabled={isSubmitting}
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
                      <span className={styles.strengthLabel}>Força da senha:</span>
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
                        {passwordsMatch ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Senhas conferem</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={14} />
                            <span>Senhas não conferem</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className={styles.inputWrapper}>
                    <KeyRound className={styles.inputIcon} size={18} />
                    <input
                      id="confirm-password"
                      name="password_confirmation"
                      type={showConfirmPassword ? "text" : "password"}
                      className={styles.inputField}
                      placeholder="••••••••••••"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      required
                      disabled={isSubmitting}
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

                {/* Box de Critérios Regimentais */}
                <div className={styles.criteriaBox}>
                  <div className={styles.criteriaHeader}>
                    <span className={styles.criteriaTitle}>Critérios Regimentais de Segurança</span>
                    <span className={styles.criteriaCount}>{criteriaMet} de 4 cumpridos</span>
                  </div>

                  <ul className={styles.criteriaList}>
                    <li
                      className={`${styles.criteriaItem} ${hasMinLength ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasMinLength ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={16} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={16} />
                      )}
                      <span>Mínimo de 8 caracteres</span>
                    </li>
                    <li
                      className={`${styles.criteriaItem} ${hasCase ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasCase ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={16} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={16} />
                      )}
                      <span>Pelo menos uma letra maiúscula e minúscula</span>
                    </li>
                    <li
                      className={`${styles.criteriaItem} ${hasNumber ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasNumber ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={16} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={16} />
                      )}
                      <span>Pelo menos um número</span>
                    </li>
                    <li
                      className={`${styles.criteriaItem} ${hasSymbol ? styles.criteriaItemActive : ""
                        }`}
                    >
                      {hasSymbol ? (
                        <CheckCircle2 className={styles.criteriaIcon} size={16} />
                      ) : (
                        <Circle className={styles.criteriaIcon} size={16} />
                      )}
                      <span>Pelo menos um caractere especial (!@#$%^&*)</span>
                    </li>
                  </ul>
                </div>

                {/* Botões de Ação */}
                <div className={styles.btnGroup}>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting || criteriaMet < 4 || !passwordsMatch}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className={styles.spinner} size={18} />
                        <span>Salvando nova senha...</span>
                      </>
                    ) : (
                      <>
                        <span>Salvar nova senha e acessar</span>
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelAndExit}
                    className={styles.cancelBtn}
                    disabled={isSubmitting}
                  >
                    <LogOut size={16} />
                    <span>Cancelar e sair</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
