import { Outlet } from "react-router";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

function DashboardLayoutContent() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <div className={styles.layoutWrapper}>
      {/* Sidebar de Navegação */}
      <Sidebar />

      {/* Header Fixo no Topo */}
      <Header />

      {/* Backdrop para fechar o menu mobile ao tocar fora */}
      <div
        className={`${styles.backdrop} ${isMobileOpen ? styles.backdropActive : ""}`}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Área Principal de Conteúdo das Rotas */}
      <main
        className={`${styles.mainContent} ${isCollapsed ? styles.collapsedMain : ""}`}
        id="main-dashboard-content"
      >
        <Outlet />
      </main>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardLayoutContent />
    </SidebarProvider>
  );
}
