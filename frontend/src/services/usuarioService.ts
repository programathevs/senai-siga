import { api } from "./api";
import type { PaginatedResponse } from "../types/pagination";

export type UserRoleType = "gestor" | "instrutor" | "equipe_escolar" | "aqv";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: UserRoleType;
  foto?: string | null;
  foto_url?: string | null;
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
  foto?: File | null;
  remover_foto?: boolean;
}

export const usuarioService = {
  async getUsuarios(
    params?: UsuarioFilters,
    signalOrOptions?: AbortSignal | { signal?: AbortSignal }
  ): Promise<PaginatedResponse<Usuario>> {
    const signal = signalOrOptions instanceof AbortSignal ? signalOrOptions : signalOrOptions?.signal;
    const response = await api.get<PaginatedResponse<Usuario>>("/api/usuarios", {
      params,
      signal,
    });
    return response.data;
  },

  async getUsuario(id: number): Promise<Usuario> {
    const response = await api.get<{ data: Usuario }>(`/api/usuarios/${id}`);
    return response.data.data;
  },

  async createUsuario(data: UsuarioPayload): Promise<Usuario> {
    if (data.foto instanceof File) {
      const formData = new FormData();
      formData.append("nome", data.nome);
      formData.append("email", data.email);
      formData.append("role", data.role);
      if (data.telefone) formData.append("telefone", data.telefone);
      formData.append("foto", data.foto);

      const response = await api.post<{ message: string; data: Usuario }>(
        "/api/usuarios",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    }

    const response = await api.post<{ message: string; data: Usuario }>(
      "/api/usuarios",
      data
    );
    return response.data.data;
  },

  async updateUsuario(id: number, data: UsuarioPayload): Promise<Usuario> {
    if (data.foto instanceof File || data.remover_foto) {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("nome", data.nome);
      formData.append("email", data.email);
      formData.append("role", data.role);
      if (data.telefone !== undefined) formData.append("telefone", data.telefone || "");
      if (data.foto instanceof File) formData.append("foto", data.foto);
      if (data.remover_foto) formData.append("remover_foto", "1");

      const response = await api.post<{ message: string; data: Usuario }>(
        `/api/usuarios/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data.data;
    }

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
