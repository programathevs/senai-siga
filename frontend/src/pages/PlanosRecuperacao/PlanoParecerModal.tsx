import React, { useState, useEffect } from "react";
import { X, CheckCircle2, AlertTriangle, Loader2, Headphones } from "lucide-react";
import { planoRecuperacaoService, type PlanoRecuperacao } from "../../services/planoRecuperacaoService";
import { showAvatarToast } from "../../utils/toast";
import styles from "./PlanoParecerModal.module.css";

interface PlanoParecerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plano: PlanoRecuperacao | null;
}

const SUGESTOES_ACEITE = [
  "Plano pedagógico de recuperação aprovado pela Equipe Escolar.",
  "Metodologias e instrumentos adequados às necessidades do estudante.",
  "Cronograma e metas acordados em conformidade com as diretrizes institucionais.",
];

const SUGESTOES_RECUSA = [
  "Recusado: Necessário redefinir os instrumentos de avaliação e o cronograma proposto.",
  "Recusado: Incompatibilidade de carga horária com o regime do estudante.",
  "Recusado: Metodologias insuficientes para suprir as defasagens diagnosticadas.",
];

export const PlanoParecerModal: React.FC<PlanoParecerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plano,
}) => {
  const [decisao, setDecisao] = useState<"aceitar" | "recusar">("aceitar");
  const [justificativa, setJustificativa] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDecisao("aceitar");
      setJustificativa("");
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !plano) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!plano) return;

    if (decisao === "recusar" && !justificativa.trim()) {
      setError("A justificativa técnica é obrigatória para a recusa do Plano de Recuperação.");
      return;
    }

    try {
      setIsSubmitting(true);
      await planoRecuperacaoService.emitirParecerEquipeEscolar(plano.id, {
        decisao: decisao === "aceitar" ? "aceito" : "recusado",
        parecer: justificativa.trim() || undefined,
      });

      showAvatarToast(
        decisao === "aceitar"
          ? `Plano de Recuperação #${plano.id} aceito com sucesso pela Equipe Escolar!`
          : `Plano de Recuperação #${plano.id} recusado com justificativa institucional.`,
        "Parecer Registrado",
        decisao === "aceitar" ? "success" : "warning"
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar parecer da Equipe Escolar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const sugestoes = decisao === "aceitar" ? SUGESTOES_ACEITE : SUGESTOES_RECUSA;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <Headphones size={18} />
            </div>
            <h2 className={styles.title}>Parecer da Equipe Escolar</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div style={{ color: "var(--color-danger, #ef4444)", fontSize: "0.875rem", fontWeight: 600 }}>
              {error}
            </div>
          )}

          {/* Resumo do Plano */}
          <div className={styles.planoSummaryCard}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Estudante:</span>
              <span className={styles.summaryValue}>{plano.aluno?.nome || "—"} (RA: {plano.aluno?.matricula || "—"})</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>FIAP Vinculada:</span>
              <span className={styles.summaryValue}>{plano.ocorrencia?.numero_sequencial || `#${plano.ocorrencia_id || "—"}`}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Docente Responsável:</span>
              <span className={styles.summaryValue}>{plano.registrado_por_user?.name || "Docente"}</span>
            </div>
          </div>

          {/* Decisão */}
          <div className={styles.decisionSection}>
            <span className={styles.decisionLabel}>Parecer da Equipe Escolar sobre o Plano:</span>
            <div className={styles.decisionGrid}>
              <button
                type="button"
                className={`${styles.decisionBtn} ${decisao === "aceitar" ? styles.decisionBtnAceitarActive : ""}`}
                onClick={() => setDecisao("aceitar")}
              >
                <CheckCircle2 size={16} />
                <span>Aceitar Plano</span>
              </button>
              <button
                type="button"
                className={`${styles.decisionBtn} ${decisao === "recusar" ? styles.decisionBtnRecusarActive : ""}`}
                onClick={() => setDecisao("recusar")}
              >
                <AlertTriangle size={16} />
                <span>Recusar Plano</span>
              </button>
            </div>
          </div>

          {/* Sugestões Rápidas */}
          <div className={styles.sugestoesContainer}>
            <span className={styles.sugestoesLabel}>Sugestões rápidas de parecer:</span>
            <div className={styles.chipsGrid}>
              {sugestoes.map((sugestao, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.chipButton}
                  onClick={() => setJustificativa((prev) => (prev ? `${prev}\n${sugestao}` : sugestao))}
                  title="Clique para preencher"
                >
                  + {sugestao}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Justificativa / Parecer */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Parecer Técnico e Recomendações
              {decisao === "recusar" && <span className={styles.required}>* (Obrigatório)</span>}
            </label>
            <textarea
              className={styles.textarea}
              placeholder={
                decisao === "recusar"
                  ? "Informe a justificativa pedagógica/institucional para a recusa do plano..."
                  : "Orientações ou observações pedagógicas complementares da Equipe Escolar..."
              }
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              style={{
                backgroundColor: decisao === "recusar" ? "#dc2626" : "var(--color-primary)",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {decisao === "aceitar" ? "Confirmar Aceite do Plano" : "Confirmar Recusa do Plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
