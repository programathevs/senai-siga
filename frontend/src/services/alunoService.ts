import { api } from "./api";
import type { Turma } from "./turmaService";

export interface Aluno {
  id: number;
  turma_id: number | null;
  nome: string;
  matricula: string;
  cpf: string | null;
  data_nascimento: string | null;
  email: string | null;
  telefone: string | null;
  status: "ativo" | "inativo" | "transferido";
  created_at: string;
  updated_at: string;
  turma?: Turma;
}

export interface AlunoPayload {
  turma_id?: number | null;
  nome: string;
  matricula: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: "ativo" | "inativo" | "transferido";
}

export interface AlunoHistorico {
  aluno: Aluno;
  estatisticas: {
    total_ocorrencias: number;
    total_faltas: number;
    planos_recuperacao_ativos: number;
  };
  ocorrencias: any[];
}

export const alunoService = {
  async getAlunos(params?: {
    search?: string;
    turma_id?: number | string;
    status?: string;
  }): Promise<Aluno[]> {
    const response = await api.get<{ data: Aluno[] }>("/api/alunos", { params });
    return response.data.data;
  },

  async getAluno(id: number): Promise<Aluno> {
    const response = await api.get<{ data: Aluno }>(`/api/alunos/${id}`);
    return response.data.data;
  },

  async createAluno(payload: AlunoPayload): Promise<Aluno> {
    const response = await api.post<{ message: string; data: Aluno }>("/api/alunos", payload);
    return response.data.data;
  },

  async updateAluno(id: number, payload: AlunoPayload): Promise<Aluno> {
    const response = await api.put<{ message: string; data: Aluno }>(`/api/alunos/${id}`, payload);
    return response.data.data;
  },

  async deleteAluno(id: number): Promise<void> {
    await api.delete(`/api/alunos/${id}`);
  },

  async getHistorico(id: number): Promise<AlunoHistorico> {
    const response = await api.get<{ data: AlunoHistorico }>(`/api/alunos/${id}/historico`);
    return response.data.data;
  },
};
