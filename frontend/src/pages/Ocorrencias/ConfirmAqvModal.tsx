import { useState } from "react";
import { Send, X, Loader2, Headphones, User, FileText, Calendar } from "lucide-react";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import styles from "./ConfirmAqvModal.module.css";

interface ConfirmAqvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  ocorrencia: Ocorrencia | null;
}

export function ConfirmAqvModal({
  isOpen,
  onClose,
  onConfirm,
  ocorrencia,
}: ConfirmAqvModalProps) {
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
              <Headphones size={22} color="var(--color-primary)" />
            </div>
            <div>
              <h3 className={styles.title}>Encaminhar FIAP</h3>
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
                Encaminhando...
              </>
            ) : (
              <>
                <Send size={16} />
                Sim, enviar para a AQV
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
