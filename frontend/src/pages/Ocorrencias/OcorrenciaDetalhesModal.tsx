import { useState, useEffect } from "react";
import {
  X,
  Printer,
  Headphones,
  Download,
  Loader2,
  Edit2,
  History,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { printElementAsPdf } from "../../utils/printPdf";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import { useAuth } from "../../contexts/AuthContext";
import { showAvatarToast } from "../../utils/toast";
import senaiLogo from "../../assets/senai-logo.jpg";
import styles from "./OcorrenciaDetalhesModal.module.css";

interface OcorrenciaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  ocorrencia: Ocorrencia | null;
  onEncaminharAqv?: (id: number) => void;
  onEdit?: (ocorrencia: Ocorrencia) => void;
  canEdit?: boolean;
}

export function OcorrenciaDetalhesModal({
  isOpen,
  onClose,
  ocorrencia,
  onEncaminharAqv,
  onEdit,
  canEdit,
}: OcorrenciaDetalhesModalProps) {
  const { user } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    function handleAfterPrint() {
      window.focus();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus?.();
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("afterprint", handleAfterPrint);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ocorrencia) return null;

  const isBloqueada = ocorrencia.status === "aguardando_assinatura" || ocorrencia.status === "assinado";

  const canSendAqv = (() => {
    if (
      ocorrencia.status === "enviado_aqv" ||
      ocorrencia.status === "enviado_equipe_escolar" ||
      isBloqueada ||
      !user
    ) return false;
    if (user.role === "gestor") return true;
    if (user.role === "instrutor") {
      const regId = typeof ocorrencia.registrado_por === "number" ? ocorrencia.registrado_por : ocorrencia.registrado_por?.id;
      const creatorId = ocorrencia.registrado_por_user?.id || ocorrencia.registrado_por_id || regId;
      return creatorId === user.id;
    }
    return false;
  })();

  const aluno = ocorrencia.aluno;
  const primaryUc =
    ocorrencia.unidades && ocorrencia.unidades.length > 0
      ? ocorrencia.unidades[0]
      : null;

  // Formatação do número sequencial (ex: 0163/2026 a partir de FIAP-2026-0001 ou sequencial puro)
  const formatSequentialNumber = (seq?: string): string => {
    if (!seq) {
      return `0001/${new Date().getFullYear()}`;
    }
    if (seq.includes("/")) {
      return seq;
    }
    if (seq.startsWith("FIAP-")) {
      const parts = seq.split("-");
      const year = parts[1] || new Date().getFullYear();
      const num = parts[2] || "0001";
      return `${num}/${year}`;
    }
    return `${seq.padStart(4, "0")}/${new Date().getFullYear()}`;
  };

  const formattedSeq = formatSequentialNumber(ocorrencia.numero_sequencial);

  const unidades = ocorrencia.unidades && ocorrencia.unidades.length > 0 ? ocorrencia.unidades : [];
  const quantidadeFaltas = primaryUc?.quantidade_faltas ?? 0;
  const horasTotais = primaryUc?.unidade_curricular?.carga_horaria || 80;
  const limiteFaltasAulas = Math.round((horasTotais / 0.75) * 0.25);

  const compCurricularDisplay = (() => {
    if (unidades.length > 0) {
      return unidades.map((u) => u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC").join(" / ");
    }
    const ucObj = primaryUc?.unidade_curricular || (ocorrencia as any).unidade_curricular;
    if (ucObj?.nome) {
      return ucObj.sigla ? `${ucObj.nome} (${ucObj.sigla})` : ucObj.nome;
    }
    return ocorrencia.tipo === "comportamento"
      ? "Sem unidade curricular vinculada (Normas de Convivência / Regimento Escolar)"
      : ocorrencia.tipo === "desempenho"
        ? "Sem unidade curricular vinculada (Acompanhamento Pedagógico)"
        : "Não informada";
  })();

  const faltasDisplay = ocorrencia.tipo !== "falta"
    ? "----"
    : unidades.length > 0
      ? unidades.map((u) => `${u.quantidade_faltas} (${u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC"})`).join(" / ")
      : `${quantidadeFaltas} faltas`;

  const limiteFaltasDisplay = ocorrencia.tipo !== "falta"
    ? "----"
    : unidades.length > 0
      ? unidades.map((u) => {
        const ch = u.unidade_curricular?.carga_horaria || 80;
        const lim = Math.round((ch / 0.75) * 0.25);
        const sigla = u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC";
        return `${lim} (${sigla})`;
      }).join(" / ")
      : `${limiteFaltasAulas}`;

  const nomeDocente =
    ocorrencia.registrado_por_user?.name ||
    (ocorrencia.instrutores && ocorrencia.instrutores.length > 0
      ? ocorrencia.instrutores[0].user?.name
      : "Docente Responsável");

  const nomeAluno = aluno?.nome || "Aluno(a)";
  const nomeTurma = aluno?.turma?.nome || "Turma não informada";

  const dataFormatada = (() => {
    if (!ocorrencia.data_ocorrencia) return new Date().toLocaleDateString("pt-BR");
    const clean = ocorrencia.data_ocorrencia.includes("T")
      ? ocorrencia.data_ocorrencia.split("T")[0]
      : ocorrencia.data_ocorrencia.split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
    const d = new Date(ocorrencia.data_ocorrencia);
    return isNaN(d.getTime()) ? ocorrencia.data_ocorrencia : d.toLocaleDateString("pt-BR");
  })();

  const relatoPartes = unidades.map((u) => {
    const siglaOuNome = u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC";
    const ch = Number(u.unidade_curricular?.carga_horaria) || 80;
    const aulas = Math.round(ch / 0.75);
    const lim = Math.round(aulas * 0.25);
    const perc = Number(u.percentual_atingido || (lim > 0 ? (u.quantidade_faltas / lim) * 100 : 0)).toFixed(1);
    return `unidade curricular ${siglaOuNome} – ${ch} h/a: possui até a data de hoje ${u.quantidade_faltas} faltas, representando ${perc}% do limite permitido (${lim} aulas)`;
  });

  let textoUnidadesGenerico = "";
  if (relatoPartes.length === 1) {
    textoUnidadesGenerico = relatoPartes[0];
  } else if (relatoPartes.length > 1) {
    const copy = [...relatoPartes];
    const ultima = copy.pop();
    textoUnidadesGenerico = copy.join("; ") + " e " + ultima;
  }

  // Recomendações e textos institucionais padrão
  const relatoPadrao = textoUnidadesGenerico
    ? `O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas nas: ${textoUnidadesGenerico}.`
    : `O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas.`;

  const recomendacoesProfessorPadrao =
    "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar.";

  const aqvRec = ocorrencia.aqv_recebimento || (ocorrencia as any).aqvRecebimento;
  const justificativaEstudante = aqvRec?.justificativa_aluno || "";
  const parecerEquipeEscolar = aqvRec?.parecer_aqv || "";

  // Verificação de maioridade do aluno (18 anos ou mais na data do registro/ocorrência)
  const isMaiorDeIdade = (() => {
    if (aluno && typeof (aluno as any).is_maior_de_idade === "boolean") {
      return (aluno as any).is_maior_de_idade;
    }

    if (!aluno?.data_nascimento) {
      // Se não houver data de nascimento informada, assume menor de idade para exigir assinatura do responsável
      return false;
    }

    const clean = aluno.data_nascimento.includes("T")
      ? aluno.data_nascimento.split("T")[0]
      : aluno.data_nascimento.split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      const anoNasc = parseInt(parts[0], 10);
      const mesNasc = parseInt(parts[1], 10) - 1;
      const diaNasc = parseInt(parts[2], 10);

      const dataRef = ocorrencia.data_ocorrencia
        ? new Date(ocorrencia.data_ocorrencia.split("T")[0] + "T12:00:00")
        : new Date();

      let idade = dataRef.getFullYear() - anoNasc;
      const m = dataRef.getMonth() - mesNasc;
      if (m < 0 || (m === 0 && dataRef.getDate() < diaNasc)) {
        idade--;
      }
      return idade >= 18;
    }

    return false;
  })();

  async function handlePrint() {
    const element = document.getElementById("content-to-pdf");
    if (!element) return;

    setIsPrinting(true);
    try {
      const nomeSanitizado = (aluno?.nome || "Aluno").replace(/\s+/g, "");
      const primarySigla = primaryUc?.unidade_curricular?.sigla;
      const primaryNome = primaryUc?.unidade_curricular?.nome || "Componente";
      const siglaComp = primarySigla || primaryNome.substring(0, 10).replace(/\s+/g, "");

      const options = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `FIAP_${nomeSanitizado}_${siglaComp}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 800,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await printElementAsPdf(element, options);
    } catch (err) {
      console.error("Erro ao preparar impressão da FIAP:", err);
      window.print();
    } finally {
      setIsPrinting(false);
      window.focus();
      document.body.style.pointerEvents = "";
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  async function handleDownloadPdf() {
    const element = document.getElementById("content-to-pdf");
    if (!element) return;

    setIsGeneratingPdf(true);
    try {
      const nomeSanitizado = (aluno?.nome || "Aluno").replace(/\s+/g, "");
      const primarySigla = primaryUc?.unidade_curricular?.sigla;
      const primaryNome = primaryUc?.unidade_curricular?.nome || "Componente";
      const siglaComp = primarySigla || primaryNome.substring(0, 10).replace(/\s+/g, "");

      const options = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `FIAP_${nomeSanitizado}_${siglaComp}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
          windowWidth: 800,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      showAvatarToast(
        "Não foi possível gerar o PDF. Você pode utilizar a opção Imprimir.",
        "Aviso",
        "warning"
      );
    } finally {
      setIsGeneratingPdf(false);
      window.focus();
      document.body.style.pointerEvents = "";
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      data-print-modal="true"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.title}>Visualização de FIAP Oficial</h2>
            <span className={styles.subtitle}>
              Ficha Individual de Avaliação Periódica — Padrão SENAI Unidade Sumaré
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com a Ficha Oficial A4 */}
        <div className={styles.modalBody}>
          <main id="content-to-pdf" className={styles.contentPdfContainer}>
            {/* Topo Institucional */}
            <section className={styles.headerContainer}>
              <img className={styles.logoImage} src={senaiLogo} alt="Logo SENAI" />

              <div className={styles.headerTextContainer}>
                <h1 className={styles.headerTitle}>
                  ESCOLA SENAI “Dr. Celso Charuri” – Unidade Sumaré
                </h1>
                <div className={styles.headerDetails}>
                  <p className={`${styles.headerDetailsItem} ${styles.headerToken}`}>
                    Ficha Individual de Avaliação Periódica (Deliberação CEE nº 11/96, art. 1º §
                    1º, § 2º e § 3º e Circular DE nº 001/97)
                  </p>
                  <p className={`${styles.headerDetailsItem} ${styles.headerSequential}`}>
                    Nº Sequencial: {formattedSeq}
                  </p>
                  <div className={`${styles.headerDetailsItem} ${styles.headerVersion}`}>
                    <span>VERSÃO</span>
                    <span>V. {String(ocorrencia.versao || 1).padStart(2, "0")}</span>
                    <span className={styles.headerDate}>{dataFormatada}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Informações do Estudante e Dados Disciplinares */}
            <section className={styles.infoSection}>
              <div className={styles.studentInfoRow}>
                {/* Linha 1 */}
                <p className={styles.studentInfoItem}>
                  <b>Nome do Aluno:</b> {nomeAluno}
                </p>
                <p className={styles.studentInfoItem}>
                  <b>Turma:</b> {nomeTurma}
                </p>

                {/* Linha 2 */}
                <p className={styles.studentInfoItem}>
                  <b>Docente:</b> {nomeDocente}
                </p>
                <p className={styles.studentInfoItem}>
                  <b>Comp.Currc:</b> {compCurricularDisplay}
                </p>

                {/* Linha 3 */}
                <p className={styles.studentInfoItem}>
                  <b>Nota do Aluno:</b>
                </p>
                <p className={styles.studentInfoItem}>
                  <b>Visto:</b>
                </p>

                {/* Linha 4 */}
                <p className={styles.studentInfoItem}>
                  <b>Faltas do Aluno:</b> {faltasDisplay}
                </p>
                <p className={styles.studentInfoItem}>
                  <b>Limite de Faltas:</b> {limiteFaltasDisplay}
                </p>
              </div>

              {/* 1. Relato das Dificuldades */}
              <div className={`${styles.feedback} ${styles.feedbackDifficulty}`}>
                <p className={styles.feedbackTitle}>
                  <b>Relato das dificuldades apresentadas pelo aluno (a):</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {ocorrencia.tipo === "falta"
                    ? (ocorrencia.relato_dificuldades || relatoPadrao)
                    : (ocorrencia.relato_dificuldades || "Nenhum relato descritivo informado.")}
                </p>
              </div>

              {/* 2. Recomendações do Professor */}
              <div className={`${styles.feedback} ${styles.feedbackRecommendations}`}>
                <p className={styles.feedbackTitle}>
                  <b>Recomendações do professor ao aluno (a):</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {ocorrencia.recomendacoes_professor || recomendacoesProfessorPadrao}
                </p>
              </div>

              {/* 3. Justificativa Formal Apresentada pelo Estudante / Responsável */}
              <div className={`${styles.feedback} ${styles.feedbackTeamRecommendations}`}>
                <p className={styles.feedbackTitle}>
                  <b>Justificativa Formal Apresentada pelo Estudante / Responsável:</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {justificativaEstudante}
                </p>
              </div>

              {/* 4. Parecer, Recomendações e Encaminhamentos Acordados (Equipe Escolar) */}
              <div className={`${styles.feedback} ${styles.feedbackProvidencias}`}>
                <p className={styles.feedbackTitle}>
                  <b>
                    Parecer, Recomendações e Encaminhamentos Acordados (Equipe Escolar):
                  </b>
                </p>
                <p className={styles.feedbackDescription}>
                  {parecerEquipeEscolar}
                </p>
                {aqvRec?.compensacao_faltas_autorizada && (
                  <p style={{ marginTop: "4px", fontSize: "11px", fontWeight: 600 }}>
                    {aqvRec.compensacao_faltas_autorizada === "autorizado_atestado" &&
                      "• Decisão: Compensação de faltas autorizada mediante Atestado Médico protocolado."}
                    {aqvRec.compensacao_faltas_autorizada === "autorizado_excepcional" &&
                      `• Decisão: Compensação de faltas autorizada em caráter excepcional pela Direção/Gestão. Motivo: ${aqvRec.motivo_excepcionalidade || "Não especificado"}.`}
                    {aqvRec.compensacao_faltas_autorizada === "nao_autorizado" &&
                      "• Decisão: Compensação de faltas não autorizada pela Equipe Escolar (Ausências injustificadas)."}
                  </p>
                )}
              </div>

              {/* 5. Outras Observações */}
              <div className={`${styles.feedback} ${styles.feedbackObs}`}>
                <p className={styles.feedbackTitle}>
                  <b>Outras Observações:</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {""}
                </p>
              </div>

              {/* 6. Visto do Aluno ou Responsável e Assinaturas Físicas */}
              <div className={`${styles.feedback} ${styles.feedbackSubscriptionSection}`}>
                <p className={styles.feedbackTitle}>
                  <b>{isMaiorDeIdade ? "Visto do Aluno:" : "Visto do Responsável:"}</b>
                </p>
                <div className={styles.feedbackSignatures}>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    {isMaiorDeIdade ? "Nome do Aluno(a)" : "Nome do Responsável"}
                  </p>
                  <p className={styles.feedbackSignaturesTitle}>RG</p>
                  <p className={styles.feedbackSignaturesTitle}>Data</p>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    {isMaiorDeIdade ? "Assinatura do Aluno" : "Assinatura do Responsável"}
                  </p>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    Ass. do Coordenador
                  </p>
                  <p className={styles.feedbackSignaturesTitle}>Data</p>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    Ass. do Diretor
                  </p>
                  <p className={styles.feedbackSignaturesTitle}>Data</p>
                </div>
              </div>
            </section>
          </main>

          {/* Histórico de Auditoria & Justificativas (Exibido apenas no Modal, FORA do PDF e Impressão) */}
          {ocorrencia.edicoes && ocorrencia.edicoes.length > 0 && (
            <div className={styles.auditContainer}>
              <div className={styles.auditHeader}>
                <History size={16} color="var(--color-primary)" />
                <span>Histórico de Alterações & Justificativas (Auditoria Interna)</span>
              </div>
              <ul className={styles.auditList}>
                {ocorrencia.edicoes.map((ed) => (
                  <li key={ed.id} className={styles.auditItem}>
                    <div className={styles.auditItemHeader}>
                      <span className={styles.auditBadge}>
                        Versão {String(ed.versao_nova).padStart(2, "0")}
                      </span>
                      <span className={styles.auditUserDate}>
                        {ed.user?.name || ed.editado_por_user?.name || "Usuário"} •{" "}
                        {new Date(ed.created_at).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(ed.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className={styles.auditReason}>
                      <strong>Justificativa:</strong> "{ed.motivo}"
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rodapé de Ações */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft}>
            {onEncaminharAqv && canSendAqv && (
              <button
                type="button"
                className={`${styles.btnAction} ${styles.btnEquipeEscolar}`}
                onClick={() => onEncaminharAqv(ocorrencia.id)}
              >
                <Headphones size={15} />
                Encaminhar à Equipe Escolar
              </button>
            )}

            {canEdit && !isBloqueada && onEdit && (
              <button
                type="button"
                className={`${styles.btnAction} ${styles.btnEdit}`}
                onClick={() => {
                  onClose();
                  onEdit(ocorrencia);
                }}
                title="Editar dados desta FIAP"
              >
                <Edit2 size={15} />
                Editar FIAP
              </button>
            )}
          </div>

          <div className={styles.footerRight}>
            <button
              type="button"
              className={`${styles.btnAction} ${styles.btnPrimary}`}
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf || isPrinting}
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={15} />
                  Baixar PDF (A4 Oficial)
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.btnAction}
              onClick={handlePrint}
              disabled={isPrinting || isGeneratingPdf}
              title="Imprimir FIAP Oficial"
            >
              {isPrinting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Printer size={15} />
                  Imprimir
                </>
              )}
            </button>

            <button type="button" className={styles.btnAction} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
