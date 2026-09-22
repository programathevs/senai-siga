import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { LogOut, User as UserIcon } from "lucide-react";
import styles from "./Header.module.css";

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h2>SENAI SIGA</h2>
      </div>

      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <UserIcon size={18} aria-hidden="true" />
          <span>{user?.name || "Usuário"}</span>
          {user?.role && <span className={styles.roleBadge}>{user.role}</span>}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
          title="Encerrar sessão"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
