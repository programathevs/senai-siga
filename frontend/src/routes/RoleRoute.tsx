import { Navigate, Outlet } from "react-router";
import { useAuth, type UserRole } from "../contexts/AuthContext";

interface RoleRouteProps {
  allowedRoles: UserRole[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    // Redireciona para o Dashboard principal se o usuário não possuir acesso a esta rota
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
