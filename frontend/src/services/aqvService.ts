import { api } from "./api";
import type { Ocorrencia } from "./ocorrenciaService";
import type { PaginationMeta } from "../types/pagination";

export interface AqvRecebimento {
  id: number;
  ocorrencia_id: number;
  recebido_por?: {
    id: number;
    name: string;
    email: string;
  } | null;
  justificativa_aluno?: string | null;
  parecer_aqv?: string | null;
  data_atendimento?: string | null;
  enviado_em?: string | null;
  confirmado_em?: string | null;
  status_atendimento: "pendente" | "em_atendimento" | "concluido";
  created_at?: string;
  updated_at?: string;
}

export interface AqvEncaminhamentoItem extends Ocorrencia {
  aqv_recebimento?: AqvRecebimento;
}

export interface AqvStats {
  total_encaminhados: number;
  aguardando_atendimento: number;
  em_atendimento: number;
  concluidos: number;
}

export interface AqvFiltros {
  search?: string;
  status?: "todos" | "pendente" | "em_atendimento" | "concluido" | "";
  tipo?: "todos" | "falta" | "comportamento" | "desempenho" | "";
  turma_id?: number | string;
  data_inicio?: string;
  data_fim?: string;
}

export interface AqvAtendimentoPayload {
  justificativa_aluno: string;
  parecer_aqv?: string;
  data_atendimento?: string;
  confirmar_assinatura?: boolean;
}

export interface AqvEncaminhamentosResponse {
  items: AqvEncaminhamentoItem[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  meta?: PaginationMeta;
}

export const aqvService = {
  async getEncaminhamentos(
    filtros: AqvFiltros = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<AqvEncaminhamentosResponse> {
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("per_page", String(perPage));

    if (filtros.search?.trim()) {
      params.append("search", filtros.search.trim());
    }
    if (filtros.status && filtros.status !== "todos") {
      params.append("status", filtros.status);
    }
    if (filtros.tipo && filtros.tipo !== "todos") {
      params.append("tipo", filtros.tipo);
    }
    if (filtros.turma_id) {
      params.append("turma_id", String(filtros.turma_id));
    }
    if (filtros.data_inicio) {
      params.append("data_inicio", filtros.data_inicio);
    }
    if (filtros.data_fim) {
      params.append("data_fim", filtros.data_fim);
    }

    const response = await api.get<AqvEncaminhamentosResponse>(
      `/api/aqv/encaminhamentos?${params.toString()}`
    );
    return response.data;
  },

  async getAqvStats(): Promise<AqvStats> {
    const response = await api.get<AqvStats>("/api/aqv/stats");
    return response.data;
  },

  async salvarAtendimento(
    ocorrenciaId: number,
    payload: AqvAtendimentoPayload
  ): Promise<{ message: string; data: AqvEncaminhamentoItem }> {
    const response = await api.post<{ message: string; data: AqvEncaminhamentoItem }>(
      `/api/aqv/encaminhamentos/${ocorrenciaId}/atendimento`,
      payload
    );
    return response.data;
  },

  async confirmarAssinatura(
    ocorrenciaId: number
  ): Promise<{ message: string; data: AqvEncaminhamentoItem }> {
    const response = await api.post<{ message: string; data: AqvEncaminhamentoItem }>(
      `/api/aqv/encaminhamentos/${ocorrenciaId}/confirmar-assinatura`
    );
    return response.data;
  },
};
