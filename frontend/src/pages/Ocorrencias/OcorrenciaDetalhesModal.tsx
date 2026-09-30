import { useState } from "react";
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
import type { Ocorrencia } from "../../services/ocorrenciaService";
import { useAuth } from "../../contexts/AuthContext";
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

  if (!isOpen || !ocorrencia) return null;

  const canSendAqv = (() => {
    if (ocorrencia.status === "enviado_aqv" || !user) return false;
    if (user.role === "admin") return true;
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

  const compCurricularDisplay = unidades.length > 0
    ? unidades.map((u) => u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC").join(" / ")
    : (primaryUc?.unidade_curricular?.sigla ? `${primaryUc.unidade_curricular.nome} (${primaryUc.unidade_curricular.sigla})` : primaryUc?.unidade_curricular?.nome || "Componente Curricular");  const quantidadeFaltas = primaryUc?.quantidade_faltas ?? 0;
  const horasTotais = primaryUc?.unidade_curricular?.carga_horaria || 80;
  const limiteFaltasAulas = Math.round((horasTotais / 0.75) * 0.25);

  const faltasDisplay = unidades.length > 0
    ? unidades.map((u) => `${u.quantidade_faltas} (${u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC"})`).join(" / ")
    : `${quantidadeFaltas} faltas`;

  const limiteFaltasDisplay = unidades.length > 0
    ? unidades.map((u) => {
        const ch = u.unidade_curricular?.carga_horaria || 80;
        const lim = Math.round((ch / 0.75) * 0.25);
        const sigla = u.unidade_curricular?.sigla || u.unidade_curricular?.nome || "UC";
        return `${lim} aulas (${sigla})`;
      }).join(" / ")
    : `${limiteFaltasAulas} aulas`;

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

  const recomendacoesGestaoPadrao =
    "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas.";

  const providenciasGestaoPadrao = `Acompanhar diariamente o cumprimento dos compromissos com o curso que ${nomeAluno}, está sendo reorientado por meio da FIAP para atingir integralmente os objetivos do mesmo.`;

  function handlePrint() {
    window.print();
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
        margin: 0.3,
        filename: `FIAP_${nomeSanitizado}_${siglaComp}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF. Você pode utilizar a opção Imprimir.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
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
                  <p className={`${styles.headerDetailsItem} ${styles.headerVersion}`}>
                    VERSÃO <br /> V. {String(ocorrencia.versao || 1).padStart(2, "0")}
                  </p>
                </div>
              </div>
            </section>

            {/* Informações do Estudante e Dados Disciplinares */}
            <section className={styles.infoSection}>
              <div className={styles.studentInfoRow}>
                <p className={styles.studentInfoItem}>
                  <b>Nome do Aluno:</b> {nomeAluno}
                </p>
                <p className={styles.studentInfoItem}>
                  <b>Turma:</b> {nomeTurma}
                </p>
                <p className={styles.studentInfoItemDoc}>
                  <b>Docente:</b> {nomeDocente}
                </p>
                <p className={styles.studentInfoItemVist}>
                  <b>Visto:</b>
                </p>
                <p className={styles.studentInfoItemCompC}>
                  <b>Comp.Currc:</b> {compCurricularDisplay}
                </p>
                <p className={styles.studentInfoItemLess}>
                  <b>Nota do Aluno:</b> ------
                </p>
                <p className={styles.studentInfoItemLess}>
                  <b>Média da Classe:</b> ------
                </p>
                <p className={styles.studentInfoItemLess}>
                  <b>Faltas do Aluno:</b> {faltasDisplay}
                </p>
                <p className={styles.studentInfoItemDate}>
                  <b>Data:</b> {dataFormatada}
                </p>
                <p className={styles.studentInfoItemLimit}>
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

              {/* 3. Recomendações da Equipe de Gestão */}
              <div className={`${styles.feedback} ${styles.feedbackTeamRecommendations}`}>
                <p className={styles.feedbackTitle}>
                  <b>Recomendações da Equipe de Gestão ao Aluno/Responsável:</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {ocorrencia.recomendacoes_gestao || recomendacoesGestaoPadrao}
                </p>
              </div>

              {/* 4. Providências da Equipe de Gestão */}
              <div className={`${styles.feedback} ${styles.feedbackProvidencias}`}>
                <p className={styles.feedbackTitle}>
                  <b>
                    Providências da Equipe de Gestão da escola para auxiliar o aluno (a):
                  </b>
                </p>
                <p className={styles.feedbackDescription}>
                  {ocorrencia.providencias_gestao || providenciasGestaoPadrao}
                </p>
              </div>

              {/* 5. Outras Observações */}
              <div className={`${styles.feedback} ${styles.feedbackObs}`}>
                <p className={styles.feedbackTitle}>
                  <b>Outras Observações:</b>
                </p>
                <p className={styles.feedbackDescription}>
                  {ocorrencia.outras_observacoes || "----"}
                </p>
              </div>

              {/* 6. Visto do Aluno e Assinaturas Físicas */}
              <div className={`${styles.feedback} ${styles.feedbackSubscriptionSection}`}>
                <p className={styles.feedbackTitle}>
                  <b>Visto do Aluno:</b>
                </p>
                <div className={styles.feedbackSignatures}>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    Nome do Aluno(a) ou Responsável do Menor
                  </p>
                  <p className={styles.feedbackSignaturesTitle}>RG</p>
                  <p className={styles.feedbackSignaturesTitle}>Data</p>
                  <p className={`${styles.feedbackSignaturesTitle} ${styles.signatureWide}`}>
                    Ass. do Aluno(a) ou Responsável do Menor
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
                className={`${styles.btnAction} ${styles.btnAqv}`}
                onClick={() => onEncaminharAqv(ocorrencia.id)}
              >
                <Headphones size={15} />
                Encaminhar ao AQV
              </button>
            )}

            {canEdit && onEdit && (
              <button
                type="button"
                className={styles.btnAction}
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                  color: "var(--color-primary)",
                  borderColor: "color-mix(in srgb, var(--color-primary) 30%, transparent)",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
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
              disabled={isGeneratingPdf}
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

            <button type="button" className={styles.btnAction} onClick={handlePrint}>
              <Printer size={15} />
              Imprimir
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
