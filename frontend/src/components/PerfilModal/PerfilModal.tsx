import { X, User, Mail, ShieldCheck, Building2, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import styles from "./PerfilModal.module.css";

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAlterarSenhaModal?: () => void;
}

function getInitials(name?: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PerfilModal({ isOpen, onClose, onOpenAlterarSenhaModal }: PerfilModalProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen || !user) return null;

  const initials = getInitials(user.name);

  function handleLogout() {
    onClose();
    logout();
  }

  function handleTrocarSenha() {
    onClose();
    if (onOpenAlterarSenhaModal) {
      onOpenAlterarSenhaModal();
    } else {
      navigate("/primeiro-acesso");
    }
  }

  const roleText =
    user.role === "gestor"
      ? "Gestão Escolar & Direção"
      : user.role === "aqv"
      ? "Apoio e Qualidade de Vida (AQV)"
      : "Docente / Instrutor Acadêmico";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <User size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Perfil do Usuário</h2>
              <p className={styles.subtitle}>Informações da sua conta no SENAI SIGA</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className={styles.body}>
          {/* Topo com Avatar e Nome */}
          <div className={styles.avatarCard}>
            <div className={styles.avatarCircle}>{initials}</div>
            <div className={styles.userMainInfo}>
              <h3 className={styles.userName}>{user.name || "Usuário"}</h3>
              <span className={styles.roleBadge}>{roleText}</span>
            </div>
          </div>

          {/* Detalhes da Conta */}
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <div className={styles.infoLabelGroup}>
                <Mail size={16} color="var(--color-primary)" />
                <span className={styles.infoLabel}>E-mail Institucional</span>
              </div>
              <span className={styles.infoValue}>{user.email || "—"}</span>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelGroup}>
                <Building2 size={16} color="var(--color-primary)" />
                <span className={styles.infoLabel}>Unidade Escolar</span>
              </div>
              <span className={styles.infoValue}>Escola SENAI "Dr. Celso Charuri"</span>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.infoLabelGroup}>
                <ShieldCheck size={16} color="var(--color-success)" />
                <span className={styles.infoLabel}>Status do Perfil</span>
              </div>
              <span className={styles.infoValue} style={{ color: "var(--color-success)" }}>
                ● Sessão Ativa &amp; Autenticada
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className={styles.actionsGroup}>
            <button type="button" className={styles.trocarSenhaBtn} onClick={handleTrocarSenha}>
              <KeyRound size={16} />
              <span>Alterar Minha Senha</span>
            </button>

            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
