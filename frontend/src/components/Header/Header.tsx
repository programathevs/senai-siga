import { useState, useEffect, useRef } from "react";
import { Building2, Menu, CheckCircle2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import { PerfilDropdown } from "../PerfilDropdown/PerfilDropdown";
import { PerfilModal } from "../PerfilModal/PerfilModal";
import { AlterarSenhaModal } from "../AlterarSenhaModal/AlterarSenhaModal";
import styles from "./Header.module.css";

function getInitials(name?: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface ToastData {
  title: string;
  message: string;
}

export function Header() {
  const { user } = useAuth();
  const { isCollapsed, toggleMobile } = useSidebar();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isPerfilDropdownOpen, setIsPerfilDropdownOpen] = useState(false);
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const [isAlterarSenhaModalOpen, setIsAlterarSenhaModalOpen] = useState(false);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initials = getInitials(user?.name);

  useEffect(() => {
    function handleAvatarToast(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setToast({
          title: detail.title || "Sucesso!",
          message: detail.message,
        });

        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }

        toastTimeoutRef.current = setTimeout(() => {
          setToast(null);
        }, 5000);
      }
    }

    window.addEventListener("show-avatar-toast", handleAvatarToast);
    return () => {
      window.removeEventListener("show-avatar-toast", handleAvatarToast);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <header
        className={`${styles.header} ${isCollapsed ? styles.collapsedHeader : ""}`}
        aria-label="Barra Superior Institucional"
      >
        {/* Lado Esquerdo: Botão Mobile e Unidade Escolar */}
        <div className={styles.headerLeft}>
          <button
            type="button"
            className={styles.mobileMenuBtn}
            onClick={toggleMobile}
            aria-label="Abrir menu lateral"
            title="Menu de Navegação"
          >
            <Menu size={20} />
          </button>

          <div className={styles.schoolUnitWrapper}>
            <Building2 size={22} className={styles.schoolIcon} aria-hidden="true" />
            <div className={styles.schoolDetails}>
              <span className={styles.schoolLabel}>Unidade Escolar</span>
              <span
                className={styles.schoolName}
                title="Escola SENAI 'Dr. Celso Charuri'"
              >
                Escola SENAI "Dr. Celso Charuri"
              </span>
            </div>
          </div>
        </div>

        {/* Lado Direito: Alternador de Tema, Notificações e Avatar */}
        <div className={styles.headerRight}>

          {/* Alternador de Tema Sol ⟲ Lua */}
          <ThemeToggle />

          {/* Avatar Mini, Card de Perfil Dropdown e Toast Flutuante */}
          <div className={styles.avatarWrapper}>
            <div
              className={styles.userAvatarMini}
              title={`Perfil de ${user?.name || "Usuário"}`}
              onClick={() => setIsPerfilDropdownOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
            >
              <span>{initials}</span>
            </div>

            <PerfilDropdown
              isOpen={isPerfilDropdownOpen}
              onClose={() => setIsPerfilDropdownOpen(false)}
              onOpenPerfilModal={() => setIsPerfilModalOpen(true)}
              onOpenAlterarSenhaModal={() => setIsAlterarSenhaModalOpen(true)}
              position="header"
            />

            {toast && (
              <div className={styles.avatarToast} role="alert">
                <div className={styles.toastArrow} />
                <div className={styles.toastIconWrapper}>
                  <CheckCircle2 size={18} className={styles.toastIcon} />
                </div>
                <div className={styles.toastBody}>
                  <span className={styles.toastTitle}>{toast.title}</span>
                  <span className={styles.toastMessage}>{toast.message}</span>
                </div>
                <button
                  type="button"
                  className={styles.toastCloseBtn}
                  onClick={() => setToast(null)}
                  aria-label="Fechar notificação"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <PerfilModal
        isOpen={isPerfilModalOpen}
        onClose={() => setIsPerfilModalOpen(false)}
        onOpenAlterarSenhaModal={() => setIsAlterarSenhaModalOpen(true)}
      />

      <AlterarSenhaModal
        isOpen={isAlterarSenhaModalOpen}
        onClose={() => setIsAlterarSenhaModalOpen(false)}
      />
    </>
  );
}




