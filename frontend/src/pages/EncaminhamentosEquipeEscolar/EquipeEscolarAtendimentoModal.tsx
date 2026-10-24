import { useState, useEffect } from "react";
import {
  X,
  Headphones,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  FileCheck,
  FileX,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  equipeEscolarService,
  type EquipeEscolarEncaminhamentoItem,
} from "../../services/equipeEscolarService";
import styles from "./EquipeEscolarAtendimentoModal.module.css";

interface EquipeEscolarAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocorrencia: EquipeEscolarEncaminhamentoItem | null;
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

interface SugestaoItem {
  label: string;
  text: string;
}

const SUGESTOES_JUSTIFICATIVA: SugestaoItem[] = [
  {
    label: "Mudança de postura",
    text: "Estudante reconheceu a conduta inadequada e comprometeu-se com a mudança de postura e foco nas aulas.",
  },
  {
    label: "Dificuldade pedagógica",
    text: "Estudante relatou dificuldades de concentração e compreensão do conteúdo pedagógico.",
  },
  {
    label: "Atestado / Saúde",
    text: "Estudante justificou ausências por motivos de saúde/força maior com documentação comprobatória.",
  },
  {
    label: "Conflito interpessoal",
    text: "Estudante alegou desentendimento interpessoal pontual e aceitou diálogo mediado com os colegas.",
  },
  {
    label: "Alinhamento familiar",
    text: "Responsável legal compareceu ao atendimento e alinhou rotina de estudos em ambiente familiar.",
  },
];

const SUGESTOES_PARECER: SugestaoItem[] = [
  {
    label: "Normas regimentais",
    text: "Orientado(a) quanto às normas regimentais e convivência escolar. Alinhado plano de acompanhamento pedagógico.",
  },
  {
    label: "Reforço no contraturno",
    text: "Encaminhado(a) para apoio pedagógico e reforço escolar no contraturno.",
  },
  {
    label: "Reunião c/ responsáveis",
    text: "Agendada reunião de alinhamento com os responsáveis legais para acompanhamento da frequência e rendimento.",
  },
  {
    label: "Termo de compromisso",
    text: "Estudante advertido(a) formalmente com termo de compromisso pedagógico assinado.",
  },
  {
    label: "Acompanhamento conjunto",
    text: "Alinhado acompanhamento conjunto e contínuo entre coordenação pedagógica e docentes da turma.",
  },
];

