import React, { useState, useRef } from "react";
import {
  X,
  CloudDownload,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Loader2,
  School,
} from "lucide-react";
import { sgsetService, type SgsetImportResult } from "../../services/sgsetService";
import { showAvatarToast } from "../../utils/toast";
import styles from "./ImportarTurmasModal.module.css";

interface ImportarTurmasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportarTurmasModal: React.FC<ImportarTurmasModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [origem, setOrigem] = useState<"sgset" | "arquivo">("sgset");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<SgsetImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        showAvatarToast("Por favor selecione um arquivo Excel válido (.xlsx ou .xls).", "Formato Inválido", "error");
        return;
      }
      setArquivo(file);
      setResultado(null);
    }
  }

  async function handleImport() {
    if (origem === "arquivo" && !arquivo) {
      showAvatarToast("Por favor selecione uma planilha Excel para importar.", "Arquivo Obrigatório", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await sgsetService.importarTurmas({
        origem,
        arquivo,
        escola: 512,
      });

      setResultado(res);
      showAvatarToast(
        `Importação de turmas concluída: ${res.turmas_criadas || 0} turmas criadas, ${res.turmas_atualizadas || 0} atualizadas.`,
        "Sucesso na Importação",
        "success"
      );
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Erro ao processar importação de turmas.";
      showAvatarToast(msg, "Erro na Importação", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <School size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Importar Turmas e Cursos</h2>
              <div className={styles.subtitle}>Escola 512 - SENAI Sumaré</div>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div>
            <div className={styles.sectionTitle}>1. Escolha a Origem dos Dados</div>
            <div className={styles.sourceGrid}>
              <div
                className={`${styles.sourceCard} ${origem === "sgset" ? styles.sourceCardActive : ""}`}
                onClick={() => { setOrigem("sgset"); setResultado(null); }}
              >
                <div className={styles.sourceHeader}>
                  <CloudDownload size={22} className={styles.sourceIcon} />
                  <input
                    type="radio"
                    name="origem_turmas"
                    checked={origem === "sgset"}
                    onChange={() => setOrigem("sgset")}
                  />
                </div>
                <div className={styles.sourceTitle}>Conexão Direta SGSET</div>
                <div className={styles.sourceDesc}>
                  Importa e atualiza a grade de cursos e turmas oficiais da Escola 512.
                </div>
              </div>

              <div
                className={`${styles.sourceCard} ${origem === "arquivo" ? styles.sourceCardActive : ""}`}
                onClick={() => { setOrigem("arquivo"); setResultado(null); }}
              >
                <div className={styles.sourceHeader}>
                  <FileSpreadsheet size={22} className={styles.sourceIcon} />
                  <input
                    type="radio"
                    name="origem_turmas"
                    checked={origem === "arquivo"}
                    onChange={() => setOrigem("arquivo")}
                  />
                </div>
                <div className={styles.sourceTitle}>Upload de Planilha</div>
                <div className={styles.sourceDesc}>
                  Envie o arquivo (.xlsx) exportado do SGSET contendo a listagem de turmas.
                </div>
              </div>
            </div>
          </div>

          {origem === "arquivo" && (
            <div>
              <div className={styles.sectionTitle}>2. Selecionar Arquivo Excel</div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div
                className={styles.fileDropZone}
                onClick={() => fileInputRef.current?.click()}
              >
                {arquivo ? (
                  <div className={styles.fileSelectedBadge}>
                    <FileSpreadsheet size={18} />
                    <span>{arquivo.name} ({(arquivo.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className={styles.sourceIcon} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      Clique para escolher a planilha ou arraste aqui
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      Formatos aceitos: .xlsx, .xls (máximo 20MB)
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {resultado && (
            <div className={styles.resultCard}>
              <div className={styles.resultTitle}>
                <CheckCircle2 size={18} />
                <span>Grade Processada com Sucesso</span>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: "var(--color-success)" }}>
                    {resultado.turmas_criadas || 0}
                  </div>
                  <div className={styles.statLabel}>Turmas Novas</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: "var(--color-primary)" }}>
                    {resultado.turmas_atualizadas || 0}
                  </div>
                  <div className={styles.statLabel}>Atualizadas</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statVal} style={{ color: "var(--color-text-secondary)" }}>
                    {resultado.cursos_processados || 0}
                  </div>
                  <div className={styles.statLabel}>Cursos</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            {resultado ? "Fechar" : "Cancelar"}
          </button>
          {!resultado && (
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleImport}
              disabled={isLoading || (origem === "arquivo" && !arquivo)}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <CloudDownload size={16} />
                  <span>Iniciar Importação</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
