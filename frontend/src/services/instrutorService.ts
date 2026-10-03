import { api } from "./api";
import type { User } from "../contexts/AuthContext";
import type { PaginatedResponse } from "../types/pagination";

export interface Instrutor {
  id: number;
  user_id: number;
  telefone: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface InstrutorPayload {
  nome: string;
  email: string;
  telefone?: string | null;
}

export const instrutorService = {
  async getInstrutores(
    params?: {
      search?: string;
      page?: number;
      per_page?: number;
      all?: boolean;
    } | string
  ): Promise<PaginatedResponse<Instrutor>> {
    const queryParams = typeof params === "string" ? { search: params } : params;
    const response = await api.get<PaginatedResponse<Instrutor>>("/api/instrutores", {
      params: queryParams,
    });
    return response.data;
  },

  async getInstrutor(id: number): Promise<Instrutor> {
    const response = await api.get<{ data: Instrutor }>(`/api/instrutores/${id}`);
    return response.data.data;
  },

  async createInstrutor(payload: InstrutorPayload): Promise<Instrutor> {
    const response = await api.post<{ message: string; data: Instrutor }>(
      "/api/instrutores",
      payload
    );
    return response.data.data;
  },

  async updateInstrutor(id: number, payload: InstrutorPayload): Promise<Instrutor> {
    const response = await api.put<{ message: string; data: Instrutor }>(
      `/api/instrutores/${id}`,
      payload
    );
    return response.data.data;
  },

  async deleteInstrutor(id: number): Promise<void> {
    await api.delete(`/api/instrutores/${id}`);
  },
};
