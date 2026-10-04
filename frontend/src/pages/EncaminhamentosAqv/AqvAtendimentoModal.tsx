import { useState, useEffect } from "react";
import { X, Headphones, CheckCircle2, Save, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { aqvService, type AqvEncaminhamentoItem } from "../../services/aqvService";
import styles from "./AqvAtendimentoModal.module.css";

interface AqvAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocorrencia: AqvEncaminhamentoItem | null;
  onSuccess: () => void;
}

function formatToDateTimeLocal(dateStr?: string | null): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AqvAtendimentoModal({
  isOpen,
  onClose,
  ocorrencia,
  onSuccess,
}: AqvAtendimentoModalProps) {
  const { user } = useAuth();

  const [justificativaAluno, setJustificativaAluno] = useState("");
  const [parecerAqv, setParecerAqv] = useState("");
  const [dataAtendimento, setDataAtendimento] = useState("");
  const [confirmarAssinatura, setConfirmarAssinatura] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inicializa os campos quando a ocorrência for selecionada
  useEffect(() => {
    if (ocorrencia) {
      setJustificativaAluno(ocorrencia.aqv_recebimento?.justificativa_aluno || "");
      setParecerAqv(ocorrencia.aqv_recebimento?.parecer_aqv || "");
      setDataAtendimento(
        formatToDateTimeLocal(ocorrencia.aqv_recebimento?.data_atendimento)
      );
      setConfirmarAssinatura(
        ocorrencia.status === "assinado" ||
          Boolean(ocorrencia.aqv_recebimento?.confirmado_em)
      );
      setErrorMsg(null);
    }
  }, [ocorrencia]);

  // Tecla Escape para fechar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !ocorrencia) return null;

  const aluno = ocorrencia.aluno;
  const docenteNome =
    typeof ocorrencia.registrado_por === "object"
      ? ocorrencia.registrado_por?.name
      : ocorrencia.registrado_por_user?.name || "Docente";

  async function handleSubmit(confirmSignatureNow: boolean = false) {
    if (!ocorrencia) return;

    if (!justificativaAluno.trim()) {
      setErrorMsg("Por favor, preencha a justificativa apresentada pelo estudante.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const willConfirm = confirmSignatureNow || confirmarAssinatura;

      await aqvService.salvarAtendimento(ocorrencia.id, {
        justificativa_aluno: justificativaAluno.trim(),
        parecer_aqv: parecerAqv.trim() || undefined,
        data_atendimento: dataAtendimento || undefined,
        confirmar_assinatura: willConfirm,
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      const msg =
        errorObj.response?.data?.message ||
        "Não foi possível salvar o atendimento. Verifique os dados.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <Headphones size={22} />
            </div>
            <div>
              <h2 className={styles.title}>Acolhimento & Atendimento Pedagógico</h2>
              <p className={styles.subtitle}>
                FIAP {ocorrencia.numero_sequencial} • Estudante: {aluno?.nome || "Estudante"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {errorMsg && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius)",
              backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
              color: "var(--color-primary)",
              fontSize: "0.875rem",
              border: "1px solid var(--color-primary)"
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resumo da FIAP */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.fiapNumber}>{ocorrencia.numero_sequencial}</span>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "0.2rem 0.5rem",
                borderRadius: "var(--radius)",
                backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                color: "var(--color-primary)"
              }}>
                {ocorrencia.tipo}
              </span>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Estudante</span>
                <span className={styles.summaryValue}>{aluno?.nome} (Matrícula: {aluno?.matricula})</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Turma & Curso</span>
                <span className={styles.summaryValue}>
                  {aluno?.turma?.nome || "Sem Turma"} {aluno?.turma?.curso ? `• ${aluno.turma.curso.nome}` : ""}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Notificante (Docente)</span>
                <span className={styles.summaryValue}>{docenteNome}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Data da FIAP</span>
                <span className={styles.summaryValue}>{ocorrencia.data_ocorrencia}</span>
              </div>
            </div>

            {ocorrencia.relato_dificuldades && (
              <div className={styles.relatoBox}>
                <strong>Relato / Circunstâncias: </strong>
                {ocorrencia.relato_dificuldades}
              </div>
            )}
          </div>

          {/* Formulário de Acolhimento */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Profissional Responsável pelo Atendimento</label>
              <input
                type="text"
                className={styles.input}
                value={user?.name || "Equipe AQV"}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Data e Horário do Acolhimento
              </label>
              <input
                type="datetime-local"
                className={styles.input}
                value={dataAtendimento}
                onChange={(e) => setDataAtendimento(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>
                Justificativa Formal Apresentada pelo Estudante / Responsável
                <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Descreva detalhadamente o relato e os motivos apresentados pelo estudante durante a entrevista pedagógica..."
                value={justificativaAluno}
                onChange={(e) => setJustificativaAluno(e.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
              <span className={styles.charCount}>
                {justificativaAluno.length} caracteres informados
              </span>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>
                Parecer, Recomendações e Encaminhamentos Acordados (AQV)
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Orientações prestadas pela equipe escolar, compromissos pactuados, necessidade de plano de recuperação ou encaminhamentos externos..."
                value={parecerAqv}
                onChange={(e) => setParecerAqv(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Checkbox de Confirmação de Assinatura */}
            <div
              className={styles.formGroupFull}
              style={{ cursor: "pointer" }}
              onClick={() => setConfirmarAssinatura(!confirmarAssinatura)}
            >
              <div className={styles.signatureCard}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={confirmarAssinatura}
                  onChange={(e) => setConfirmarAssinatura(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className={styles.signatureInfo}>
                  <span className={styles.signatureTitle}>
                    Documento físico da FIAP assinado pelo estudante ou responsável legal
                  </span>
                  <span className={styles.signatureDesc}>
                    Marque esta opção para formalizar que a folha física da FIAP foi colhida com assinatura e arquivada, atualizando o status final da ocorrência para <strong>Assinado</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>

          {!confirmarAssinatura && (
            <button
              type="button"
              className={`${styles.saveDraftBtn} ${isSubmitting ? styles.btnDisabled : ""}`}
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Salvar em Andamento</span>
            </button>
          )}

          <button
            type="button"
            className={`${styles.confirmBtn} ${isSubmitting ? styles.btnDisabled : ""}`}
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            <span>{confirmarAssinatura ? "Salvar e Concluir FIAP" : "Concluir & Confirmar Assinatura"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
