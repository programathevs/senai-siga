// import { Navigate, Outlet, useLocation } from "react-router";
// import { useAuth } from "../contexts/AuthContext";

// export function PrivateRoute() {
//   const { isAuthenticated } = useAuth();
//   const location = useLocation();

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   return <Outlet />;
// }
