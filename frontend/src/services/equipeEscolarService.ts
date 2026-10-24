import { api } from "./api";
import type { Ocorrencia } from "./ocorrenciaService";
import type { PaginationMeta } from "../types/pagination";

export type CompensacaoFaltasAutorizada =
  | "pendente"
  | "nao_autorizado"
  | "autorizado_atestado"
  | "autorizado_excepcional";

export interface EquipeEscolarRecebimento {
  id: number;
  ocorrencia_id: number;
  recebido_por?: {
    id: number;
    name: string;
    email: string;
  } | null;
  justificativa_aluno?: string | null;
  parecer_aqv?: string | null;
  parecer_equipe_escolar?: string | null;
  data_atendimento?: string | null;
  enviado_em?: string | null;
  confirmado_em?: string | null;
  status_atendimento: "pendente" | "em_atendimento" | "concluido";
  compensacao_faltas_autorizada?: CompensacaoFaltasAutorizada | null;
  motivo_excepcionalidade?: string | null;
  autorizado_por?: {
    id: number;
    name: string;
    email: string;
  } | null;
  autorizado_em?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EquipeEscolarEncaminhamentoItem extends Ocorrencia {
  aqv_recebimento?: EquipeEscolarRecebimento;
  equipe_escolar_recebimento?: EquipeEscolarRecebimento;
}

export interface EquipeEscolarStats {
  total_encaminhados: number;
  aguardando_atendimento: number;
  em_atendimento: number;
  concluidos: number;
}

export interface EquipeEscolarFiltros {
  search?: string;
  status?: "todos" | "pendente" | "em_atendimento" | "concluido" | "";
  tipo?: "todos" | "falta" | "comportamento" | "desempenho" | "";
  turma_id?: number | string;
  data_inicio?: string;
  data_fim?: string;
}

export interface EquipeEscolarAtendimentoPayload {
  justificativa_aluno: string;
  parecer_aqv?: string;
  parecer_equipe_escolar?: string;
  data_atendimento?: string;
  confirmar_assinatura?: boolean;
  compensacao_faltas_autorizada?: CompensacaoFaltasAutorizada;
  motivo_excepcionalidade?: string;
}

export interface EquipeEscolarEncaminhamentosResponse {
  items: EquipeEscolarEncaminhamentoItem[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  meta?: PaginationMeta;
}

export const equipeEscolarService = {
  async getEncaminhamentos(
    filtros: EquipeEscolarFiltros = {},
    page: number = 1,
    perPage: number = 10,
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<EquipeEscolarEncaminhamentosResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", String(perPage));

    if (filtros.search?.trim()) params.set("search", filtros.search.trim());
    if (filtros.status && filtros.status !== "todos") params.set("status", filtros.status);
    if (filtros.tipo && filtros.tipo !== "todos") params.set("tipo", filtros.tipo);
    if (filtros.turma_id) params.set("turma_id", String(filtros.turma_id));
    if (filtros.data_inicio) params.set("data_inicio", filtros.data_inicio);
    if (filtros.data_fim) params.set("data_fim", filtros.data_fim);

    const signal =
      signalOrOptions instanceof AbortSignal
        ? signalOrOptions
        : signalOrOptions?.signal;

    const response = await api.get<EquipeEscolarEncaminhamentosResponse>(
      `/api/equipe-escolar/encaminhamentos?${params.toString()}`,
      { signal }
    );
    return response.data;
  },

  async getStats(signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<EquipeEscolarStats> {
    const signal =
      signalOrOptions instanceof AbortSignal
        ? signalOrOptions
        : signalOrOptions?.signal;
    const response = await api.get<EquipeEscolarStats>("/api/equipe-escolar/stats", { signal });
    return response.data;
  },

  async getAqvStats(signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<EquipeEscolarStats> {
    return this.getStats(signalOrOptions);
  },

  async salvarAtendimento(
    ocorrenciaId: number,
    payload: EquipeEscolarAtendimentoPayload
  ): Promise<{ message: string; data: EquipeEscolarEncaminhamentoItem }> {
    const response = await api.post<{ message: string; data: EquipeEscolarEncaminhamentoItem }>(
      `/api/equipe-escolar/encaminhamentos/${ocorrenciaId}/atendimento`,
      payload
    );
    return response.data;
  },

  async confirmarAssinatura(
    ocorrenciaId: number
  ): Promise<{ message: string; data: EquipeEscolarEncaminhamentoItem }> {
    const response = await api.post<{ message: string; data: EquipeEscolarEncaminhamentoItem }>(
      `/api/equipe-escolar/encaminhamentos/${ocorrenciaId}/confirmar-assinatura`
    );
    return response.data;
  },
};

// Aliases para manter compatibilidade
export type AqvRecebimento = EquipeEscolarRecebimento;
export type AqvEncaminhamentoItem = EquipeEscolarEncaminhamentoItem;
export type AqvStats = EquipeEscolarStats;
export type AqvFiltros = EquipeEscolarFiltros;
export type AqvAtendimentoPayload = EquipeEscolarAtendimentoPayload;
export type AqvEncaminhamentosResponse = EquipeEscolarEncaminhamentosResponse;
export const aqvService = equipeEscolarService;
