import { api } from "./api";
import type { Aluno } from "./alunoService";
import type { Ocorrencia } from "./ocorrenciaService";
import type { UnidadeCurricular } from "./cursoService";

export type PlanoTipoPrograma =
  | "recuperacao_paralela"
  | "compensacao_ausencia"
  | "recuperacao_final";

export type PlanoStatusProcesso = "rascunho" | "aguardando_visto" | "concluido";
export type PlanoConceito = "aprovado" | "reprovado";

export interface PlanoFrequencia {
  id?: number;
  plano_id?: number;
  data: string;
  entrada?: string;
  saida?: string;
  aulas_compensadas?: number;
}

export interface PlanoRecuperacao {
  id: number;
  ocorrencia_id: number;
  ocorrencia?: Ocorrencia;
  aluno_id: number;
  aluno?: Aluno;
  turma_uc_id?: number | null;
  unidade_curricular_id?: number | null;
  unidade_curricular?: UnidadeCurricular | null;
  registrado_por: number | { id: number; name: string; email: string };
  registrado_por_user?: { id: number; name: string; email: string };
  tipo_programa: PlanoTipoPrograma;
  ciclo_avaliacao?: string;
  conteudo_programatico?: string | null;
  propostas_trabalho?: string[] | null;
  periodo_previsto?: string | null;
  periodo_inicio?: string | null;
  periodo_fim?: string | null;
  visto_coordenacao?: string | null;
  visto_aluno?: string | null;
  visto_professor?: string | null;
  conceito?: PlanoConceito | null;
  status_processo?: PlanoStatusProcesso;
  registro_desempenho?: string | null;
  frequencias?: PlanoFrequencia[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface PlanoRecuperacaoPayload {
  ocorrencia_id: number;
  aluno_id: number;
  turma_uc_id?: number | null;
  unidade_curricular_id?: number | null;
  tipo_programa: PlanoTipoPrograma;
  ciclo_avaliacao?: string;
  conteudo_programatico?: string;
  propostas_trabalho?: string[];
  periodo_previsto?: string;
  periodo_inicio?: string;
  periodo_fim?: string;
  visto_coordenacao?: string;
  visto_aluno?: string;
  visto_professor?: string;
  conceito?: PlanoConceito;
  status_processo?: PlanoStatusProcesso;
  registro_desempenho?: string;
  frequencias?: PlanoFrequencia[];
}

export interface PlanoFiltros {
  search?: string;
  tipo_programa?: string;
  status_processo?: string;
  aluno_id?: number;
  ocorrencia_id?: number;
}

export const planoRecuperacaoService = {
  async getAll(filtros?: PlanoFiltros): Promise<PlanoRecuperacao[]> {
    const params = new URLSearchParams();
    if (filtros?.search) params.append("search", filtros.search);
    if (filtros?.tipo_programa) params.append("tipo_programa", filtros.tipo_programa);
    if (filtros?.status_processo) params.append("status_processo", filtros.status_processo);
    if (filtros?.aluno_id) params.append("aluno_id", String(filtros.aluno_id));
    if (filtros?.ocorrencia_id) params.append("ocorrencia_id", String(filtros.ocorrencia_id));

    const response = await api.get<{ data: PlanoRecuperacao[] }>(
      `/api/planos-recuperacao?${params.toString()}`
    );
    return response.data.data;
  },

  async getById(id: number): Promise<PlanoRecuperacao> {
    const response = await api.get<{ data: PlanoRecuperacao }>(
      `/api/planos-recuperacao/${id}`
    );
    return response.data.data;
  },

  async create(payload: PlanoRecuperacaoPayload): Promise<PlanoRecuperacao> {
    const response = await api.post<{ data: PlanoRecuperacao }>(
      "/api/planos-recuperacao",
      payload
    );
    return response.data.data;
  },

  async update(id: number, payload: Partial<PlanoRecuperacaoPayload>): Promise<PlanoRecuperacao> {
    const response = await api.put<{ data: PlanoRecuperacao }>(
      `/api/planos-recuperacao/${id}`,
      payload
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/planos-recuperacao/${id}`);
  },

  async restaurar(id: number): Promise<PlanoRecuperacao> {
    const response = await api.post<{ message: string; data: PlanoRecuperacao }>(
      `/api/planos-recuperacao/${id}/restaurar`
    );
    return response.data.data;
  },
};
