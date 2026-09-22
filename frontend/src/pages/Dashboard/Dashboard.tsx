import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router";
import { LogOut } from "lucide-react";

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <section style={{ padding: "2rem" }}>
      <h1>Painel Principal</h1>
      <p style={{ marginTop: "0.5rem", color: "var(--color-text-secondary)" }}>
        Olá, <strong>{user?.name}</strong>! Você está autenticado como <strong>{user?.role?.toUpperCase()}</strong>.
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            border: "none",
            borderRadius: "var(--radius)",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} />
          <span>Encerrar Sessão (Logout)</span>
        </button>
      </div>
    </section>
  );
}
