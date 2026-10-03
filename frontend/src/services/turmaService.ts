import { api } from "./api";
import type { Curso } from "./cursoService";
import type { Instrutor } from "./instrutorService";
import type { PaginatedResponse } from "../types/pagination";

export interface Turma {
  id: number;
  curso_id: number;
  nome: string;
  turno: string | null;
  ano_letivo: string;
  semestre_atual: number | null;
  created_at: string;
  updated_at: string;
  curso?: Curso;
  alunos_count?: number;
  instrutores?: Instrutor[];
  alunos?: Array<{
    id: number;
    turma_id: number | null;
    nome: string;
    matricula: string;
    cpf: string | null;
    email: string | null;
    telefone: string | null;
    status: "ativo" | "inativo" | "transferido";
  }>;
}

export interface TurmaPayload {
  curso_id: number;
  nome: string;
  turno?: string | null;
  ano_letivo: string;
  semestre_atual?: number | null;
  instrutor_ids?: number[];
}

export const turmaService = {
  async getTurmas(params?: {
    search?: string;
    curso_id?: number;
    turno?: string;
    page?: number;
    per_page?: number;
    all?: boolean;
  }): Promise<PaginatedResponse<Turma>> {
    const response = await api.get<PaginatedResponse<Turma>>("/api/turmas", { params });
    return response.data;
  },

  async getTurma(id: number): Promise<Turma> {
    const response = await api.get<{ data: Turma }>(`/api/turmas/${id}`);
    return response.data.data;
  },

  async createTurma(payload: TurmaPayload): Promise<Turma> {
    const response = await api.post<{ message: string; data: Turma }>("/api/turmas", payload);
    return response.data.data;
  },

  async updateTurma(id: number, payload: TurmaPayload): Promise<Turma> {
    const response = await api.put<{ message: string; data: Turma }>(`/api/turmas/${id}`, payload);
    return response.data.data;
  },

  async deleteTurma(id: number): Promise<void> {
    await api.delete(`/api/turmas/${id}`);
  },

  async enturmarAlunos(turmaId: number, alunoIds: number[]): Promise<Turma> {
    const response = await api.post<{ message: string; data: Turma }>(
      `/api/turmas/${turmaId}/enturmar`,
      { aluno_ids: alunoIds }
    );
    return response.data.data;
  },

  async desenturmarAluno(turmaId: number, alunoId: number): Promise<Turma> {
    const response = await api.post<{ message: string; data: Turma }>(
      `/api/turmas/${turmaId}/desenturmar`,
      { aluno_id: alunoId }
    );
    return response.data.data;
  },
};
