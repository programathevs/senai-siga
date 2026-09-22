import senaiLogo from "../../assets/senai-logo.jpg";

import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import axios from "axios";
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Headphones,
  LogIn,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Login.module.css";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Faz a mensagem de erro desaparecer automaticamente após 3 segundos
  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const user = await login({ email, password, remember });

      // Se for o primeiro acesso do usuário, obriga a troca de senha
      if (user.deve_trocar_senha) {
        navigate("/primeiro-acesso");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const errorMsg =
            err.response.data?.errors?.email?.[0] ||
            err.response.data?.message ||
            "E-mail ou senha incorretos. Por favor, verifique suas credenciais.";
          setErrorMessage(errorMsg);
        } else if (err.response?.status === 401) {
          setErrorMessage("E-mail ou senha incorretos. Por favor, verifique suas credenciais.");
        } else if (err.response?.status === 429) {
          setErrorMessage("Muitas tentativas de login consecutivas. Aguarde um minuto.");
        } else {
          setErrorMessage("E-mail ou senha incorretos. Por favor, verifique suas credenciais.");
        }
      } else {
        setErrorMessage("Não foi possível conectar ao servidor. Verifique sua conexão.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className={styles.bgDecoration} aria-hidden="true">
        <div className={`${styles.bgAmbientOrb} ${styles.bgAmbientOrbTopLeft}`}></div>
        <div className={`${styles.bgAmbientOrb} ${styles.bgAmbientOrbBottomRight}`}></div>
        <svg className={styles.bgDotPattern} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="dot-grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="#dcdcdc"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-pattern)"></rect>
        </svg>
      </div>

      <main className={styles.pageWrapper}>
        <div className={styles.loginContainer}>
          <article className={styles.loginCard}>
            {/* Cabeçalho */}
            <header className={styles.cardHeader}>
              <div className={styles.brandLogoWrapper}>
                <img
                  src={senaiLogo}
                  alt="Logo SENAI Oficial"
                  className={styles.brandLogo}
                  loading="lazy"
                />
              </div>

              <span className={styles.badgeCategory}>
                <span className={styles.badgeDot} aria-hidden="true"></span>
                Gestão Disciplinar &amp; Acompanhamento
              </span>

              <h1 className={styles.cardTitle}>Portal Disciplinar SENAI</h1>
              <p className={styles.cardSubtitle}>
                Entre com suas credenciais institucionais para continuar
              </p>
            </header>

            {/* Formulário */}
            <form
              className={styles.loginForm}
              id="senai-login-form"
              onSubmit={handleSubmit}
              method="POST"
            >
              {/* Campo E-mail */}
              <div className={styles.formGroup}>
                <div className={styles.formLabelWrapper}>
                  <label className={styles.formLabel} htmlFor="institutional-email">
                    E-mail Institucional
                  </label>
                  <span className={styles.formDomainHint}>@sp.senai.br</span>
                </div>

                <div className={styles.inputWrapper}>
                  <AtSign className={styles.inputIcon} size={18} aria-hidden="true" />
                  <input
                    className={styles.inputField}
                    id="institutional-email"
                    name="email"
                    type="email"
                    placeholder="exemplo@senai.br"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className={styles.formGroup}>
                <div className={styles.formLabelWrapper}>
                  <label className={styles.formLabel} htmlFor="institutional-password">
                    Senha de Acesso
                  </label>
                </div>

                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={18} aria-hidden="true" />
                  <input
                    className={`${styles.inputField} ${styles.inputFieldPassword}`}
                    id="institutional-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ocultar senha" : "Ver senha"}
                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Lembrar e Esqueci a senha */}
              <div className={styles.formActionsRow}>
                <label className={styles.rememberCheckboxLabel}>
                  <input
                    type="checkbox"
                    name="remember"
                    className={styles.customCheckbox}
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Lembrar de mim</span>
                </label>

                <Link to="/esqueci-senha" className={styles.forgotPasswordLink}>
                  Esqueci minha senha
                </Link>
              </div>

              {/* Alerta de Erro posicionado abaixo dos inputs */}
              {errorMessage && (
                <div className={styles.alertError} role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botão de Ação */}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className={styles.spinner} size={18} aria-hidden="true" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} aria-hidden="true" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>

            {/* Aviso Institucional de Segurança */}
            <footer className={styles.securityNoticeCard}>
              <div className={styles.securityHeader}>
                <div className={styles.securityBadgeItem}>
                  <ShieldCheck className={styles.securityIcon} size={18} aria-hidden="true" />
                  <span>Criptografia SSL 256-bit</span>
                </div>
                <span className={styles.versionTag}>v2.4 LTS</span>
              </div>
            </footer>
          </article>

          {/* Informações de Rodapé  */}
          <footer className={styles.pageFooter}>
            <div className={styles.supportChannel}>
              <Headphones size={16} aria-hidden="true" />
              <span>
                Suporte Técnico TI:{" "}
                <a href="https://github.com/programathevs" target="_blank" rel="noreferrer">
                  Profº Matheus Luiz
                </a>
              </span>
            </div>
            <p className={styles.copyrightText}>
              © 2026 SENAI Sumaré — Serviço Nacional de Aprendizagem Industrial. Todos os
              direitos reservados.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
