import { api } from "./api";

export interface AuditoriaUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuditoriaLog {
  id: number;
  user_id: number | null;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  descricao: string;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: AuditoriaUser | null;
}

export interface AuditoriaStats {
  total_logs: number;
  logs_hoje: number;
  edicoes_fiap: number;
  atendimentos_aqv: number;
  assinaturas_fiap: number;
  planos_recuperacao: number;
}

export interface AuditoriaResponse {
  items: AuditoriaLog[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export interface AuditoriaFilters {
  page?: number;
  per_page?: number;
  search?: string;
  acao?: string;
  entidade?: string;
  data_inicio?: string;
  data_fim?: string;
}

export const auditoriaService = {
  async listar(filters: AuditoriaFilters = {}): Promise<AuditoriaResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", String(filters.page));
    if (filters.per_page) params.append("per_page", String(filters.per_page));
    if (filters.search) params.append("search", filters.search);
    if (filters.acao && filters.acao !== "todas") params.append("acao", filters.acao);
    if (filters.entidade && filters.entidade !== "todas") params.append("entidade", filters.entidade);
    if (filters.data_inicio) params.append("data_inicio", filters.data_inicio);
    if (filters.data_fim) params.append("data_fim", filters.data_fim);

    const response = await api.get<AuditoriaResponse>(`/api/auditoria?${params.toString()}`);
    return response.data;
  },

  async getStats(): Promise<AuditoriaStats> {
    const response = await api.get<AuditoriaStats>("/api/auditoria/stats");
    return response.data;
  },
};
