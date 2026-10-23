import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  Printer,
  Download,
  Search,
  FileText,
  Users,
  Clock,
  Headphones,
  Shield,
  BookOpen,
  Loader2,
  Calendar,
  RotateCcw,
  Eye,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { RelatorioPdfModal } from "./RelatorioPdfModal";
import {
  relatorioService,
  type RelatorioFiltros,
  type RelatorioResumo,
  type RelatorioTurmaResumoItem,
} from "../../services/relatorioService";
import { turmaService, type Turma } from "../../services/turmaService";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { OcorrenciaDetalhesModal } from "../Ocorrencias/OcorrenciaDetalhesModal";
import styles from "./Relatorios.module.css";

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

export function Relatorios() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Estados principais
  const [activeTab, setActiveTab] = useState<"analitico" | "turmas">("analitico");
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [turmasResumo, setTurmasResumo] = useState<RelatorioTurmaResumoItem[]>([]);
  const [resumoGeral, setResumoGeral] = useState<RelatorioResumo | null>(null);
  const [turmasList, setTurmasList] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [apenasReincidentes, setApenasReincidentes] = useState<boolean>(
    searchParams.get("reincidentes") === "true"
  );

  // Modal
  const [selectedDetalhes, setSelectedDetalhes] = useState<Ocorrencia | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [allOcorrenciasPdf, setAllOcorrenciasPdf] = useState<Ocorrencia[]>([]);
  const [isPreparingPdf, setIsPreparingPdf] = useState(false);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  // Atalhos rápidos de data
  function applyDateShortcut(type: "mes_atual" | "ultimos_30" | "semestre" | "tudo") {
    const today = new Date();
    const formatYmd = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (type === "tudo") {
      setDataInicio("");
      setDataFim("");
      return;
    }

    if (type === "mes_atual") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Primeiro e último dia do mês corrente
      setDataInicio(formatYmd(start));
      setDataFim(formatYmd(end));
      return;
    }

    if (type === "ultimos_30") {
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
      setDataInicio(formatYmd(start));
      setDataFim(formatYmd(today));
      return;
    }

    if (type === "semestre") {
      const isSecondHalf = today.getMonth() >= 6;
      const start = new Date(today.getFullYear(), isSecondHalf ? 6 : 0, 1);
      setDataInicio(formatYmd(start));
      setDataFim(formatYmd(today)); // Mantém preenchido com a data atual conforme solicitado
      return;
    }
  }

  // Carrega turmas para o filtro
  useEffect(() => {
    const controller = new AbortController();
    turmaService
      .getTurmas({ all: true }, controller.signal)
      .then((res) => setTurmasList(res.data))
      .catch((err: any) => {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          setTurmasList([]);
        }
      });
    return () => controller.abort();
  }, []);

  // Sincroniza filtro de reincidentes com a URL (ex: drilldown vindo do Dashboard ?reincidentes=true)
  useEffect(() => {
    setApenasReincidentes(searchParams.get("reincidentes") === "true");
  }, [searchParams]);

  async function loadRelatorio(targetPage = page, targetPerPage = perPage, signal?: AbortSignal) {
    try {
      setIsLoading(true);

      const isAll = targetPerPage === -1;
      const filtros: RelatorioFiltros = {
        search: search.trim() || undefined,
        turma_id: selectedTurmaId || undefined,
        tipo: (selectedTipo as any) || undefined,
        status: (selectedStatus as any) || undefined,
        data_inicio: dataInicio || undefined,
        data_fim: dataFim || undefined,
        page: isAll ? 1 : targetPage,
        per_page: isAll ? undefined : targetPerPage,
        all: isAll ? true : undefined,
        reincidentes: apenasReincidentes || undefined,
      };

      if (activeTab === "analitico") {
        const res = await relatorioService.getOcorrencias(filtros, signal);
        setOcorrencias(res.data);
        setMeta(res.meta);
        setResumoGeral(res.meta?.resumo || null);
      } else {
        const res = await relatorioService.getResumoTurmas({
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
        }, signal);
        setTurmasResumo(res.data);
      }
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      setOcorrencias([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenPdfModal() {
    if (activeTab === "analitico") {
      // Se a tabela já está exibindo todos os registros do filtro
      if (perPage === -1 || (meta && ocorrencias.length >= meta.total)) {
        setAllOcorrenciasPdf(ocorrencias);
        setIsPdfModalOpen(true);
        return;
      }

      try {
        setIsPreparingPdf(true);
        const res = await relatorioService.getOcorrencias({
          search: search.trim() || undefined,
          turma_id: selectedTurmaId || undefined,
          tipo: (selectedTipo as any) || undefined,
          status: (selectedStatus as any) || undefined,
          data_inicio: dataInicio || undefined,
          data_fim: dataFim || undefined,
          all: true,
          reincidentes: apenasReincidentes || undefined,
        });
        setAllOcorrenciasPdf(res.data);
        setIsPdfModalOpen(true);
      } catch (err) {
        console.error("Erro ao buscar registros completos para o PDF:", err);
        setAllOcorrenciasPdf(ocorrencias);
        setIsPdfModalOpen(true);
      } finally {
        setIsPreparingPdf(false);
      }
    } else {
      setIsPdfModalOpen(true);
    }
  }

  // Reseta para a página 1 ao alterar filtros
  useEffect(() => {
    setPage(1);
  }, [search, selectedTurmaId, selectedTipo, selectedStatus, dataInicio, dataFim, activeTab, apenasReincidentes]);

  useEffect(() => {
    const controller = new AbortController();

    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadRelatorio(page, perPage, controller.signal);
      return () => controller.abort();
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadRelatorio(page, perPage, controller.signal);
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    loadRelatorio(page, perPage, controller.signal);
    return () => controller.abort();
  }, [page, perPage, search, selectedTurmaId, selectedTipo, selectedStatus, dataInicio, dataFim, activeTab, apenasReincidentes]);

  function handleResetFilters() {
    setSearch("");
    setSelectedTurmaId("");
    setSelectedTipo("");
    setSelectedStatus("");
    setDataInicio("");
    setDataFim("");
    setApenasReincidentes(false);
  }

  useEffect(() => {
    function handleAfterPrint() {
      window.focus();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      document.body.focus?.();
    }

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function handleTabChange(tab: "analitico" | "turmas") {
    setActiveTab(tab);
    if (tab === "turmas") {
      setSearch("");
      setSelectedTurmaId("");
      setSelectedTipo("");
      setSelectedStatus("");
    }
  }

  function handlePrint() {
    const dataIso = new Date().toISOString().slice(0, 10);
    const defaultFilename = `Relatorio_SENAI_${activeTab === "analitico" ? "Ocorrencias" : "Turmas"}_${dataIso}`;
    const previousTitle = document.title;
    document.title = defaultFilename;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };
    window.addEventListener("afterprint", restoreTitle, { once: true });

    window.print();
    setTimeout(restoreTitle, 3000);
  }

  return (
    <div className={styles.container} id="printable-relatorio">
      {/* Cabeçalho Oficial visível apenas na impressão */}
      <div className={styles.printHeader}>
        <div>
          <div className={styles.printLogoText}>SENAI - SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL</div>
          <div className={styles.printSubText}>
            Relatório de Acompanhamento Pedagógico e Medidas Disciplinares
          </div>
          <div style={{ fontSize: "0.75rem", color: "#444", marginTop: "4px" }}>
            {selectedTurmaId
              ? `Turma: ${turmasList.find((t) => String(t.id) === selectedTurmaId)?.nome || "Selecionada"}`
              : "Escopo: Todas as turmas do perfil"}
            {dataInicio || dataFim ? ` • Período: ${dataInicio || "Início"} até ${dataFim || "Hoje"}` : ""}
            {selectedTipo ? ` • Modalidade: ${selectedTipo.toUpperCase()}` : ""}
            {selectedStatus ? ` • Status: ${selectedStatus.toUpperCase()}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#333" }}>
          <div><strong>Emissão:</strong> {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR").slice(0, 5)}</div>
          <div><strong>Emitido por:</strong> {user?.name} ({user?.role?.toUpperCase()})</div>
          <div><strong>Total de Registros:</strong> {resumoGeral?.total_ocorrencias ?? 0} ocorrência(s)</div>
        </div>
      </div>

      {/* Cabeçalho da Página em Tela */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Relatórios Pedagógicos</h1>
          <p className={styles.subtitle}>
            Emita demonstrativos analíticos de faltas, conduta e registros disciplinares para conselhos de classe e arquivo escolar.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.refreshBtn} onClick={() => loadRelatorio(page, perPage)}>
            <RotateCcw size={16} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleOpenPdfModal}
            disabled={isLoading || isPreparingPdf}
            title="Abrir pré-visualização e exportar PDF com relatório completo"
          >
            {isPreparingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span>{isPreparingPdf ? "Carregando..." : "Exportar PDF"}</span>
          </button>

          <button
            type="button"
            className={styles.printBtn}
            onClick={handlePrint}
            title="Abrir pré-visualização de impressão (Ctrl+P)"
          >
            <Printer size={16} />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* 4 Cards de Totais do Período Filtrado */}
      {resumoGeral && (
        <section className={styles.summaryGrid} aria-label="Resumo do Relatório">
          <div className={styles.summaryCard}>
            <div>
              <span className={styles.summaryLabel}>Total de Ocorrências</span>
              <div className={styles.summaryValue} style={{ color: "var(--color-primary)" }}>
                {resumoGeral.total_ocorrencias}
              </div>
            </div>
            <div
              className={styles.summaryIconBox}
              style={{ backgroundColor: "rgba(227, 6, 19, 0.1)", color: "var(--color-primary)" }}
            >
              <FileText size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div>
              <span className={styles.summaryLabel}>Faltas Excessivas</span>
              <div className={styles.summaryValue} style={{ color: "var(--color-warning)" }}>
                {resumoGeral.total_faltas}
              </div>
            </div>
            <div
              className={styles.summaryIconBox}
              style={{ backgroundColor: "rgba(217, 119, 6, 0.12)", color: "var(--color-warning)" }}
            >
              <Clock size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div>
              <span className={styles.summaryLabel}>Encaminhadas à Equipe Escolar</span>
              <div className={styles.summaryValue} style={{ color: "#0059a8" }}>
                {resumoGeral.total_equipe_escolar ?? resumoGeral.total_aqv}
              </div>
            </div>
            <div
              className={styles.summaryIconBox}
              style={{ backgroundColor: "rgba(0, 89, 168, 0.12)", color: "#0059a8" }}
            >
              <Headphones size={22} />
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div>
              <span className={styles.summaryLabel}>Alunos Notificados</span>
              <div className={styles.summaryValue} style={{ color: "var(--color-text-primary)" }}>
                {resumoGeral.alunos_unicos}
              </div>
            </div>
            <div
              className={styles.summaryIconBox}
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}
            >
              <Users size={22} />
            </div>
          </div>
        </section>
      )}

      {/* Barra de Filtros */}
      <div className={styles.filterCard}>
        {activeTab === "analitico" ? (
          <div className={styles.filterRow}>
            <div className={styles.searchWrapper}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por estudante, RA ou nº da FIAP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className={styles.selectInput}
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
            >
              <option value="">
                {user?.role === "instrutor" ? "Todas as minhas turmas" : "Todas as turmas"}
              </option>
              {turmasList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>

            <select
              className={styles.selectInput}
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
            >
              <option value="">Todas as Modalidades</option>
              <option value="falta">Falta</option>
              <option value="comportamento">Comportamento</option>
              <option value="desempenho">Desempenho</option>
            </select>

            <select
              className={styles.selectInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="pendente">Pendente de Envio</option>
              <option value="enviado_equipe_escolar">Encaminhado à Equipe Escolar</option>
              <option value="pdf_gerado">PDF Gerado</option>
              <option value="impresso">Impresso</option>
              <option value="assinado">Assinado</option>
            </select>

            <select
              className={styles.selectInput}
              value={apenasReincidentes ? "reincidentes" : "todos"}
              onChange={(e) => setApenasReincidentes(e.target.value === "reincidentes")}
              aria-label="Filtrar por perfil de reincidência"
              title="Filtrar por perfil de reincidência"
            >
              <option value="todos">Todos os Estudantes</option>
              <option value="reincidentes">Apenas Reincidentes</option>
            </select>
          </div>
        ) : (
          <div className={styles.consolidadoNotice}>
            <BookOpen size={18} />
            <span>
              Visão Consolidada: Comparativo de todas as turmas lado a lado. Filtros individuais não se aplicam; ajuste o período desejado abaixo.
            </span>
          </div>
        )}

        {/* Linha de Datas e Atalhos */}
        <div className={styles.filterRow} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span className={styles.dateLabel}>
              <Calendar size={14} /> Período:
            </span>
            <input
              type="date"
              className={styles.dateInput}
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              title="Data inicial"
            />
            <span style={{ color: "var(--color-text-secondary)" }}>até</span>
            <input
              type="date"
              className={styles.dateInput}
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              title="Data final"
            />
          </div>

          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginLeft: "auto" }}>
            <button
              type="button"
              className={styles.refreshBtn}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
              onClick={() => applyDateShortcut("mes_atual")}
            >
              Mês Atual
            </button>
            <button
              type="button"
              className={styles.refreshBtn}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
              onClick={() => applyDateShortcut("ultimos_30")}
            >
              Últimos 30 Dias
            </button>
            <button
              type="button"
              className={styles.refreshBtn}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
              onClick={() => applyDateShortcut("semestre")}
            >
              Semestre
            </button>
            <button
              type="button"
              className={styles.refreshBtn}
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.65rem" }}
              onClick={handleResetFilters}
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Abas de Visualização */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "analitico" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("analitico")}
        >
          <FileText size={16} />
          <span>Ocorrências Detalhadas</span>
        </button>

        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === "turmas" ? styles.tabBtnActive : ""}`}
          onClick={() => handleTabChange("turmas")}
        >
          <Users size={16} />
          <span>Consolidado por Turma</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Analítico */}
      {activeTab === "analitico" && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <Loader2 size={32} className="animate-spin" />
                <p>Gerando relatório analítico...</p>
              </div>
            ) : ocorrencias.length === 0 ? (
              <div className={styles.emptyState}>
                <FileText size={48} className={styles.emptyIcon} />
                <p>Nenhuma ocorrência encontrada para os filtros selecionados.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Nº FIAP</th>
                    <th className={styles.th}>Estudante</th>
                    <th className={styles.th}>Turma Vinculada</th>
                    <th className={styles.th}>Modalidade</th>
                    <th className={styles.th}>Data</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ocorrencias.map((oc) => {
                    const aluno = oc.aluno;
                    const initial = (aluno?.nome || "E").charAt(0).toUpperCase();

                    return (
                      <tr key={oc.id} className={styles.tr}>
                        <td className={styles.td}>
                          <strong>{oc.numero_sequencial || `#${oc.id}`}</strong>
                        </td>

                        <td className={styles.td}>
                          <div className={styles.userCell}>
                            <div className={styles.avatarMini}>{initial}</div>
                            <div>
                              <span className={styles.userName}>{aluno?.nome || "Estudante"}</span>
                              <span className={styles.userSub}>RA: {aluno?.matricula || "—"}</span>
                            </div>
                          </div>
                        </td>

                        <td className={styles.td}>
                          <span style={{ fontWeight: 600, display: "block" }}>
                            {aluno?.turma?.nome || "Sem Turma"}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                            {aluno?.turma?.curso?.nome || "Curso"}
                          </span>
                        </td>

                        <td className={styles.td}>
                          <span
                            className={styles.tipoBadge}
                            style={{
                              backgroundColor:
                                oc.tipo === "falta"
                                  ? "rgba(217, 119, 6, 0.12)"
                                  : oc.tipo === "comportamento"
                                    ? "rgba(227, 6, 19, 0.1)"
                                    : "var(--color-surface)",
                              color:
                                oc.tipo === "falta"
                                  ? "var(--color-warning)"
                                  : oc.tipo === "comportamento"
                                    ? "var(--color-primary)"
                                    : "var(--color-text-primary)",
                            }}
                          >
                            {oc.tipo === "falta" && <Clock size={12} />}
                            {oc.tipo === "comportamento" && <Shield size={12} />}
                            {oc.tipo === "desempenho" && <BookOpen size={12} />}
                            <span>{oc.tipo}</span>
                          </span>
                        </td>

                        <td className={styles.td}>
                          <span>{formatDate(oc.data_ocorrencia)}</span>
                        </td>

                        <td className={styles.td}>
                          <span
                            className={styles.statusPill}
                            style={{
                              backgroundColor:
                                oc.status === "enviado_equipe_escolar" || oc.status === "enviado_aqv"
                                  ? "rgba(0, 89, 168, 0.12)"
                                  : oc.status === "pendente"
                                    ? "rgba(217, 119, 6, 0.12)"
                                    : "rgba(16, 185, 129, 0.12)",
                              color:
                                oc.status === "enviado_equipe_escolar" || oc.status === "enviado_aqv"
                                  ? "var(--color-primary)"
                                  : oc.status === "pendente"
                                    ? "var(--color-warning)"
                                    : "var(--color-success)",
                            }}
                          >
                            <span
                              className={styles.statusDot}
                              style={{
                                backgroundColor:
                                  oc.status === "enviado_equipe_escolar" || oc.status === "enviado_aqv"
                                    ? "var(--color-primary)"
                                    : oc.status === "pendente"
                                      ? "var(--color-warning)"
                                      : "var(--color-success)",
                              }}
                            />
                            {oc.status === "enviado_equipe_escolar" || oc.status === "enviado_aqv"
                              ? "Encaminhado à Equipe Escolar"
                              : oc.status === "pendente"
                                ? "Pendente"
                                : "Concluído"}
                          </span>
                        </td>

                        <td className={styles.td}>
                          <div className={styles.actionsCell}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              title="Visualizar FIAP oficial e Imprimir"
                              onClick={() => setSelectedDetalhes(oc)}
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && ocorrencias.length > 0 && meta && (
            <div className={styles.noPrint}>
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                perPage={perPage}
                from={meta.from}
                to={meta.to}
                perPageOptions={[10, 20, 50, 100]}
                showAllOption={true}
                onPageChange={(newPage) => setPage(newPage)}
                onPerPageChange={(newPerPage) => {
                  setPerPage(newPerPage);
                  setPage(1);
                }}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Aba 2: Resumo por Turma */}
      {activeTab === "turmas" && (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.emptyState}>
                <Loader2 size={32} className="animate-spin" />
                <p>Consolidando estatísticas por turma...</p>
              </div>
            ) : turmasResumo.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={48} className={styles.emptyIcon} />
                <p>Nenhuma turma encontrada no período informado.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Turma</th>
                    <th className={styles.th}>Curso</th>
                    <th className={styles.th}>Turno</th>
                    <th className={styles.th}>Estudantes</th>
                    <th className={styles.th}>Ocorrências Totais</th>
                    <th className={styles.th}>Faltas</th>
                    <th className={styles.th}>Comportamento</th>
                    <th className={styles.th}>Desempenho</th>
                    <th className={styles.th}>Taxa de Incidência</th>
                  </tr>
                </thead>
                <tbody>
                  {turmasResumo.map((turma) => (
                    <tr key={turma.id} className={styles.tr}>
                      <td className={styles.td} style={{ fontWeight: 700 }}>
                        {turma.nome}
                      </td>
                      <td className={styles.td}>{turma.curso}</td>
                      <td className={styles.td}>{turma.turno || "—"}</td>
                      <td className={styles.td}>{turma.alunos_count} alunos</td>
                      <td className={styles.td}>
                        <strong>{turma.total_ocorrencias}</strong>
                      </td>
                      <td className={styles.td}>{turma.total_faltas}</td>
                      <td className={styles.td}>{turma.total_comportamento}</td>
                      <td className={styles.td}>{turma.total_desempenho}</td>
                      <td className={styles.td}>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              turma.taxa_incidencia > 25
                                ? "var(--color-primary)"
                                : turma.taxa_incidencia > 10
                                  ? "var(--color-warning)"
                                  : "var(--color-success)",
                          }}
                        >
                          {turma.taxa_incidencia}% ({turma.alunos_notificados} alunos)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Assinaturas exclusivas para impressão do relatório */}
      <div className={styles.printSignatures}>
        <div className={styles.signatureLine}>
          Instrutor Responsável
        </div>
        <div className={styles.signatureLine}>
          Coordenação Pedagógica
        </div>
      </div>

      {/* Modal de Detalhes da FIAP */}
      <OcorrenciaDetalhesModal
        isOpen={Boolean(selectedDetalhes)}
        onClose={() => setSelectedDetalhes(null)}
        ocorrencia={selectedDetalhes}
      />

      {/* Modal de Pré-visualização e Exportação do Relatório em PDF */}
      <RelatorioPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        activeTab={activeTab}
        ocorrencias={allOcorrenciasPdf.length > 0 ? allOcorrenciasPdf : ocorrencias}
        turmasResumo={turmasResumo}
        resumoGeral={resumoGeral}
        turmaNome={turmasList.find((t) => String(t.id) === selectedTurmaId)?.nome}
        dataInicio={dataInicio}
        dataFim={dataFim}
        selectedTipo={selectedTipo}
        selectedStatus={selectedStatus}
        user={user}
      />
    </div>
  );
}

export default Relatorios;
