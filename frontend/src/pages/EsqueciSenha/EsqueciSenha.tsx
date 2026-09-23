import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  AtSign,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  MailCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import senaiLogo from "../../assets/senai-logo.jpg";
import styles from "./EsqueciSenha.module.css";

export function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Validador simples de e-mail institucional para acionar o indicador visual
  const isEmailValid = email.includes("@") && email.includes(".");

  // Temporizador para controle de intervalo de reenvio (60s)
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || isSubmitting || cooldown > 0) return;

    setIsSubmitting(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      // 1. Garante o cookie CSRF para segurança da requisição
      await api.get("/sanctum/csrf-cookie");

      // 2. Dispara a solicitação do link para o backend PHP
      const response = await api.post<{ message: string }>("/api/forgot-password", {
        email,
      });

      setStatus("success");
      setStatusMessage(response.data.message || "Enviamos o link de recuperação para o seu e-mail.");
      setCooldown(60);
    } catch (err: unknown) {
      setStatus("error");
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 422) {
          const msg =
            err.response.data?.errors?.email?.[0] ||
            err.response.data?.message ||
            "Não encontramos nenhum usuário com este endereço de e-mail.";
          setStatusMessage(msg);
        } else {
          setStatusMessage("Não foi possível processar o envio. Verifique o e-mail ou tente mais tarde.");
        }
      } else {
        setStatusMessage("Ocorreu um erro inesperado ao conectar com o servidor.");
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
              id="dot-grid-pattern-esqueci"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="var(--color-dot-pattern)"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid-pattern-esqueci)"></rect>
        </svg>
      </div>

      <main className={styles.pageWrapper}>

        {/* Área Central / Card de Recuperação */}
        <div className={styles.contentCenter}>
          <div className={styles.containerBox}>
            <div className={styles.recoveryCard}>
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
                  Recuperação de Acesso
                </div>

                <h1 className={styles.cardTitle}>Esqueceu sua senha?</h1>
                <p className={styles.cardDescription}>
                  Digite o e-mail associado à sua conta institucional e enviaremos um link seguro para redefinir sua senha.
                </p>
              </div>


              {status === "success" && (
                <div className={styles.statusBannerSuccess}>
                  <div style={{ display: "flex", marginTop: "2px" }}>
                    <MailCheck size={20} />
                  </div>
                  <div>
                    <p className={styles.bannerTitle}>E-mail enviado com sucesso!</p>
                    <p className={styles.bannerDesc}>
                      {statusMessage} Um link seguro foi despachado para <strong>{email}</strong>. Verifique sua caixa de entrada e pasta de spam.
                    </p>
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className={styles.statusBannerError}>
                  <div style={{ display: "flex", marginTop: "2px" }}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <p className={styles.bannerTitle}>Atenção</p>
                    <p className={styles.bannerDesc}>{statusMessage}</p>
                  </div>
                </div>
              )}

              {/* Formulário de Envio */}
              <form className={styles.recoveryForm} onSubmit={handleSubmit} method="POST">
                <div className={styles.fieldGroup}>
                  <div className={styles.labelRow}>
                    <label className={styles.fieldLabel} htmlFor="recovery-email">
                      E-mail Institucional
                    </label>
                    <span className={styles.domainHint}>@sp.senai.br</span>
                  </div>

                  <div className={styles.inputWrapper}>
                    <AtSign className={styles.inputIcon} size={18} />
                    <input
                      id="recovery-email"
                      name="email"
                      type="email"
                      className={styles.inputField}
                      placeholder="seu.email@senai.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isSubmitting || cooldown > 0}
                      autoComplete="email"
                    />
                    {isEmailValid && (
                      <CheckCircle2 className={styles.validIndicator} size={18} />
                    )}
                  </div>

                  <span className={styles.fieldHint}>
                    {cooldown > 0
                      ? `Aguarde ${cooldown}s para solicitar um novo envio caso não tenha recebido.`
                      : "Utilize sua credencial cadastrada na rede corporativa ou acadêmica."}
                  </span>
                </div>

                {/* Botão de Envio / Reenvio */}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={isSubmitting || (status === "success" && cooldown > 0)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className={styles.spinner} size={18} />
                      <span>Enviando link...</span>
                    </>
                  ) : status === "success" ? (
                    <>
                      <RotateCw size={18} />
                      <span>{cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar instruções"}</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar link de recuperação</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* Link de Retorno ao Login */}
                <div className={styles.backLinkWrapper}>
                  <Link to="/login" className={styles.backLink}>
                    <ArrowLeft size={16} />
                    <span>Voltar para o login</span>
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
