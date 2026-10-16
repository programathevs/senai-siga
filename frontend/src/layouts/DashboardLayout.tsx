import { useEffect } from "react";
import { Outlet } from "react-router";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import styles from "./DashboardLayout.module.css";

function DashboardLayoutContent() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  useEffect(() => {
    function handleAfterPrint() {
      // Restaura o foco na janela e desbloqueia cliques no navegador (corrige bug do Chrome ao cancelar)
      window.focus();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus?.();
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

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
