import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";

import { DashboardLayout } from "../layouts/DashboardLayout";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import { RoleRoute } from "./RoleRoute";
import { LoadingScreen } from "../components/LoadingScreen/LoadingScreen";

// Lazy loading das páginas para Code Splitting otimizado
const Login = lazy(() => import("../pages/Login/Login").then((m) => ({ default: m.Login })));
const EsqueciSenha = lazy(() => import("../pages/EsqueciSenha/EsqueciSenha").then((m) => ({ default: m.EsqueciSenha })));
const RedefinirSenha = lazy(() => import("../pages/RedefinirSenha/RedefinirSenha").then((m) => ({ default: m.RedefinirSenha })));
const PrimeiroAcesso = lazy(() => import("../pages/PrimeiroAcesso/PrimeiroAcesso").then((m) => ({ default: m.PrimeiroAcesso })));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard").then((m) => ({ default: m.Dashboard })));
const Cursos = lazy(() => import("../pages/Cursos/Cursos").then((m) => ({ default: m.Cursos })));
const Usuarios = lazy(() => import("../pages/Usuarios/Usuarios").then((m) => ({ default: m.Usuarios })));
const Turmas = lazy(() => import("../pages/Turmas/Turmas").then((m) => ({ default: m.Turmas })));
const Alunos = lazy(() => import("../pages/Alunos/Alunos").then((m) => ({ default: m.Alunos })));
const Ocorrencias = lazy(() => import("../pages/Ocorrencias/Ocorrencias").then((m) => ({ default: m.Ocorrencias })));
const Relatorios = lazy(() => import("../pages/Relatorios/Relatorios").then((m) => ({ default: m.Relatorios })));
const EncaminhamentosEquipeEscolar = lazy(() => import("../pages/EncaminhamentosEquipeEscolar/EncaminhamentosEquipeEscolar").then((m) => ({ default: m.EncaminhamentosEquipeEscolar })));
const PlanosRecuperacao = lazy(() => import("../pages/PlanosRecuperacao/PlanosRecuperacao").then((m) => ({ default: m.PlanosRecuperacao })));
const MeusAlunos = lazy(() => import("../pages/MeusAlunos/MeusAlunos").then((m) => ({ default: m.MeusAlunos })));
const Configuracoes = lazy(() => import("../pages/Configuracoes/Configuracoes").then((m) => ({ default: m.Configuracoes })));
const Auditoria = lazy(() => import("../pages/Auditoria/Auditoria").then((m) => ({ default: m.Auditoria })));

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Rotas Públicas (Apenas para convidados/deslogados)
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/login",
        element: withSuspense(Login),
      },
      {
        path: "/esqueci-senha",
        element: withSuspense(EsqueciSenha),
      },
      {
        path: "/redefinir-senha",
        element: withSuspense(RedefinirSenha),
      },
    ],
  },

  // Rotas Protegidas (Exigem autenticação ativa)
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/primeiro-acesso",
        element: withSuspense(PrimeiroAcesso),
      },
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: withSuspense(Dashboard),
          },
          {
            element: <RoleRoute allowedRoles={["gestor", "instrutor", "equipe_escolar", "aqv"]} />,
            children: [
              {
                path: "/ocorrencias",
                element: withSuspense(Ocorrencias),
              },
              {
                path: "/planos-recuperacao",
                element: withSuspense(PlanosRecuperacao),
              },
              {
                path: "/relatorios",
                element: withSuspense(Relatorios),
              },
              {
                path: "/configuracoes",
                element: withSuspense(Configuracoes),
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={["gestor", "instrutor"]} />,
            children: [
              {
                path: "/meus-alunos",
                element: withSuspense(MeusAlunos),
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={["gestor", "equipe_escolar", "aqv"]} />,
            children: [
              {
                path: "/encaminhamentos-equipe-escolar",
                element: withSuspense(EncaminhamentosEquipeEscolar),
              },
              {
                path: "/encaminhamentos-aqv",
                element: withSuspense(EncaminhamentosEquipeEscolar),
              },
            ],
          },
          {
            element: <RoleRoute allowedRoles={["gestor"]} />,
            children: [
              {
                path: "/cursos",
                element: withSuspense(Cursos),
              },
              {
                path: "/turmas",
                element: withSuspense(Turmas),
              },
              {
                path: "/alunos",
                element: withSuspense(Alunos),
              },
              {
                path: "/usuarios",
                element: withSuspense(Usuarios),
              },
              {
                path: "/instrutores",
                element: withSuspense(Usuarios),
              },
              {
                path: "/auditoria",
                element: withSuspense(Auditoria),
              },
            ],
          },
        ],
      },
    ],
  },
]);
