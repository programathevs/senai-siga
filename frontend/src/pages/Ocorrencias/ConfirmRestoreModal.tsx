import { useState } from "react";
import { RotateCcw, X, Loader2, User, FileText, Calendar, CheckCircle2 } from "lucide-react";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import styles from "./ConfirmRestoreModal.module.css";

interface ConfirmRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ocorrencia: Ocorrencia | null;
}

export function ConfirmRestoreModal({
  isOpen,
  onClose,
  onConfirm,
  ocorrencia,
}: ConfirmRestoreModalProps) {
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
              <RotateCcw size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h3 className={styles.title}>Restaurar FIAP</h3>
              <p className={styles.subtitle}>Confirmação de restauração do registro</p>
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

          {/* Caixa Informativa */}
          <div className={styles.infoBox}>
            <CheckCircle2 size={20} className={styles.infoIcon} />
            <div className={styles.infoText}>
              <strong>Atenção: A ocorrência sairá da lixeira</strong>
              <p>
                A FIAP voltará a ficar disponível na listagem ativa. Quaisquer Planos de
                Recuperação vinculados a ela também serão restaurados automaticamente.
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
                Restaurando...
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                Sim, restaurar FIAP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
