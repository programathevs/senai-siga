import { Building2, Search, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { ThemeToggle } from "../ThemeToggle/ThemeToggle";
import styles from "./Header.module.css";

function getInitials(name?: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header() {
  const { user } = useAuth();
  const { isCollapsed, toggleMobile } = useSidebar();

  const initials = getInitials(user?.name);

  return (
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

      {/* Lado Direito: Busca, Período, Alternador de Tema, Notificações e Avatar */}
      <div className={styles.headerRight}>
        {/* Barra de Busca Rápida */}
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar aluno, matrícula, turma ou protocolo..."
            aria-label="Campo de busca global"
          />
        </div>

        {/* Alternador de Tema Sol ⟲ Lua */}
        <ThemeToggle />

        {/* Avatar Mini */}
        <div className={styles.userAvatarMini} title={user?.name || "Usuário"}>
          <span>{initials}</span>
        </div>
      </div>
    </header>
  );
}
