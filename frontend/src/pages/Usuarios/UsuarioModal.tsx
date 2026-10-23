import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  AlertCircle,
  Mail,
  Loader2,
  Camera,
  Trash2,
} from "lucide-react";
import { usuarioService, type Usuario, type UserRoleType } from "../../services/usuarioService";
import { formatPhoneNumber } from "../../utils/formatters";
import { UserAvatar } from "../../components/UserAvatar/UserAvatar";
import styles from "./UsuarioModal.module.css";

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  usuarioToEdit?: Usuario | null;
}

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  usuarioToEdit,
}) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRoleType>("instrutor");
  const [telefone, setTelefone] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [removerFoto, setRemoverFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (usuarioToEdit) {
      setNome(usuarioToEdit.name || "");
      setEmail(usuarioToEdit.email || "");
      setRole(usuarioToEdit.role || "instrutor");
      setTelefone(
        formatPhoneNumber(usuarioToEdit.telefone || usuarioToEdit.instrutor?.telefone || "")
      );
      setFotoPreview(usuarioToEdit.foto_url || null);
      setFotoFile(null);
      setRemoverFoto(false);
    } else {
      setNome("");
      setEmail("");
      setRole("instrutor");
      setTelefone("");
      setFotoPreview(null);
      setFotoFile(null);
      setRemoverFoto(false);
    }
    setError(null);
  }, [usuarioToEdit, isOpen]);

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
        role,
        telefone: telefone.trim() || null,
        foto: fotoFile,
        remover_foto: removerFoto,
      };

      if (usuarioToEdit) {
        await usuarioService.updateUsuario(usuarioToEdit.id, payload);
      } else {
        await usuarioService.createUsuario(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Ocorreu um erro ao salvar o usuário. Verifique os dados e tente novamente.";
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
              {usuarioToEdit ? "Editar Usuário" : "Novo Usuário"}
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
              <AlertCircle
                size={16}
                style={{
                  display: "inline",
                  marginRight: "6px",
                  verticalAlign: "text-bottom",
                }}
              />
              {error}
            </div>
          )}

          {/* Upload de Foto Opcional */}
          <div className={styles.photoUploadRow}>
            <UserAvatar
              name={nome || "Usuário"}
              fotoUrl={fotoPreview}
              size="lg"
            />
            <div className={styles.photoActions}>
              <div className={styles.photoButtonRow}>
                <label className={styles.uploadBtn}>
                  <Camera size={14} />
                  <span>{fotoPreview ? "Alterar foto" : "Adicionar foto (opcional)"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        setError("Selecione um arquivo de imagem válido (JPG, PNG, WEBP).");
                        return;
                      }
                      if (file.size > 2 * 1024 * 1024) {
                        setError("A imagem deve ter no máximo 2MB.");
                        return;
                      }
                      setFotoFile(file);
                      setFotoPreview(URL.createObjectURL(file));
                      setRemoverFoto(false);
                      setError(null);
                    }}
                    style={{ display: "none" }}
                  />
                </label>
                {fotoPreview && (
                  <button
                    type="button"
                    className={styles.removePhotoBtn}
                    onClick={() => {
                      setFotoFile(null);
                      setFotoPreview(null);
                      setRemoverFoto(true);
                    }}
                  >
                    <Trash2 size={13} />
                    <span>Remover</span>
                  </button>
                )}
              </div>
              <span className={styles.photoHint}>JPG, PNG ou WEBP de até 2MB</span>
            </div>
          </div>

          {/* Seleção de Perfil / Função */}
          <div className={styles.roleSection}>
            <label className={styles.roleLabel}>
              Perfil de Acesso / Função <span className={styles.required}>*</span>
            </label>
            <div className={styles.roleCardsGrid}>
              {/* Gestor */}
              <div
                className={`${styles.roleCard} ${
                  role === "gestor" ? styles.roleCardActiveGestor : ""
                }`}
                onClick={() => setRole("gestor")}
                role="button"
                tabIndex={0}
              >
                <div className={styles.roleHeader}>
                  <div className={`${styles.roleIconBadge} ${styles.roleIconGestor}`}>
                    <ShieldCheck size={16} />
                  </div>
                  <span className={styles.roleTitle}>Gestor</span>
                </div>
                <p className={styles.roleDesc}>
                  Gestão escolar, turmas, alunos e auditoria institucional.
                </p>
              </div>

              {/* Instrutor */}
              <div
                className={`${styles.roleCard} ${
                  role === "instrutor" ? styles.roleCardActiveInstrutor : ""
                }`}
                onClick={() => setRole("instrutor")}
                role="button"
                tabIndex={0}
              >
                <div className={styles.roleHeader}>
                  <div className={`${styles.roleIconBadge} ${styles.roleIconInstrutor}`}>
                    <GraduationCap size={16} />
                  </div>
                  <span className={styles.roleTitle}>Instrutor</span>
                </div>
                <p className={styles.roleDesc}>
                  Corpo docente com registro de FIAPs, notas e turmas.
                </p>
              </div>

              {/* Equipe Escolar */}
              <div
                className={`${styles.roleCard} ${
                  role === "equipe_escolar" || role === "aqv" ? styles.roleCardActiveEquipeEscolar : ""
                }`}
                onClick={() => setRole("equipe_escolar")}
                role="button"
                tabIndex={0}
              >
                <div className={styles.roleHeader}>
                  <div className={`${styles.roleIconBadge} ${styles.roleIconEquipeEscolar}`}>
                    <HeartHandshake size={16} />
                  </div>
                  <span className={styles.roleTitle}>Equipe Escolar</span>
                </div>
                <p className={styles.roleDesc}>
                  Equipe multidisciplinar, acolhimento, análise de planos e encaminhamentos.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.infoBanner}>
            <Mail
              size={16}
              style={{
                display: "inline",
                marginRight: "6px",
                verticalAlign: "text-bottom",
                color: "var(--color-primary)",
              }}
            />
            {usuarioToEdit
              ? "Edite os dados cadastrais e perfil de acesso. O e-mail institucional é a credencial única de autenticação no sistema."
              : "Ao cadastrar, um e-mail com as credenciais provisórias e o link de confirmação será enviado automaticamente ao usuário. No primeiro acesso, a criação de uma nova senha pessoal será obrigatória."}
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
                type="tel"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(formatPhoneNumber(e.target.value))}
                placeholder="(19) 98765-4321"
                maxLength={15}
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
              {usuarioToEdit ? "Salvar Alterações" : "Cadastrar e Enviar E-mail"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
