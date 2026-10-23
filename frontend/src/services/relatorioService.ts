import { api } from "./api";
import type { Ocorrencia, OcorrenciaTipo, OcorrenciaStatus } from "./ocorrenciaService";
import type { PaginationMeta } from "../types/pagination";

export interface RelatorioFiltros {
  search?: string;
  turma_id?: number | string;
  curso_id?: number | string;
  tipo?: OcorrenciaTipo | "";
  status?: OcorrenciaStatus | "";
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  per_page?: number;
  all?: boolean;
  reincidentes?: boolean;
}

export interface RelatorioResumo {
  total_ocorrencias: number;
  total_faltas: number;
  total_comportamento: number;
  total_desempenho: number;
  total_equipe_escolar?: number;
  total_aqv: number;
  total_resolvidas: number;
  alunos_unicos: number;
}

export interface RelatorioOcorrenciasResponse {
  data: Ocorrencia[];
  meta: PaginationMeta & {
    resumo: RelatorioResumo;
  };
}

export interface RelatorioTurmaResumoItem {
  id: number;
  nome: string;
  turno?: string;
  ano_letivo?: string;
  semestre_atual?: number;
  curso: string;
  alunos_count: number;
  total_ocorrencias: number;
  total_faltas: number;
  total_comportamento: number;
  total_desempenho: number;
  alunos_notificados: number;
  taxa_incidencia: number;
}

export const relatorioService = {
  async getOcorrencias(
    filtros?: RelatorioFiltros,
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<RelatorioOcorrenciasResponse> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<RelatorioOcorrenciasResponse>("/api/relatorios/ocorrencias", {
      params: filtros,
      signal,
    });
    return response.data;
  },

  async getResumoTurmas(
    params?: {
      data_inicio?: string;
      data_fim?: string;
    },
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<{ data: RelatorioTurmaResumoItem[] }> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<{ data: RelatorioTurmaResumoItem[] }>("/api/relatorios/resumo-turmas", {
      params,
      signal,
    });
    return response.data;
  },
};
