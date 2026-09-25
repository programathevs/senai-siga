import { createBrowserRouter } from "react-router";

import { Login } from "../pages/Login/Login";
import { EsqueciSenha } from "../pages/EsqueciSenha/EsqueciSenha";
import { RedefinirSenha } from "../pages/RedefinirSenha/RedefinirSenha";
import { PrimeiroAcesso } from "../pages/PrimeiroAcesso/PrimeiroAcesso";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import { RoleRoute } from "./RoleRoute";
import { Cursos } from "../pages/Cursos/Cursos";

export const router = createBrowserRouter([
  // Rotas Públicas (Apenas para convidados/deslogados)
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/esqueci-senha",
        element: <EsqueciSenha />,
      },
      {
        path: "/redefinir-senha",
        element: <RedefinirSenha />,
      },
    ],
  },

  // Rotas Protegidas (Exigem autenticação ativa)
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/primeiro-acesso",
        element: <PrimeiroAcesso />,
      },
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            element: <RoleRoute allowedRoles={["admin", "instrutor", "aqv"]} />,
            children: [
              {
                path: "/cursos",
                element: <Cursos />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
