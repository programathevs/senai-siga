import { useState } from "react";
import { X, Printer, Download, Loader2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import type { PlanoRecuperacao } from "../../services/planoRecuperacaoService";
import styles from "./PlanoPdfModal.module.css";

interface PlanoPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: PlanoRecuperacao | null;
}

export function PlanoPdfModal({ isOpen, onClose, plano }: PlanoPdfModalProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !plano) return null;

  const aluno = plano.aluno;
  const turma = aluno?.turma;
  const curso = turma?.curso;
  const ocorrencia = plano.ocorrencia;
  const docente =
    typeof plano.registrado_por === "object"
      ? plano.registrado_por?.name
      : plano.registrado_por_user?.name || "Matheus Luiz Oliveira de Camargo";

  const propostas = plano.propostas_trabalho || [];

  const nomeAlunoSanitizado = (aluno?.nome || "Aluno").replace(/\s+/g, "_");
  const numFiapSanitizado = (ocorrencia?.numero_sequencial || `FIAP_${plano.id}`).replace(/[\/\s]/g, "_");
  const defaultFilename = `Plano_Recuperacao_${nomeAlunoSanitizado}_FIAP_${numFiapSanitizado}`;

  function handlePrint() {
    const bodyElem = document.getElementById("content-to-pdf-plano");
    if (bodyElem) {
      bodyElem.scrollTop = 0;
    }

    const originalTitle = document.title;
    document.title = defaultFilename;

    setTimeout(() => {
      window.print();
      window.focus();
      setTimeout(() => {
        document.title = originalTitle;
      }, 500);
    }, 150);
  }

  async function handleDownloadPdf() {
    const element = document.getElementById("content-to-pdf-plano");
    if (!element) return;

    element.scrollTop = 0;
    setIsGeneratingPdf(true);

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
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF do Plano:", err);
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
      window.focus();
      document.body.style.pointerEvents = "";
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* TopBar */}
        <div className={styles.topBar}>
          <span className={styles.topTitle}>Visualização de Impressão — Plano de Recuperação</span>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Baixar arquivo PDF com nome específico do estudante e FIAP"
            >
              {isGeneratingPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>Baixar PDF</span>
            </button>

            <button type="button" className={styles.printBtn} onClick={handlePrint}>
              <Printer size={16} />
              <span>Imprimir</span>
            </button>

            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Document Body (Layout Fiel SENAI Sumaré) */}
        <div className={styles.documentBody} id="content-to-pdf-plano">
          {/* Header */}
          <table className={styles.headerTable}>
            <tbody>
              <tr>
                <td className={styles.logoCell}>
                  <span className={styles.senaiLogoText}>SENAI</span>
                </td>
                <td className={styles.schoolTitleCell}>
                  <div className={styles.schoolName}>
                    Escola SENAI “Dr. Celso Charuri” – Unidade Sumaré
                  </div>
                  <div className={styles.docTitle}>Plano de Recuperação</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tabela de Programa e FIAP */}
          <table className={styles.metaGrid}>
            <tbody>
              <tr>
                <td colSpan={3}>
                  <span className={styles.labelBold}>Programa de:</span>
                  &nbsp;&nbsp;
                  <span className={styles.checkboxSpan}>
                    {plano.tipo_programa === "recuperacao_paralela" ? "☒" : "☐"} Recuperação Paralela
                  </span>
                  &nbsp;&nbsp;
                  <span className={styles.checkboxSpan}>
                    {plano.tipo_programa === "compensacao_ausencia" ? "☒" : "☐"} Compensação de Ausência
                  </span>
                  &nbsp;&nbsp;
                  <span className={styles.checkboxSpan}>
                    {plano.tipo_programa === "recuperacao_final" ? "☒" : "☐"} Recuperação Final
                  </span>
                </td>
                <td className={styles.fiapCell}>
                  <span className={styles.labelBold}>Atrelado a FIAP:</span>
                  <div style={{ textAlign: "center", fontWeight: "bold", marginTop: "2px" }}>
                    {ocorrencia?.numero_sequencial || "0737/2025"}
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <span className={styles.labelBold}>Aluno:</span> {aluno?.nome || "—"}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <span className={styles.labelBold}>Docente:</span> {docente}
                </td>
                <td colSpan={2}>
                  <span className={styles.labelBold}>Unidade Curricular:</span>{" "}
                  {plano.unidade_curricular?.nome || plano.unidade_curricular?.sigla || "Desenvolvimento de Sistemas"}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <span className={styles.labelBold}>Curso:</span> {curso?.nome || "Técnico em Desenvolvimento de Sistemas"}
                </td>
                <td>
                  <span className={styles.labelBold}>Turma:</span> {turma?.nome || "I1HN"}
                </td>
                <td>
                  <span className={styles.labelBold}>Ciclo de Avaliação:</span>
                  &nbsp;&nbsp;
                  {plano.ciclo_avaliacao === "2º" ? "☐ 1º  ☒ 2º" : "☒ 1º  ☐ 2º"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 1. Conteúdos Programáticos */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              1. CONTEÚDOS PROGRAMÁTICOS A SEREM RECUPERADOS OU DESENVOLVIDOS
            </div>
            <div className={styles.sectionContent}>
              {plano.conteudo_programatico || "Nenhum conteúdo especificado."}
            </div>
          </div>

          {/* 2. Propostas de Trabalho */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>2. PROPOSTAS DE TRABALHO</div>
            <div className={styles.propostasGrid}>
              <span className={styles.checkboxSpan}>
                {propostas.includes("exercicios_reforco") ? "☒" : "☐"} Exercícios de reforço
              </span>
              <span className={styles.checkboxSpan}>
                {propostas.includes("monitoria") ? "☒" : "☐"} Monitoria
              </span>
              <span className={styles.checkboxSpan}>
                {propostas.includes("plantao_duvidas") ? "☒" : "☐"} Plantão de dúvidas
              </span>
              <span className={styles.checkboxSpan}>
                {propostas.includes("trabalho_pesquisa") ? "☒" : "☐"} Trabalho de pesquisa
              </span>
              <span className={styles.checkboxSpan}>
                {propostas.includes("aula_reforco") ? "☒" : "☐"} Aula de reforço
              </span>
              <span className={styles.checkboxSpan}>
                {propostas.includes("outros") ? "☒" : "☐"} Outros
              </span>
            </div>
          </div>

          {/* 3. Período Previsto */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              3. PERÍODO PREVISTO À REALIZAÇÃO DAS ATIVIDADES
            </div>
            <div style={{ padding: "6px 8px" }}>
              Dia / Período: <strong>{plano.periodo_previsto || "10/12/2025"}</strong>
            </div>
          </div>

          {/* 4. Controle de Frequência */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              4. DATAS PROPOSTAS E CONTROLE DE FREQUÊNCIA (quando aplicável)
            </div>
            <table className={styles.freqPdfTable}>
              <thead>
                <tr>
                  <th rowSpan={2}>Data</th>
                  <th colSpan={2}>Horário</th>
                  <th rowSpan={2}>Aulas compensadas</th>
                  <th rowSpan={2}>Visto do Responsável (Equipe de apoio, docente)</th>
                  <th rowSpan={2}>Visto do aluno</th>
                </tr>
                <tr>
                  <th>Entrada</th>
                  <th>Saída</th>
                </tr>
              </thead>
              <tbody>
                {plano.frequencias && plano.frequencias.length > 0 ? (
                  plano.frequencias.map((f, i) => (
                    <tr key={i}>
                      <td>{f.data}</td>
                      <td>{f.entrada || "12:45"}</td>
                      <td>{f.saida || "16:45"}</td>
                      <td>{f.aulas_compensadas || 4}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>10/12/2025</td>
                    <td>12:45</td>
                    <td>16:45</td>
                    <td>5</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. Início do Processo */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>5. INÍCIO DO PROCESSO</div>
            <div className={styles.vistoGrid} style={{ padding: "6px" }}>
              <div className={styles.vistoBox}>
                <div className={styles.vistoLabel}>Autorizado: Data: ___/___/_____</div>
                <div className={styles.vistoLine}>Coordenação Pedagógica</div>
              </div>
              <div className={styles.vistoBox}>
                <div className={styles.vistoLabel}>Visto: Data: ___/___/_____</div>
                <div className={styles.vistoLine}>Aluno / Responsável</div>
              </div>
              <div className={styles.vistoBox}>
                <div className={styles.vistoLabel}>Visto: Data: ___/___/_____</div>
                <div className={styles.vistoLine}>Professor</div>
              </div>
            </div>
          </div>

          {/* 6. Conceito do Processo */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>6. CONCEITO DO PROCESSO</div>
            <div style={{ padding: "8px" }}>
              <span className={styles.checkboxSpan}>
                {plano.conceito === "aprovado" ? "☒" : "☐"} APROVADO
              </span>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <span className={styles.checkboxSpan}>
                {plano.conceito === "reprovado" ? "☒" : "☐"} REPROVADO
              </span>

              <div className={styles.vistoGrid} style={{ marginTop: "12px" }}>
                <div className={styles.vistoBox}>
                  <div className={styles.vistoLabel}>Visto: Data: ___/___/_____</div>
                  <div className={styles.vistoLine}>Assinatura do Aluno / Responsável</div>
                </div>
                <div className={styles.vistoBox}>
                  <div className={styles.vistoLabel}>Visto: Data: ___/___/_____</div>
                  <div className={styles.vistoLine}>Assinatura do Professor</div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Registro de Desempenho */}
          <div className={styles.sectionBox}>
            <div className={styles.sectionHeader}>
              7. REGISTRO DE INFORMAÇÕES SOBRE O DESEMPENHO DO ALUNO NESTE PROCESSO
            </div>
            <div className={styles.sectionContent} style={{ minHeight: "100px" }}>
              {plano.registro_desempenho || ""}
            </div>
          </div>

          {/* Rodapé Notas */}
          <ul className={styles.footerNotes}>
            <li>
              A finalidade da recuperação é incentivar a melhoria de desempenho e deve ser encarada como um processo, envolvendo atividades tais como: estudo orientado; trabalhos de pesquisa; aulas e ou monitoria; resolução de exercícios e de situações-problema, em meio físico ou eletrônico, entre outras.
            </li>
            <li>
              Os alunos que não alcançarem um nível aceitável das competências previstas participarão automaticamente de processo de recuperação. Após este processo, serão submetidos à nova avaliação abordando as mesmas competências avaliadas no primeiro instrumento de avaliação.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
