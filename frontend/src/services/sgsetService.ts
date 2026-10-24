import { api } from "./api";

export interface SgsetSyncStatus {
  id: number;
  tipo: string;
  origem: string;
  escola: string;
  status: string;
  usuario: string;
  data_hora: string;
  detalhes?: {
    total?: number;
    criados?: number;
    atualizados?: number;
    inalterados?: number;
    turmas_afetadas?: number;
    turmas_criadas?: number;
    turmas_atualizadas?: number;
    cursos_processados?: number;
    alunos?: {
      criados?: number;
      atualizados?: number;
      inalterados?: number;
      total?: number;
    };
    turmas?: {
      turmas_criadas?: number;
      turmas_atualizadas?: number;
      cursos_processados?: number;
    };
  } | null;
}

export interface ImportarAlunosPayload {
  origem: "sgset" | "arquivo";
  enturmar_automaticamente?: boolean;
  arquivo?: File | null;
  escola?: number;
}

export interface ImportarTurmasPayload {
  origem: "sgset" | "arquivo";
  arquivo?: File | null;
  escola?: number;
}

export interface SgsetImportResult {
  total?: number;
  criados?: number;
  atualizados?: number;
  inalterados?: number;
  turmas_afetadas?: number;
  turmas_criadas?: number;
  turmas_atualizadas?: number;
  cursos_processados?: number;
  erros?: string[];
  alunos?: any;
  turmas?: any;
}

export const sgsetService = {
  async getStatus(): Promise<SgsetSyncStatus | null> {
    const res = await api.get<{ success: boolean; data: SgsetSyncStatus | null }>("/sgset/status");
    return res.data.data;
  },

  async importarAlunos(payload: ImportarAlunosPayload): Promise<SgsetImportResult> {
    const formData = new FormData();
    formData.append("origem", payload.origem);
    formData.append("enturmar_automaticamente", payload.enturmar_automaticamente !== false ? "1" : "0");
    formData.append("escola", String(payload.escola || 512));

    if (payload.origem === "arquivo" && payload.arquivo) {
      formData.append("arquivo", payload.arquivo);
    }

    const res = await api.post<{ success: boolean; message: string; data: SgsetImportResult }>(
      "/alunos/importar",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data.data;
  },

  async importarTurmas(payload: ImportarTurmasPayload): Promise<SgsetImportResult> {
    const formData = new FormData();
    formData.append("origem", payload.origem);
    formData.append("escola", String(payload.escola || 512));

    if (payload.origem === "arquivo" && payload.arquivo) {
      formData.append("arquivo", payload.arquivo);
    }

    const res = await api.post<{ success: boolean; message: string; data: SgsetImportResult }>(
      "/turmas/importar",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data.data;
  },

  async sincronizarGeral(escola = 512, enturmar = true): Promise<any> {
    const res = await api.post<{ success: boolean; message: string; data: any }>(
      "/sgset/sincronizar-geral",
      { escola, enturmar }
    );
    return res.data.data;
  },
};
