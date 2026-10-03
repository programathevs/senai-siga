import { api } from "./api";
import type { Ocorrencia } from "./ocorrenciaService";

export interface DashboardKPIs {
  total_mes: number;
  total_mes_anterior: number;
  diferenca_mes: number;
  pendentes: number;
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
    enviado_aqv: number;
    pdf_gerado: number;
    impresso: number;
    assinado: number;
  };
  ocorrencias_recentes: Ocorrencia[];
  turmas_resumo: TurmaResumoDashboard[];
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<{ data: DashboardStats }>("/api/dashboard/stats");
    return response.data.data;
  },
};
