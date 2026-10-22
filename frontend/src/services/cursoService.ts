import { api } from "./api";
import type { PaginatedResponse } from "../types/pagination";

export interface UnidadeCurricular {
  id?: number;
  curso_id?: number;
  nome: string;
  sigla?: string | null;
  carga_horaria: number;
  semestre_plano_3: number | null;
  semestre_plano_4: number | null;
}

export interface Curso {
  id: number;
  nome: string;
  carga_horaria_total: number | null;
  unidades_curriculares?: UnidadeCurricular[];
  created_at: string;
  updated_at: string;
}

export interface CursoPayload {
  nome: string;
  carga_horaria_total?: number | null;
  unidades_curriculares?: UnidadeCurricular[];
}

export const cursoService = {
  async getCursos(
    params?: {
      search?: string;
      page?: number;
      per_page?: number;
      all?: boolean;
    } | string,
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<PaginatedResponse<Curso>> {
    const queryParams = typeof params === "string" ? { search: params } : params;
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<PaginatedResponse<Curso>>("/api/cursos", {
      params: queryParams,
      signal,
    });
    return response.data;
  },

  async getCurso(id: number, signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<Curso> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<{ data: Curso }>(`/api/cursos/${id}`, { signal });
    return response.data.data;
  },

  async createCurso(payload: CursoPayload): Promise<Curso> {
    const response = await api.post<{ message: string; data: Curso }>(
      "/api/cursos",
      payload
    );
    return response.data.data;
  },

  async updateCurso(id: number, payload: CursoPayload): Promise<Curso> {
    const response = await api.put<{ message: string; data: Curso }>(
      `/api/cursos/${id}`,
      payload
    );
    return response.data.data;
  },

  async deleteCurso(id: number): Promise<void> {
    await api.delete(`/api/cursos/${id}`);
  },
};
