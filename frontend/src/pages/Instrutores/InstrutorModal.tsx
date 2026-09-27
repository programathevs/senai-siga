import React, { useState, useEffect } from "react";
import { X, UserCheck, AlertCircle, Mail, Loader2 } from "lucide-react";
import { instrutorService, type Instrutor } from "../../services/instrutorService";
import styles from "./InstrutorModal.module.css";

interface InstrutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instrutorToEdit?: Instrutor | null;
}

export const InstrutorModal: React.FC<InstrutorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  instrutorToEdit,
}) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (instrutorToEdit) {
      setNome(instrutorToEdit.user?.name || "");
      setEmail(instrutorToEdit.user?.email || "");
      setTelefone(instrutorToEdit.telefone || "");
    } else {
      setNome("");
      setEmail("");
      setTelefone("");
    }
    setError(null);
  }, [instrutorToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("O nome completo é obrigatório.");
      return;
    }
    if (!email.trim()) {
      setError("O e-mail institucional é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim() || null,
      };

      if (instrutorToEdit) {
        await instrutorService.updateInstrutor(instrutorToEdit.id, payload);
      } else {
        await instrutorService.createInstrutor(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Ocorreu um erro ao salvar o instrutor. Verifique os dados e tente novamente.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <UserCheck size={18} />
            </div>
            <h2 className={styles.title}>
              {instrutorToEdit ? "Editar Instrutor" : "Novo Instrutor"}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
              {error}
            </div>
          )}

          <div className={styles.infoBanner}>
            <Mail size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom", color: "var(--color-primary)" }} />
            {instrutorToEdit
              ? "Edite os dados cadastrais e de contato do instrutor. O e-mail institucional é utilizado para autenticação no sistema."
              : "Ao cadastrar, um e-mail com as credenciais provisórias e o link de confirmação será enviado automaticamente ao instrutor. No primeiro acesso, a criação de uma nova senha pessoal será obrigatória."}
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Nome Completo <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carlos Eduardo Silva"
              required
            />
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                E-mail Institucional <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: carlos.silva@sp.senai.br"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Telefone / WhatsApp</label>
              <input
                type="text"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
              />
            </div>
          </div>

          <div className={styles.footer}>
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
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {instrutorToEdit ? "Salvar Alterações" : "Cadastrar e Enviar E-mail"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
