import { api } from "./api";

export interface UnidadeCurricular {
  id?: number;
  curso_id?: number;
  nome: string;
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
  async getCursos(search?: string): Promise<Curso[]> {
    const response = await api.get<{ data: Curso[] }>("/api/cursos", {
      params: search ? { search } : undefined,
    });
    return response.data.data;
  },

  async getCurso(id: number): Promise<Curso> {
    const response = await api.get<{ data: Curso }>(`/api/cursos/${id}`);
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
