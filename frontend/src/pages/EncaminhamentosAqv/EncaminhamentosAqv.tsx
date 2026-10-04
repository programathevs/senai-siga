import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  FilterX,
  Inbox,
  Clock,
  MessageSquare,
  CheckCircle2,
  Eye,
  FilePenLine,
  History,
  Check,
  Loader2,
  Headphones,
} from "lucide-react";
import {
  aqvService,
  type AqvEncaminhamentoItem,
  type AqvStats,
  type AqvFiltros,
} from "../../services/aqvService";
import { turmaService, type Turma } from "../../services/turmaService";
import { Pagination } from "../../components/Pagination/Pagination";
import { AqvAtendimentoModal } from "./AqvAtendimentoModal";
import { OcorrenciaDetalhesModal } from "../Ocorrencias/OcorrenciaDetalhesModal";
import { AlunoHistoricoModal } from "../Alunos/AlunoHistoricoModal";
import styles from "./EncaminhamentosAqv.module.css";

export function EncaminhamentosAqv() {
  const [items, setItems] = useState<AqvEncaminhamentoItem[]>([]);
  const [stats, setStats] = useState<AqvStats>({
    total_encaminhados: 0,
    aguardando_atendimento: 0,
    em_atendimento: 0,
    concluidos: 0,
  });
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Paginação corporativa
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<AqvFiltros["status"]>("");
  const [selectedTipo, setSelectedTipo] = useState<AqvFiltros["tipo"]>("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");

  // Modais
  const [atendimentoModalOpen, setAtendimentoModalOpen] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<AqvEncaminhamentoItem | null>(null);

  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [detalhesOcorrencia, setDetalhesOcorrencia] = useState<AqvEncaminhamentoItem | null>(null);

  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [historicoAlunoId, setHistoricoAlunoId] = useState<number | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  // Carrega turmas para o filtro
  useEffect(() => {
    async function loadTurmas() {
      try {
        const res = await turmaService.getTurmas({ all: true });
        setTurmas(res.data || []);
      } catch (err) {
        console.error("Erro ao carregar turmas para filtro AQV:", err);
      }
    }
    loadTurmas();
  }, []);

  // Carrega estatísticas dos KPIs
  const loadStats = useCallback(async () => {
    try {
      const data = await aqvService.getAqvStats();
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar estatísticas da AQV:", err);
    }
  }, []);

  // Carrega os encaminhamentos com paginação e filtros
  const loadEncaminhamentos = useCallback(
    async (currentPage: number, currentPerPage: number) => {
      setIsLoading(true);
      try {
        const response = await aqvService.getEncaminhamentos(
          {
            search: search.trim() || undefined,
            status: selectedStatus || undefined,
            tipo: selectedTipo || undefined,
            turma_id: selectedTurmaId || undefined,
          },
          currentPage,
          currentPerPage
        );

        setItems(response.items || []);
        setTotal(response.total || 0);
        setLastPage(response.last_page || 1);
      } catch (err) {
        console.error("Erro ao carregar encaminhamentos da AQV:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [search, selectedStatus, selectedTipo, selectedTurmaId]
  );

  // Reseta para a página 1 ao alterar filtros
  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus, selectedTipo, selectedTurmaId]);

  // Efeito principal de busca com debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadEncaminhamentos(page, perPage);
      loadStats();
      return;
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadEncaminhamentos(page, perPage);
      }, 300);
      return () => clearTimeout(timer);
    }

    loadEncaminhamentos(page, perPage);
  }, [page, perPage, search, selectedStatus, selectedTipo, selectedTurmaId, loadEncaminhamentos, loadStats]);

  function handleClearFilters() {
    setSearch("");
    setSelectedStatus("");
    setSelectedTipo("");
    setSelectedTurmaId("");
  }

  function handleOpenAtendimento(item: AqvEncaminhamentoItem) {
    setSelectedOcorrencia(item);
    setAtendimentoModalOpen(true);
  }

  function handleOpenDetalhes(item: AqvEncaminhamentoItem) {
    setDetalhesOcorrencia(item);
    setDetalhesModalOpen(true);
  }

  function handleOpenHistorico(alunoId: number) {
    setHistoricoAlunoId(alunoId);
    setHistoricoModalOpen(true);
  }

  async function handleConfirmarAssinaturaRapida(item: AqvEncaminhamentoItem) {
    const confirmou = window.confirm(
      `Confirmar que a folha física da ocorrência ${item.numero_sequencial} do aluno ${item.aluno?.nome} foi devidamente assinada e colhida?`
    );
    if (!confirmou) return;

    try {
      await aqvService.confirmarAssinatura(item.id);
      loadEncaminhamentos(page, perPage);
      loadStats();
    } catch (err) {
      console.error("Erro ao confirmar assinatura:", err);
      alert("Não foi possível confirmar a assinatura. Tente novamente.");
    }
  }

  function renderStatusBadge(item: AqvEncaminhamentoItem) {
    const isAssinado =
      item.status === "assinado" ||
      item.aqv_recebimento?.status_atendimento === "concluido";

    if (isAssinado) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusConcluido}`}>
          <CheckCircle2 size={13} />
          Concluído & Assinado
        </span>
      );
    }

    if (item.aqv_recebimento?.status_atendimento === "em_atendimento") {
      return (
        <span className={`${styles.statusBadge} ${styles.statusEmAtendimento}`}>
          <MessageSquare size={13} />
          Em Acolhimento
        </span>
      );
    }

    return (
      <span className={`${styles.statusBadge} ${styles.statusPendente}`}>
        <Clock size={13} />
        Aguardando Atendimento
      </span>
    );
  }

  function renderTipoBadge(tipo: string) {
    if (tipo === "falta") {
      return <span className={`${styles.typeBadge} ${styles.typeFalta}`}>Falta</span>;
    }
    if (tipo === "comportamento") {
      return <span className={`${styles.typeBadge} ${styles.typeComportamento}`}>Comportamento</span>;
    }
    return <span className={`${styles.typeBadge} ${styles.typeDesempenho}`}>Desempenho</span>;
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Encaminhamentos AQV</h1>
          <p className={styles.subtitle}>
            Apoio ao Quadro de Vida Escolar • Gestão de Acolhimento e Justificativas de FIAPs
          </p>
        </div>
      </div>

      {/* Cards de Métricas (KPIs) */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{
              backgroundColor: "color-mix(in srgb, #3b82f6 15%, transparent)",
              color: "#2563eb",
            }}
          >
            <Inbox size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Total Encaminhados</span>
            <span className={styles.kpiValue}>{stats.total_encaminhados}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{
              backgroundColor: "color-mix(in srgb, #f59e0b 15%, transparent)",
              color: "#d97706",
            }}
          >
            <Clock size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Aguardando Atendimento</span>
            <span className={styles.kpiValue}>{stats.aguardando_atendimento}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{
              backgroundColor: "color-mix(in srgb, #6366f1 15%, transparent)",
              color: "#6366f1",
            }}
          >
            <MessageSquare size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Em Acolhimento</span>
            <span className={styles.kpiValue}>{stats.em_atendimento}</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-success) 15%, transparent)",
              color: "var(--color-success)",
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Concluídos & Assinados</span>
            <span className={styles.kpiValue}>{stats.concluidos}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar por estudante, RA ou nº FIAP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as AqvFiltros["status"])}
            className={styles.select}
          >
            <option value="">Status: Todos</option>
            <option value="pendente">Aguardando Atendimento</option>
            <option value="em_atendimento">Em Acolhimento</option>
            <option value="concluido">Concluído & Assinado</option>
          </select>

          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value as AqvFiltros["tipo"])}
            className={styles.select}
          >
            <option value="">Tipo: Todos</option>
            <option value="falta">Falta</option>
            <option value="comportamento">Comportamento</option>
            <option value="desempenho">Desempenho</option>
          </select>

          <select
            value={selectedTurmaId}
            onChange={(e) => setSelectedTurmaId(e.target.value)}
            className={styles.select}
          >
            <option value="">Turma: Todas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.curso?.nome || "Curso"})
              </option>
            ))}
          </select>

          {(search || selectedStatus || selectedTipo || selectedTurmaId) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className={styles.clearFiltersBtn}
            >
              <FilterX size={15} />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Encaminhamentos */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingWrapper}>
            <Loader2 size={24} className="animate-spin" />
            <span>Carregando fila de encaminhamentos da AQV...</span>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <Headphones size={44} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Nenhum encaminhamento encontrado</h3>
            <p className={styles.emptyDesc}>
              Não há ocorrências correspondentes aos filtros selecionados no momento.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nº FIAP</th>
                  <th>Estudante & Turma</th>
                  <th>Tipo</th>
                  <th>Data Registro</th>
                  <th>Notificante</th>
                  <th>Status AQV</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const docente =
                    typeof item.registrado_por === "object"
                      ? item.registrado_por?.name
                      : item.registrado_por_user?.name || "Docente";
                  const isAssinado =
                    item.status === "assinado" ||
                    item.aqv_recebimento?.status_atendimento === "concluido";

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className={styles.fiapTag}>
                          {item.numero_sequencial}
                        </span>
                      </td>
                      <td>
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>
                            {item.aluno?.nome || "Estudante"}
                          </span>
                          <span className={styles.studentDetails}>
                            Matrícula: {item.aluno?.matricula} • {item.aluno?.turma?.nome || "Sem Turma"}
                          </span>
                        </div>
                      </td>
                      <td>{renderTipoBadge(item.tipo)}</td>
                      <td>{item.data_ocorrencia}</td>
                      <td>{docente}</td>
                      <td>{renderStatusBadge(item)}</td>
                      <td>
                        <div className={styles.actionsCell}>
                          {/* Visualizar FIAP Oficial */}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenDetalhes(item)}
                            title="Visualizar FIAP Oficial e Imprimir"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Registrar / Editar Atendimento */}
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                            onClick={() => handleOpenAtendimento(item)}
                            title="Registrar Atendimento e Justificativa"
                          >
                            <FilePenLine size={16} />
                          </button>

                          {/* Confirmação Rápida de Assinatura */}
                          {!isAssinado && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
                              onClick={() => handleConfirmarAssinaturaRapida(item)}
                              title="Confirmar Assinatura Física da FIAP"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {/* Histórico Escolar do Aluno */}
                          {item.aluno?.id && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleOpenHistorico(item.aluno!.id)}
                              title="Ver Histórico Completo do Aluno"
                            >
                              <History size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && total > 0 && (
          <Pagination
            currentPage={page}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPageChange={(newPage: number) => setPage(newPage)}
            onPerPageChange={(newPerPage: number) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        )}
      </div>

      {/* Modal de Atendimento AQV */}
      {atendimentoModalOpen && (
        <AqvAtendimentoModal
          isOpen={atendimentoModalOpen}
          onClose={() => {
            setAtendimentoModalOpen(false);
            setSelectedOcorrencia(null);
          }}
          ocorrencia={selectedOcorrencia}
          onSuccess={() => {
            loadEncaminhamentos(page, perPage);
            loadStats();
          }}
        />
      )}

      {/* Modal de Detalhes da FIAP Oficial */}
      {detalhesModalOpen && (
        <OcorrenciaDetalhesModal
          isOpen={detalhesModalOpen}
          onClose={() => {
            setDetalhesModalOpen(false);
            setDetalhesOcorrencia(null);
          }}
          ocorrencia={detalhesOcorrencia}
        />
      )}

      {/* Modal de Histórico do Aluno */}
      {historicoModalOpen && historicoAlunoId && (
        <AlunoHistoricoModal
          isOpen={historicoModalOpen}
          onClose={() => {
            setHistoricoModalOpen(false);
            setHistoricoAlunoId(null);
          }}
          alunoId={historicoAlunoId}
        />
      )}
    </div>
  );
}
