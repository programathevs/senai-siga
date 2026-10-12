import { useState } from "react";
import { RotateCcw, X, Loader2, User, FileText, BookOpen, CheckCircle2 } from "lucide-react";
import type { PlanoRecuperacao } from "../../services/planoRecuperacaoService";
import styles from "./ConfirmRestorePlanoModal.module.css";

interface ConfirmRestorePlanoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  plano: PlanoRecuperacao | null;
}

export function ConfirmRestorePlanoModal({
  isOpen,
  onClose,
  onConfirm,
  plano,
}: ConfirmRestorePlanoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !plano) return null;

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

  const tipoLabel =
    plano.tipo_programa === "recuperacao_paralela"
      ? "Recuperação Paralela (PRP)"
      : plano.tipo_programa === "compensacao_ausencia"
        ? "Compensação de Ausências (PCA)"
        : "Recuperação Final";

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
              <h3 className={styles.title}>Restaurar Plano de Recuperação</h3>
              <p className={styles.subtitle}>Confirmação de restauração do plano</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className={styles.body}>
          {/* Card Resumo do Registro */}
          <div className={styles.planoSummaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.seqBadge}>Plano #{plano.id}</span>
              <span className={styles.tipoBadge}>{tipoLabel}</span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <User size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>Estudante</span>
                  <span className={styles.itemValue}>{plano.aluno?.nome || "Não informado"}</span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <FileText size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>RA / Turma</span>
                  <span className={styles.itemValue}>
                    {plano.aluno?.matricula || "—"} ({plano.aluno?.turma?.nome || "Sem Turma"})
                  </span>
                </div>
              </div>

              <div className={styles.summaryItem}>
                <BookOpen size={15} className={styles.itemIcon} />
                <div>
                  <span className={styles.itemLabel}>Unidade Curricular / FIAP</span>
                  <span className={styles.itemValue}>
                    {plano.unidade_curricular?.nome || "Geral"}
                    {plano.ocorrencia?.numero_sequencial ? ` • ${plano.ocorrencia.numero_sequencial}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Caixa Informativa */}
          <div className={styles.infoBox}>
            <CheckCircle2 size={20} className={styles.infoIcon} />
            <div className={styles.infoText}>
              <strong>Atenção: O plano sairá da lixeira</strong>
              <p>
                O plano voltará à listagem ativa. Caso a FIAP vinculada também estivesse na lixeira,
                ela será restaurada automaticamente junto a este plano.
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
                Sim, restaurar Plano
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
