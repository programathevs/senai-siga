import { api } from "./api";
import type { Turma } from "./turmaService";
import type { Ocorrencia } from "./ocorrenciaService";
import type { PaginatedResponse } from "../types/pagination";

export interface Aluno {
  id: number;
  turma_id: number | null;
  nome: string;
  matricula: string;
  ra?: string;
  cpf: string | null;
  data_nascimento: string | null;
  is_maior_de_idade?: boolean;
  email: string | null;
  telefone: string | null;
  foto?: string | null;
  foto_url?: string | null;
  status: "ativo" | "inativo" | "transferido";
  created_at: string;
  updated_at: string;
  turma?: Turma;
  turmas?: Array<Turma & { pivot?: { ra?: string; status?: string } }>;
}

export interface AlunoOption {
  id: number;
  nome: string;
  ra: string;
  matricula?: string;
  turma_id?: number | null;
}

export interface AlunoPayload {
  turma_id?: number | null;
  segunda_turma_id?: number | null;
  segundo_ra?: string | null;
  nome: string;
  matricula: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  email?: string | null;
  telefone?: string | null;
  status?: "ativo" | "inativo" | "transferido";
  foto?: File | null;
  remover_foto?: boolean;
}

export interface AlunoHistorico {
  aluno: Aluno;
  estatisticas: {
    total_ocorrencias: number;
    total_faltas: number;
    planos_recuperacao_ativos: number;
  };
  ocorrencias: Ocorrencia[];
}

export const alunoService = {
  async getAlunos<T = Aluno>(
    params?: {
      search?: string;
      turma_id?: number | string;
      status?: string;
      page?: number;
      per_page?: number;
      all?: boolean;
      options?: boolean;
    },
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<PaginatedResponse<T>> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<PaginatedResponse<T>>("/api/alunos", { params, signal });
    return response.data;
  },

  async getAluno(id: number, signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<Aluno> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<{ data: Aluno }>(`/api/alunos/${id}`, { signal });
    return response.data.data;
  },

  async createAluno(payload: AlunoPayload): Promise<Aluno> {
    if (payload.foto instanceof File) {
      const formData = new FormData();
      formData.append("nome", payload.nome);
      formData.append("matricula", payload.matricula);
      if (payload.turma_id) formData.append("turma_id", String(payload.turma_id));
      if (payload.cpf) formData.append("cpf", payload.cpf);
      if (payload.data_nascimento) formData.append("data_nascimento", payload.data_nascimento);
      if (payload.email) formData.append("email", payload.email);
      if (payload.telefone) formData.append("telefone", payload.telefone);
      if (payload.status) formData.append("status", payload.status);
      if (payload.segunda_turma_id) formData.append("segunda_turma_id", String(payload.segunda_turma_id));
      if (payload.segundo_ra) formData.append("segundo_ra", payload.segundo_ra);
      formData.append("foto", payload.foto);

      const response = await api.post<{ message: string; data: Aluno }>("/api/alunos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    }

    const response = await api.post<{ message: string; data: Aluno }>("/api/alunos", payload);
    return response.data.data;
  },

  async updateAluno(id: number, payload: AlunoPayload): Promise<Aluno> {
    if (payload.foto instanceof File || payload.remover_foto) {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("nome", payload.nome);
      formData.append("matricula", payload.matricula);
      if (payload.turma_id !== undefined) formData.append("turma_id", payload.turma_id ? String(payload.turma_id) : "");
      if (payload.segunda_turma_id !== undefined) formData.append("segunda_turma_id", payload.segunda_turma_id ? String(payload.segunda_turma_id) : "");
      if (payload.segundo_ra !== undefined) formData.append("segundo_ra", payload.segundo_ra || "");
      if (payload.cpf !== undefined) formData.append("cpf", payload.cpf || "");
      if (payload.data_nascimento !== undefined) formData.append("data_nascimento", payload.data_nascimento || "");
      if (payload.email !== undefined) formData.append("email", payload.email || "");
      if (payload.telefone !== undefined) formData.append("telefone", payload.telefone || "");
      if (payload.status) formData.append("status", payload.status);
      if (payload.foto instanceof File) formData.append("foto", payload.foto);
      if (payload.remover_foto) formData.append("remover_foto", "1");

      const response = await api.post<{ message: string; data: Aluno }>(`/api/alunos/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    }

    const response = await api.put<{ message: string; data: Aluno }>(`/api/alunos/${id}`, payload);
    return response.data.data;
  },

  async uploadFoto(id: number, file: File): Promise<Aluno> {
    const formData = new FormData();
    formData.append("foto", file);
    const response = await api.post<{ message: string; data: Aluno }>(`/api/alunos/${id}/foto`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  async deleteAluno(id: number): Promise<void> {
    await api.delete(`/api/alunos/${id}`);
  },

  async getHistorico(id: number, signalOrOptions?: AbortSignal | { signal?: AbortSignal }): Promise<AlunoHistorico> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<{ data: AlunoHistorico }>(`/api/alunos/${id}/historico`, { signal });
    return response.data.data;
  },
};
