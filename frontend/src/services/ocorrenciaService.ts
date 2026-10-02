import { api } from "./api";
import type { Aluno } from "./alunoService";
import type { Instrutor } from "./instrutorService";
import type { UnidadeCurricular } from "./cursoService";

export type OcorrenciaTipo = "falta" | "comportamento" | "desempenho";

export type OcorrenciaStatus =
  | "pendente"
  | "pdf_gerado"
  | "enviado_aqv"
  | "impresso"
  | "assinado";

export interface OcorrenciaUnidade {
  id: number;
  ocorrencia_id: number;
  unidade_curricular_id?: number;
  unidade_curricular?: UnidadeCurricular;
  total_aulas_dadas?: number;
  quantidade_faltas: number;
  limite_percentual: number;
  limite_faltas_aulas: number;
  percentual_atingido: number;
}

export interface OcorrenciaEdicao {
  id: number;
  ocorrencia_id: number;
  editado_por: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  editado_por_user?: {
    id: number;
    name: string;
    email: string;
  };
  versao_anterior: number;
  versao_nova: number;
  motivo: string;
  created_at: string;
}

export interface Ocorrencia {
  id: number;
  aluno_id: number;
  aluno?: Aluno;
  registrado_por: number | { id: number; name: string; email: string };
  registrado_por_id?: number;
  registrado_por_user?: {
    id: number;
    name: string;
    email: string;
  };
  numero_sequencial: string;
  versao: number;
  tipo: OcorrenciaTipo;
  relato_dificuldades?: string | null;
  recomendacoes_professor?: string | null;
  recomendacoes_gestao?: string | null;
  providencias_gestao?: string | null;
  outras_observacoes?: string | null;
  data_ocorrencia: string;
  status: OcorrenciaStatus;
  pdf_path?: string | null;
  unidade_curricular_id?: number | null;
  unidade_curricular?: UnidadeCurricular | null;
  unidades?: OcorrenciaUnidade[];
  instrutores?: Instrutor[];
  edicoes?: OcorrenciaEdicao[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface OcorrenciaEstatisticas {
  total_mes: number;
  total_falta: number;
  total_comportamento: number;
  total_desempenho: number;
  total_aqv: number;
  total_pendente: number;
}

export interface OcorrenciaFiltros {
  search?: string;
  tipo?: OcorrenciaTipo | "";
  status?: OcorrenciaStatus | "";
  aluno_id?: number;
  turma_id?: number | string;
  curso_id?: number | string;
  data_inicio?: string;
  data_fim?: string;
}

export interface CreateOcorrenciaPayload {
  aluno_id: number;
  tipo: OcorrenciaTipo;
  data_ocorrencia: string;
  unidade_curricular_id?: number;
  quantidade_faltas?: number;
  total_aulas_dadas?: number;
  limite_percentual?: number;
  unidades?: Array<{
    unidade_curricular_id: number;
    quantidade_faltas: number;
    limite_percentual?: number;
  }>;
  instrutor_ids?: number[];
  relato_dificuldades?: string;
  recomendacoes_professor?: string;
  recomendacoes_gestao?: string;
  providencias_gestao?: string;
  outras_observacoes?: string;
  status?: OcorrenciaStatus;
}

export const ocorrenciaService = {
  async getOcorrencias(
    filtros?: OcorrenciaFiltros
  ): Promise<{ data: Ocorrencia[]; meta?: { estatisticas: OcorrenciaEstatisticas } }> {
    const response = await api.get<{
      data: Ocorrencia[];
      meta?: { estatisticas: OcorrenciaEstatisticas };
    }>("/api/ocorrencias", {
      params: filtros,
    });
    return response.data;
  },

  async getOcorrencia(id: number): Promise<Ocorrencia> {
    const response = await api.get<{ data: Ocorrencia }>(`/api/ocorrencias/${id}`);
    return response.data.data;
  },

  async createOcorrencia(payload: CreateOcorrenciaPayload): Promise<Ocorrencia> {
    const response = await api.post<{ message: string; data: Ocorrencia }>(
      "/api/ocorrencias",
      payload
    );
    return response.data.data;
  },

  async updateOcorrencia(
    id: number,
    payload: Partial<CreateOcorrenciaPayload> & { motivo_edicao?: string }
  ): Promise<Ocorrencia> {
    const response = await api.put<{ message: string; data: Ocorrencia }>(
      `/api/ocorrencias/${id}`,
      payload
    );
    return response.data.data;
  },

  async deleteOcorrencia(id: number): Promise<void> {
    await api.delete(`/api/ocorrencias/${id}`);
  },

  async encaminharAqv(id: number): Promise<Ocorrencia> {
    const response = await api.post<{ message: string; data: Ocorrencia }>(
      `/api/ocorrencias/${id}/encaminhar-aqv`
    );
    return response.data.data;
  },

  async restaurarOcorrencia(id: number): Promise<Ocorrencia> {
    const response = await api.post<{ message: string; data: Ocorrencia }>(
      `/api/ocorrencias/${id}/restaurar`
    );
    return response.data.data;
  },
};
