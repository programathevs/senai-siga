import { api } from "./api";
import type { PaginatedResponse } from "../types/pagination";

export type UserRoleType = "gestor" | "instrutor" | "aqv";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: UserRoleType;
  email_verified_at?: string | null;
  deve_trocar_senha?: boolean;
  telefone?: string | null;
  instrutor?: {
    id: number;
    telefone?: string | null;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface UsuarioFilters {
  search?: string;
  role?: string;
  page?: number;
  per_page?: number;
  all?: boolean;
}

export interface UsuarioPayload {
  nome: string;
  email: string;
  role: UserRoleType;
  telefone?: string | null;
}

export const usuarioService = {
  async getUsuarios(params?: UsuarioFilters): Promise<PaginatedResponse<Usuario>> {
    const response = await api.get<PaginatedResponse<Usuario>>("/api/usuarios", {
      params,
    });
    return response.data;
  },

  async getUsuario(id: number): Promise<Usuario> {
    const response = await api.get<{ data: Usuario }>(`/api/usuarios/${id}`);
    return response.data.data;
  },

  async createUsuario(data: UsuarioPayload): Promise<Usuario> {
    const response = await api.post<{ message: string; data: Usuario }>(
      "/api/usuarios",
      data
    );
    return response.data.data;
  },

  async updateUsuario(id: number, data: UsuarioPayload): Promise<Usuario> {
    const response = await api.put<{ message: string; data: Usuario }>(
      `/api/usuarios/${id}`,
      data
    );
    return response.data.data;
  },

  async deleteUsuario(id: number): Promise<void> {
    await api.delete(`/api/usuarios/${id}`);
  },
};
