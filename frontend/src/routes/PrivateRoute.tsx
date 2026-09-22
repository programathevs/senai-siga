import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return null; // Aguarda a verificação de sessão do Laravel Sanctum
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.deve_trocar_senha && location.pathname !== "/primeiro-acesso") {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  if (!user?.deve_trocar_senha && location.pathname === "/primeiro-acesso") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
