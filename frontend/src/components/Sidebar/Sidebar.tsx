import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Gavel,
  ClipboardCheck,
  GraduationCap,
  Users,
  Headphones,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../../contexts/SidebarContext";
import senaiLogo from "../../assets/senai-logo.jpg";
import styles from "./Sidebar.module.css";

function getInitials(name?: string) {
  if (!name) return "US";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = getInitials(user?.name);

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
      allowedRoles: ["admin", "instrutor", "aqv"],
    },
    {
      to: "/ocorrencias",
      label: "Ocorrências & Advertências",
      icon: Gavel,
      allowedRoles: ["admin", "instrutor", "aqv"],
    },
    {
      to: "/planos-recuperacao",
      label: "Planos de Recuperação",
      icon: ClipboardCheck,
      allowedRoles: ["admin", "instrutor", "aqv"],
    },
    {
      to: "/cursos",
      label: "Gestão de Cursos",
      icon: GraduationCap,
      allowedRoles: ["admin", "instrutor", "aqv"],
    },
    {
      to: "/turmas-alunos",
      label: "Turmas & Alunos",
      icon: Users,
      allowedRoles: ["admin", "instrutor"],
    },
    {
      to: "/encaminhamentos-aqv",
      label: "Encaminhamentos AQV",
      icon: Headphones,
      allowedRoles: ["admin", "aqv"],
    },
    {
      to: "/relatorios",
      label: "Relatórios & Histórico",
      icon: BarChart3,
      allowedRoles: ["admin", "instrutor", "aqv"],
    },
    {
      to: "/configuracoes",
      label: "Configurações",
      icon: Settings,
      allowedRoles: ["admin"],
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => !user?.role || item.allowedRoles.includes(user.role)
  );

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${isMobileOpen ? styles.mobileOpen : ""
        }`}
      aria-label="Menu Lateral de Navegação"
    >
      <div className={styles.navSection}>
        {/* Cabeçalho da Sidebar */}
        <div className={styles.sidebarHeader}>
          <NavLink to="/" className={styles.brandLink} onClick={closeMobile} title="SENAI SIGA">
            <img src={senaiLogo} alt="Logo SENAI" className={styles.brandLogo} />
          </NavLink>

          <button
            type="button"
            className={styles.toggleCollapseBtn}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Categoria Menu Principal */}
        <div className={styles.sectionHeader}>
          <span>Menu Principal</span>
        </div>

        {/* Links de Navegação */}
        <nav className={styles.navLinks}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navLabel}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Card de Perfil no Rodapé */}
      <div className={styles.profileCardWrapper}>
        <div className={styles.profileContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarCircle} title={user?.name || "Usuário"}>
              {initials}
            </div>
            <span className={styles.onlineBadge} title="Sessão ativa" />
          </div>

          <div className={styles.profileInfo}>
            <span className={styles.profileName} title={user?.name}>
              {user?.name || "Usuário"}
            </span>
            <span className={styles.profileRole} title={user?.role}>
              {user?.role ? `Perfil ${user.role.toUpperCase()}` : "Docente"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutBtn}
            title="Encerrar sessão"
            aria-label="Encerrar sessão"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
