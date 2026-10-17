import { useState, useEffect } from "react";
import { X, Download, Loader2, Printer } from "lucide-react";
import html2pdf from "html2pdf.js";
import { printElementAsPdf } from "../../utils/printPdf";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import type { RelatorioResumo, RelatorioTurmaResumoItem } from "../../services/relatorioService";
import { showAvatarToast } from "../../utils/toast";
import styles from "./RelatorioPdfModal.module.css";

interface RelatorioPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "analitico" | "turmas";
  ocorrencias: Ocorrencia[];
  turmasResumo: RelatorioTurmaResumoItem[];
  resumoGeral: RelatorioResumo | null;
  turmaNome?: string;
  dataInicio?: string;
  dataFim?: string;
  selectedTipo?: string;
  selectedStatus?: string;
  user?: any;
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return dateStr;
}

export function RelatorioPdfModal({
  isOpen,
  onClose,
  activeTab,
  ocorrencias,
  turmasResumo,
  resumoGeral,
  turmaNome,
  dataInicio,
  dataFim,
  selectedTipo,
  selectedStatus,
  user,
}: RelatorioPdfModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dataIso = new Date().toISOString().slice(0, 10);
  const defaultFilename = `Relatorio_SENAI_${activeTab === "analitico" ? "Ocorrencias" : "Turmas"}_${dataIso}`;

  async function handlePrint() {
    const element = document.getElementById("content-to-pdf-relatorio");
    if (!element) return;

    setIsPrinting(true);
    try {
      await printElementAsPdf(element, {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      });
    } catch (err) {
      console.error("Erro ao imprimir relatório:", err);
      showAvatarToast("Não foi possível preparar a impressão. Tente novamente.", "Aviso", "warning");
    } finally {
      setIsPrinting(false);
      window.focus();
    }
  }

  async function handleDownloadPdf() {
    const element = document.getElementById("content-to-pdf-relatorio");
    if (!element) return;

    const modalBody = element.parentElement;
    if (modalBody) {
      modalBody.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    setIsGeneratingPdf(true);
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const options = {
        margin: [6, 6, 6, 6] as [number, number, number, number],
        filename: `${defaultFilename}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          scrollX: 0,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
        pagebreak: { mode: ["css", "legacy"] },
      };

      await html2pdf().set(options).from(element).save();
      showAvatarToast("Relatório baixado em PDF com sucesso!");
    } catch (err) {
      console.error("Erro ao gerar PDF do Relatório:", err);
      showAvatarToast("Não foi possível gerar o arquivo PDF. Tente novamente.", "Aviso", "warning");
    } finally {
      const residuals = document.querySelectorAll(".html2pdf__container");
      residuals.forEach((el) => el.remove());

      setIsGeneratingPdf(false);
      window.focus();
      document.body.style.pointerEvents = "";
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
        {/* Cabeçalho do Modal Padronizado */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.title}>Visualização do Relatório Oficial</h2>
            <span className={styles.subtitle}>
              Demonstrativo Analítico de Ocorrências e FIAPs — Padrão SENAI Unidade Sumaré
            </span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
            title="Fechar visualização"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com o documento em folha A4 Paisagem */}
        <div className={styles.modalBody}>
          <div id="content-to-pdf-relatorio" className={styles.documentBody}>
            {/* Cabeçalho Oficial */}
            <div className={styles.headerContainer}>
              <div className={styles.headerMainText}>
                <h1 className={styles.orgTitle}>
                  SENAI - SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL
                </h1>
                <div className={styles.schoolTitle}>
                  Escola SENAI “Dr. Celso Charuri” – Unidade Sumaré
                </div>
                <div className={styles.docTitle}>
                  Relatório Pedagógico — {activeTab === "analitico" ? "Demonstrativo Analítico de Ocorrências" : "Consolidado Geral por Turma"}
                </div>
                <div className={styles.filterBadgeRow}>
                  {turmaNome ? `Turma: ${turmaNome}` : "Escopo: Todas as turmas atribuídas"}
                  {dataInicio || dataFim ? ` • Período: ${dataInicio ? formatDate(dataInicio) : "Início"} até ${dataFim ? formatDate(dataFim) : "Hoje"}` : ""}
                  {selectedTipo ? ` • Modalidade: ${selectedTipo.toUpperCase()}` : ""}
                  {selectedStatus ? ` • Status: ${selectedStatus.toUpperCase()}` : ""}
                </div>
              </div>

              <div className={styles.headerMeta}>
                <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR").slice(0, 5)}</div>
                <div><strong>Emitido por:</strong> {user?.name || "Usuário"} ({user?.role?.toUpperCase() || "SISTEMA"})</div>
                <div>
                  <strong>Registros:</strong>{" "}
                  {activeTab === "analitico"
                    ? `${ocorrencias.length} ocorrência(s)`
                    : `${turmasResumo.length} turma(s)`}
                </div>
              </div>
            </div>

            {/* Cards de Resumo */}
            {resumoGeral && (
              <div className={styles.summaryRow}>
                <div className={styles.summaryBox}>
                  <span className={styles.summaryBoxLabel}>Total de Ocorrências</span>
                  <div className={styles.summaryBoxValue} style={{ color: "#e30613" }}>
                    {resumoGeral.total_ocorrencias}
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <span className={styles.summaryBoxLabel}>Faltas Excessivas</span>
                  <div className={styles.summaryBoxValue} style={{ color: "#d97706" }}>
                    {resumoGeral.total_faltas}
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <span className={styles.summaryBoxLabel}>Encaminhadas AQV</span>
                  <div className={styles.summaryBoxValue} style={{ color: "#0059a8" }}>
                    {resumoGeral.total_aqv}
                  </div>
                </div>

                <div className={styles.summaryBox}>
                  <span className={styles.summaryBoxLabel}>Alunos Notificados</span>
                  <div className={styles.summaryBoxValue} style={{ color: "#0f172a" }}>
                    {resumoGeral.alunos_unicos}
                  </div>
                </div>
              </div>
            )}

            {/* Tabela do Relatório */}
            <div className={styles.tableContainer}>
              {activeTab === "analitico" ? (
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th className={styles.reportTh}>Nº FIAP</th>
                      <th className={styles.reportTh}>Estudante</th>
                      <th className={styles.reportTh}>RA</th>
                      <th className={styles.reportTh}>Turma / Curso</th>
                      <th className={styles.reportTh}>Modalidade</th>
                      <th className={styles.reportTh}>Data</th>
                      <th className={styles.reportTh}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocorrencias.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={styles.reportTd} style={{ textAlign: "center", padding: "1.5rem" }}>
                          Nenhuma ocorrência encontrada para o filtro informado.
                        </td>
                      </tr>
                    ) : (
                      ocorrencias.map((oc) => (
                        <tr key={oc.id} className={styles.reportTr}>
                          <td className={styles.reportTd} style={{ fontWeight: 700 }}>
                            {oc.numero_sequencial || `#${oc.id}`}
                          </td>
                          <td className={styles.reportTd}>{oc.aluno?.nome || "—"}</td>
                          <td className={styles.reportTd}>{oc.aluno?.matricula || "—"}</td>
                          <td className={styles.reportTd}>
                            {oc.aluno?.turma?.nome || "—"} ({oc.aluno?.turma?.curso?.nome || "Curso"})
                          </td>
                          <td className={styles.reportTd}>
                            <span className={styles.badgeModalidade}>
                              {oc.tipo.toUpperCase()}
                            </span>
                          </td>
                          <td className={styles.reportTd}>{formatDate(oc.data_ocorrencia)}</td>
                          <td className={styles.reportTd}>
                            {oc.status === "enviado_aqv"
                              ? "Encaminhado AQV"
                              : oc.status === "pendente"
                                ? "Pendente"
                                : "Concluído"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th className={styles.reportTh}>Turma</th>
                      <th className={styles.reportTh}>Curso</th>
                      <th className={styles.reportTh}>Turno</th>
                      <th className={styles.reportTh}>Estudantes</th>
                      <th className={styles.reportTh}>Ocorrências</th>
                      <th className={styles.reportTh}>Faltas</th>
                      <th className={styles.reportTh}>Conduta</th>
                      <th className={styles.reportTh}>Aproveitamento</th>
                      <th className={styles.reportTh}>Taxa Incidência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turmasResumo.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={styles.reportTd} style={{ textAlign: "center", padding: "1.5rem" }}>
                          Nenhuma turma encontrada no período informado.
                        </td>
                      </tr>
                    ) : (
                      turmasResumo.map((t) => (
                        <tr key={t.id} className={styles.reportTr}>
                          <td className={styles.reportTd} style={{ fontWeight: 700 }}>{t.nome}</td>
                          <td className={styles.reportTd}>{t.curso}</td>
                          <td className={styles.reportTd}>{t.turno || "—"}</td>
                          <td className={styles.reportTd}>{t.alunos_count}</td>
                          <td className={styles.reportTd}><strong>{t.total_ocorrencias}</strong></td>
                          <td className={styles.reportTd}>{t.total_faltas}</td>
                          <td className={styles.reportTd}>{t.total_comportamento}</td>
                          <td className={styles.reportTd}>{t.total_desempenho}</td>
                          <td className={styles.reportTd}>
                            <strong>{t.taxa_incidencia}%</strong> ({t.alunos_notificados} alunos)
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Assinaturas Oficiais */}
            <div className={styles.signaturesContainer}>
              <div className={styles.signatureBox}>
                <div className={styles.signatureSpace} />
                <div className={styles.signatureLine}>
                  Instrutor
                </div>
              </div>
              <div className={styles.signatureBox}>
                <div className={styles.signatureSpace} />
                <div className={styles.signatureLine}>
                  Coordenação Pedagógica
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé de Ações Padronizado */}
        <div className={styles.modalFooter}>
          <div className={styles.footerLeft} />

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
              title="Imprimir Relatório Oficial"
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
