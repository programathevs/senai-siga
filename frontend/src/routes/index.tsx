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
import { Instrutores } from "../pages/Instrutores/Instrutores";
import { Turmas } from "../pages/Turmas/Turmas";
import { Alunos } from "../pages/Alunos/Alunos";
import { Ocorrencias } from "../pages/Ocorrencias/Ocorrencias";
import { Relatorios } from "../pages/Relatorios/Relatorios";
import { EncaminhamentosAqv } from "../pages/EncaminhamentosAqv/EncaminhamentosAqv";

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
                path: "/ocorrencias",
                element: <Ocorrencias />,
              },
              {
                path: "/relatorios",
                element: <Relatorios />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={["admin", "aqv"]} />,
            children: [
              {
                path: "/encaminhamentos-aqv",
                element: <EncaminhamentosAqv />,
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={["admin"]} />,
            children: [
              {
                path: "/cursos",
                element: <Cursos />,
              },
              {
                path: "/turmas",
                element: <Turmas />,
              },
              {
                path: "/alunos",
                element: <Alunos />,
              },
              {
                path: "/instrutores",
                element: <Instrutores />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
