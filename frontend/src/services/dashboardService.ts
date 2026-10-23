import { api } from "./api";
import type { Ocorrencia } from "./ocorrenciaService";

export interface DashboardKPIs {
  total_mes: number;
  total_mes_anterior: number;
  diferenca_mes: number;
  pendentes: number;
  encaminhadas_equipe_escolar?: number;
  encaminhadas_aqv: number;
  resolvidas: number;
  alunos_em_alerta: number;
}

export interface TurmaResumoDashboard {
  id: number;
  nome: string;
  turno?: string;
  ano_letivo?: string;
  semestre_atual?: number;
  curso?: {
    id: number;
    nome: string;
  } | null;
  alunos_count: number;
  ocorrencias_count: number;
}

export interface DistribuicaoCurso {
  id: number;
  nome: string;
  ocorrencias_count: number;
  percentual: number;
}

export interface TopUcCritica {
  id: number;
  nome: string;
  sigla: string;
  total_ocorrencias: number;
  total_faltas: number;
}

export interface FunilAqv {
  total: number;
  aguardando: number;
  em_atendimento: number;
  concluidos: number;
}

export type FunilEquipeEscolar = FunilAqv;

export interface MetricasGestao {
  total_alunos_ativos: number;
  alunos_sem_turma: number;
  total_turmas_ativas: number;
  total_cursos: number;
  total_planos_ativos: number;
  taxa_resolucao: number;
  distribuicao_cursos: DistribuicaoCurso[];
  top_ucs_criticas: TopUcCritica[];
  funil_equipe_escolar?: FunilEquipeEscolar;
  funil_aqv: FunilAqv;
}

export interface DashboardStats {
  periodo: {
    mes_atual: string;
    mes_nome: string;
  };
  kpis: DashboardKPIs;
  distribuicao_tipo: {
    falta: number;
    comportamento: number;
    desempenho: number;
  };
  distribuicao_status: {
    pendente: number;
    enviado_equipe_escolar?: number;
    enviado_aqv: number;
    pdf_gerado: number;
    impresso: number;
    assinado: number;
  };
  ocorrencias_recentes: Ocorrencia[];
  turmas_resumo: TurmaResumoDashboard[];
  metricas_gestao?: MetricasGestao | null;
}

export const dashboardService = {
  async getStats(signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<DashboardStats> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<{ data: DashboardStats }>("/api/dashboard/stats", { signal });
    return response.data.data;
  },
};
