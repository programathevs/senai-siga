import { useEffect, useRef } from "react";
import { User, KeyRound, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import styles from "./PerfilDropdown.module.css";

interface PerfilDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPerfilModal?: () => void;
  onOpenAlterarSenhaModal?: () => void;
  position?: "header" | "sidebar";
}

function getInitials(name?: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PerfilDropdown({
  isOpen,
  onClose,
  onOpenPerfilModal,
  onOpenAlterarSenhaModal,
  position = "header",
}: PerfilDropdownProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 10);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const initials = getInitials(user.name);

  function handleVerPerfil() {
    onClose();
    if (onOpenPerfilModal) {
      onOpenPerfilModal();
    }
  }

  function handleLogout() {
    onClose();
    logout();
    navigate("/login", { replace: true });
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
      ? "Gestão Escolar"
      : user.role === "aqv"
      ? "Apoio e Qualidade (AQV)"
      : "Docente / Instrutor";

  return (
    <div
      ref={containerRef}
      className={`${styles.card} ${position === "sidebar" ? styles.positionSidebar : styles.positionHeader}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Topo do Card com Informações do Perfil */}
      <div className={styles.userHeader}>
        <div className={styles.avatarCircle}>{initials}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName} title={user.name}>{user.name || "Usuário"}</span>
          <span className={styles.userEmail} title={user.email}>{user.email || "usuario@senai.br"}</span>
          <span className={styles.roleBadge}>{roleText}</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Opções de Ação */}
      <div className={styles.actionsGroup}>
        <button type="button" className={styles.actionBtn} onClick={handleVerPerfil}>
          <User size={16} className={styles.actionIcon} />
          <span>Meu Perfil</span>
        </button>

        <button type="button" className={styles.actionBtn} onClick={handleTrocarSenha}>
          <KeyRound size={16} className={styles.actionIcon} />
          <span>Alterar Senha</span>
        </button>

        <button type="button" className={`${styles.actionBtn} ${styles.logoutBtn}`} onClick={handleLogout}>
          <LogOut size={16} className={styles.actionIcon} />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
}

