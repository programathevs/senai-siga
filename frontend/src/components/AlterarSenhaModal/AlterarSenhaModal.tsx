import { useState, type FormEvent } from "react";
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import axios from "axios";
import styles from "./AlterarSenhaModal.module.css";

interface AlterarSenhaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlterarSenhaModal({ isOpen, onClose }: AlterarSenhaModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const hasMinLength = password.length >= 8;
  const hasCase = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const criteriaMet = [hasMinLength, hasCase, hasNumber, hasSymbol].filter(Boolean).length;

  const passwordsMatch = password.length > 0 && password === passwordConfirmation;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (criteriaMet < 4) {
      setErrorMessage("Por favor, atenda a todos os critérios regimentais de segurança.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("A nova senha e a confirmação não coincidem.");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post("/api/first-access/update-password", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMessage("Senha alterada com sucesso!");
      setTimeout(() => {
        onClose();
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
        setSuccessMessage("");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          err.response?.data?.errors?.password?.[0] ||
          err.response?.data?.message ||
          "Erro ao alterar a senha. Verifique a senha atual e tente novamente.";
        setErrorMessage(msg);
      } else {
        setErrorMessage("Erro inesperado ao conectar com o servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Alterar Senha de Acesso</h2>
              <p className={styles.subtitle}>Digite sua senha atual e defina uma nova senha</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.body}>
          {errorMessage && (
            <div className={styles.alertError} role="alert">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className={styles.alertSuccess} role="alert">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Campo 1: Senha Atual */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Senha Atual</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showCurrentPassword ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                title={showCurrentPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Campo 2: Nova Senha */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nova Senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Campo 3: Confirmar Nova Senha */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Confirmar Nova Senha</label>
            <div className={styles.inputWrapper}>
              <KeyRound size={18} className={styles.inputIcon} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className={styles.input}
                placeholder="••••••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                title={showConfirmPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Box de Critérios de Segurança */}
          <div className={styles.criteriaBox}>
            <div className={styles.criteriaHeader}>
              <span className={styles.criteriaTitle}>Critérios de Segurança</span>
              <span className={styles.criteriaCount}>{criteriaMet} de 4</span>
            </div>
            <ul className={styles.criteriaList}>
              <li className={hasMinLength ? styles.activeItem : ""}>
                {hasMinLength ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>Mínimo de 8 caracteres</span>
              </li>
              <li className={hasCase ? styles.activeItem : ""}>
                {hasCase ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>Letra maiúscula e minúscula</span>
              </li>
              <li className={hasNumber ? styles.activeItem : ""}>
                {hasNumber ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>Pelo menos um número</span>
              </li>
              <li className={hasSymbol ? styles.activeItem : ""}>
                {hasSymbol ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                <span>Caractere especial (!@#$%^&*)</span>
              </li>
            </ul>
          </div>

          {/* Botões de Ação */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting || criteriaMet < 4 || !passwordsMatch || !currentPassword}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