export function EquipeEscolarAtendimentoModal({
  isOpen,
  onClose,
  ocorrencia,
  onSuccess,
}: EquipeEscolarAtendimentoModalProps) {
  const { user } = useAuth();

  const [justificativaAluno, setJustificativaAluno] = useState("");
  const [parecerEquipeEscolar, setParecerEquipeEscolar] = useState("");
  const [dataAtendimento, setDataAtendimento] = useState("");
  const [confirmarAssinatura, setConfirmarAssinatura] = useState(false);
  const [compensacaoFaltasAutorizada, setCompensacaoFaltasAutorizada] = useState<
    "pendente" | "nao_autorizado" | "autorizado_atestado" | "autorizado_excepcional"
  >("pendente");
  const [motivoExcepcionalidade, setMotivoExcepcionalidade] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFaltaEstourada =
    ocorrencia?.tipo === "falta" &&
    (ocorrencia.unidades?.some((u) => {
      const lim = u.limite_faltas_aulas;
      return lim != null && lim > 0 && u.quantidade_faltas > lim;
    }) || (ocorrencia.quantidade_faltas || 0) > 4);

  // Inicializa os campos quando a ocorrência for selecionada
  useEffect(() => {
    if (ocorrencia) {
      const recebimento = ocorrencia.equipe_escolar_recebimento || ocorrencia.aqv_recebimento;
      setJustificativaAluno(recebimento?.justificativa_aluno || "");
      setParecerEquipeEscolar(recebimento?.parecer_equipe_escolar || recebimento?.parecer_aqv || "");
      setDataAtendimento(
        formatToDateTimeLocal(recebimento?.data_atendimento)
      );
      setConfirmarAssinatura(
        ocorrencia.status === "assinado" ||
          Boolean(recebimento?.confirmado_em)
      );
      setCompensacaoFaltasAutorizada(
        (recebimento as any)?.compensacao_faltas_autorizada || "pendente"
      );
      setMotivoExcepcionalidade(
        (recebimento as any)?.motivo_excepcionalidade || ""
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

    const willConfirm = confirmSignatureNow || confirmarAssinatura;

    if (willConfirm && !parecerEquipeEscolar.trim()) {
      setErrorMsg(
        "O parecer da Equipe Escolar é obrigatório para confirmar a assinatura e concluir a FIAP."
      );
      return;
    }

    if (
      isFaltaEstourada &&
      (!compensacaoFaltasAutorizada || compensacaoFaltasAutorizada === "pendente")
    ) {
      setErrorMsg(
        "Para FIAPs de falta acima do limite, é obrigatório definir a autorização para compensação de ausências (Não Autorizado, Com Atestado ou Excepcional)."
      );
      return;
    }

    if (
      compensacaoFaltasAutorizada === "autorizado_excepcional" &&
      !motivoExcepcionalidade.trim()
    ) {
      setErrorMsg(
        "Por favor, informe a justificativa da liberação excepcional autorizada pela Direção/Gestão."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await equipeEscolarService.salvarAtendimento(ocorrencia.id, {
        justificativa_aluno: justificativaAluno.trim(),
        parecer_aqv: parecerEquipeEscolar.trim(),
        parecer_equipe_escolar: parecerEquipeEscolar.trim(),
        data_atendimento: dataAtendimento || undefined,
        confirmar_assinatura: willConfirm,
        compensacao_faltas_autorizada: isFaltaEstourada ? compensacaoFaltasAutorizada : undefined,
        motivo_excepcionalidade:
          isFaltaEstourada && compensacaoFaltasAutorizada === "autorizado_excepcional"
            ? motivoExcepcionalidade.trim()
            : undefined,
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
              <h2 className={styles.title}>Atendimento Pedagógico — Equipe Escolar</h2>
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
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resumo da FIAP */}
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <span className={styles.fiapNumber}>{ocorrencia.numero_sequencial}</span>
              <span className={styles.tipoBadge}>
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
                value={user?.name || "Equipe Escolar"}
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

              <div className={styles.sugestoesContainer}>
                <span className={styles.sugestoesLabel}>Sugestões rápidas de justificativa:</span>
                <div className={styles.chipsGrid}>
                  {SUGESTOES_JUSTIFICATIVA.map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.chipButton}
                      onClick={() => setJustificativaAluno((prev) => (prev ? `${prev}\n${sugestao.text}` : sugestao.text))}
                      title={`Inserir: "${sugestao.text}"`}
                    >
                      <Plus size={13} className={styles.chipPlus} />
                      <span>{sugestao.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                Parecer, Recomendações e Encaminhamentos Acordados (Equipe Escolar)
                <span className={styles.required}>*</span>
                <span className={styles.labelHint}>
                  (Obrigatório para concluir e assinar a FIAP)
                </span>
              </label>

              <div className={styles.sugestoesContainer}>
                <span className={styles.sugestoesLabel}>Sugestões rápidas de parecer institucional:</span>
                <div className={styles.chipsGrid}>
                  {SUGESTOES_PARECER.map((sugestao, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={styles.chipButton}
                      onClick={() => setParecerEquipeEscolar((prev) => (prev ? `${prev}\n${sugestao.text}` : sugestao.text))}
                      title={`Inserir: "${sugestao.text}"`}
                    >
                      <Plus size={13} className={styles.chipPlus} />
                      <span>{sugestao.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className={styles.textarea}
                placeholder="Orientações prestadas pela equipe escolar, compromissos pactuados, necessidade de plano de recuperação ou encaminhamentos externos..."
                value={parecerEquipeEscolar}
                onChange={(e) => setParecerEquipeEscolar(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* Triagem de Compensação de Ausências (Exclusivo para FIAP de Falta acima do Limite) */}
            {isFaltaEstourada && (
              <div className={`${styles.formGroupFull} ${styles.decisionSection}`}>
                <div className={styles.decisionHeader}>
                  <div className={styles.decisionTitleGroup}>
                    <AlertTriangle size={18} className={styles.decisionIcon} />
                    <span className={styles.decisionTitle}>
                      Decisão sobre Compensação de Ausências (Faltas Acima do Limite de 100%)
                    </span>
                  </div>
                  <span className={styles.decisionRequiredBadge}>Obrigatório</span>
                </div>

                <p className={styles.decisionDescription}>
                  Defina se o estudante terá direito a compensar as ausências excedentes por meio de Plano de Recuperação (PCA):
                </p>

                <div className={styles.radioCardsGrid}>
                  {/* Opção: Não Autorizado */}
                  <button
                    type="button"
                    className={`${styles.radioCard} ${
                      compensacaoFaltasAutorizada === "nao_autorizado" ? styles.radioCardDangerSelected : ""
                    }`}
                    onClick={() => setCompensacaoFaltasAutorizada("nao_autorizado")}
                  >
                    <div className={styles.radioCardTop}>
                      <div className={styles.radioIndicator}>
                        {compensacaoFaltasAutorizada === "nao_autorizado" && <span className={styles.radioDot} />}
                      </div>
                      <div className={`${styles.cardIconBadge} ${styles.iconBadgeDanger}`}>
                        <FileX size={15} />
                      </div>
                      <span className={styles.radioCardLabel}>Não Autorizado</span>
                    </div>
                    <p className={styles.radioCardDesc}>
                      Faltas injustificadas ou sem amparo legal. Finaliza sem gerar plano de compensação.
                    </p>
                  </button>

                  {/* Opção: Com Atestado Médico */}
                  <button
                    type="button"
                    className={`${styles.radioCard} ${
                      compensacaoFaltasAutorizada === "autorizado_atestado" ? styles.radioCardSuccessSelected : ""
                    }`}
                    onClick={() => setCompensacaoFaltasAutorizada("autorizado_atestado")}
                  >
                    <div className={styles.radioCardTop}>
                      <div className={styles.radioIndicator}>
                        {compensacaoFaltasAutorizada === "autorizado_atestado" && <span className={styles.radioDot} />}
                      </div>
                      <div className={`${styles.cardIconBadge} ${styles.iconBadgeSuccess}`}>
                        <FileCheck size={15} />
                      </div>
                      <span className={styles.radioCardLabel}>Com Atestado / Amparo</span>
                    </div>
                    <p className={styles.radioCardDesc}>
                      Justificativa médica ou legal comprovada. Autoriza docente a elaborar plano.
                    </p>
                  </button>

                  {/* Opção: Em Caráter Excepcional */}
                  <button
                    type="button"
                    className={`${styles.radioCard} ${
                      compensacaoFaltasAutorizada === "autorizado_excepcional" ? styles.radioCardWarningSelected : ""
                    }`}
                    onClick={() => setCompensacaoFaltasAutorizada("autorizado_excepcional")}
                  >
                    <div className={styles.radioCardTop}>
                      <div className={styles.radioIndicator}>
                        {compensacaoFaltasAutorizada === "autorizado_excepcional" && <span className={styles.radioDot} />}
                      </div>
                      <div className={`${styles.cardIconBadge} ${styles.iconBadgeWarning}`}>
                        <AlertCircle size={15} />
                      </div>
                      <span className={styles.radioCardLabel}>Caráter Excepcional</span>
                    </div>
                    <p className={styles.radioCardDesc}>
                      Aprovado pela Gestão / Direção Escolar. Requer justificativa institucional abaixo.
                    </p>
                  </button>
                </div>

                {compensacaoFaltasAutorizada === "autorizado_excepcional" && (
                  <div className={styles.excepcionalidadeBox}>
                    <label className={styles.label}>
                      Justificativa da Excepcionalidade (Aprovada pela Direção/Gestão){" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      className={styles.textarea}
                      rows={2}
                      placeholder="Descreva detalhadamente o motivo da concessão excepcional sem atestado (ex: vulnerabilidade social, luto, alinhamento institucional)..."
                      value={motivoExcepcionalidade}
                      onChange={(e) => setMotivoExcepcionalidade(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Checkbox de Confirmação de Assinatura */}
            <div className={styles.formGroupFull}>
              <div
                className={`${styles.signatureCard} ${confirmarAssinatura ? styles.signatureCardActive : ""}`}
                onClick={() => setConfirmarAssinatura(!confirmarAssinatura)}
              >
                <div className={styles.signatureCheckboxWrapper}>
                  <input
                    type="checkbox"
                    id="confirmar_assinatura_chk"
                    className={styles.checkbox}
                    checked={confirmarAssinatura}
                    onChange={(e) => setConfirmarAssinatura(e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
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

          {!confirmarAssinatura ? (
            <>
              <button
                type="button"
                className={`${styles.saveDraftBtn} ${isSubmitting ? styles.btnDisabled : ""}`}
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                title="Salvar parecer mantendo a FIAP aguardando colheita de assinatura física"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Salvar (Aguardar Assinatura)</span>
              </button>

              <button
                type="button"
                className={`${styles.confirmBtn} ${isSubmitting ? styles.btnDisabled : ""}`}
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                title="Concluir o atendimento formalizando a assinatura"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Concluir & Confirmar Assinatura</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.confirmBtn} ${isSubmitting ? styles.btnDisabled : ""}`}
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>Salvar e Concluir FIAP (Assinado)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
