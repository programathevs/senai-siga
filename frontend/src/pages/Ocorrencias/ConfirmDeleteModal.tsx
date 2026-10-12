import { useState } from "react";
import { Trash2, X, Loader2, User, FileText, Calendar, AlertTriangle } from "lucide-react";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import styles from "./ConfirmDeleteModal.module.css";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ocorrencia: Ocorrencia | null;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  ocorrencia,
}: ConfirmDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !ocorrencia) return null;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // O erro é tratado no componente pai
    } finally {
      setIsSubmitting(false);
    }
  }

  const dataFormatada = ocorrencia.data_ocorrencia
    ? ocorrencia.data_ocorrencia.split("T")[0].split("-").reverse().join("/")
    : "—";

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <Trash2 size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h3 className={styles.title}>Excluir FIAP</h3>
              <p className={styles.subtitle}>Confirmação de remoção da ocorrência</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className={styles.body}>
          {/* Card Resumo do Registro */}
          <div className={styles.fiapSummaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.seqBadge}>{ocorrencia.numero_sequencial}</span>
              <span className={styles.tipoBadge}>
                {ocorrencia.tipo === "falta"
                  ? "Falta (Infrequência)"
                  : ocorrencia.tipo === "comportamento"
                    ? "Comportamento Disciplinar"
                    : "Desempenho Pedagógico"}
              </span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <User size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>Estudante</span>
                  <span className={styles.itemValue}>{ocorrencia.aluno?.nome || "Não informado"}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <FileText size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>RA / Turma</span>
                  <span className={styles.itemValue}>
                    {ocorrencia.aluno?.matricula || "—"} ({ocorrencia.aluno?.turma?.nome || "Sem Turma"})
                  </span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <Calendar size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>Data do Registro</span>
                  <span className={styles.itemValue}>{dataFormatada}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerta de Confirmação e Desdobramentos */}
          <div className={styles.warningBox}>
            <AlertTriangle size={20} className={styles.warningIcon} />
            <div className={styles.warningText}>
              <strong>Atenção: A ocorrência será movida para a lixeira</strong>
              <p>
                Qualquer Plano de Recuperação vinculado a esta FIAP também será arquivado.
                Gestores poderão restaurar o registro a qualquer momento pela lixeira.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Sim, excluir FIAP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
