import { useState } from "react";
import { Check, X, Loader2, CheckCircle2, User, FileText, Calendar } from "lucide-react";
import type { AqvEncaminhamentoItem } from "../../services/aqvService";
import styles from "./ConfirmAssinaturaModal.module.css";

interface ConfirmAssinaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  item: AqvEncaminhamentoItem | null;
}

export function ConfirmAssinaturaModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: ConfirmAssinaturaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

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

  const dataFormatada = item.data_ocorrencia
    ? item.data_ocorrencia.split("T")[0].split("-").reverse().join("/")
    : "—";

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.iconCircle}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className={styles.title}>Confirmar Assinatura Física</h3>
              <p className={styles.subtitle}>
                Validação de coleta de assinatura do estudante e responsáveis
              </p>
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
              <span className={styles.seqBadge}>{item.numero_sequencial}</span>
              <span className={styles.tipoBadge}>
                {item.tipo === "falta"
                  ? "Falta (Infrequência)"
                  : item.tipo === "comportamento"
                  ? "Comportamento Disciplinar"
                  : "Desempenho Pedagógico"}
              </span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <User size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>Estudante</span>
                  <span className={styles.itemValue}>{item.aluno?.nome || "Não informado"}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <FileText size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>RA / Turma</span>
                  <span className={styles.itemValue}>
                    {item.aluno?.matricula || "—"} ({item.aluno?.turma?.nome || "Sem Turma"})
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
            <CheckCircle2 size={18} className={styles.infoIcon} />
            <div className={styles.infoText}>
              <strong>Confirmação de Documento Físico</strong>
              <p>
                Ao confirmar, você atesta que a folha física desta FIAP foi devidamente colhida e
                assinada. O acolhimento pedagógico da ocorrência será marcado como{" "}
                <strong>Concluído &amp; Assinado</strong>.
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
                Confirmando...
              </>
            ) : (
              <>
                <Check size={16} />
                Confirmar Assinatura
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
