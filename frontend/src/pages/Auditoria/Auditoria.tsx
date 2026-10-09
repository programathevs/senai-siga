import { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  RotateCcw,
  Eye,
  Loader2,
  FileText,
  Edit3,
  Trash2,
  Headphones,
  CheckCircle2,
  Award,
  LogIn,
  Layers,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  auditoriaService,
  type AuditoriaLog,
  type AuditoriaStats,
} from "../../services/auditoriaService";
import { Pagination } from "../../components/Pagination/Pagination";
import { AuditoriaDetalhesModal } from "./AuditoriaDetalhesModal";
import styles from "./Auditoria.module.css";

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function Auditoria() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [stats, setStats] = useState<AuditoriaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAcao, setSelectedAcao] = useState("todas");
  const [selectedEntidade, setSelectedEntidade] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(15);

  // Modal
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);

  // Debounce da busca textual
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [resLogs, resStats] = await Promise.all([
        auditoriaService.listar({
          page: currentPage,
          per_page: perPage,
          search: debouncedSearch,
          acao: selectedAcao,
          entidade: selectedEntidade,
          data_inicio: dataInicio,
          data_fim: dataFim,
        }),
        auditoriaService.getStats().catch(() => null),
      ]);

      setLogs(resLogs.items);
      setTotal(resLogs.total);
      setLastPage(resLogs.last_page);
      if (resStats) setStats(resStats);
    } catch {
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, debouncedSearch, selectedAcao, selectedEntidade, dataInicio, dataFim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleClearFilters() {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedAcao("todas");
    setSelectedEntidade("todas");
    setDataInicio("");
    setDataFim("");
    setCurrentPage(1);
  }

  function getActionBadge(acao: string) {
    switch (acao) {
      case "criacao_fiap":
        return {
          icon: <FileText size={12} />,
          label: "Criação de FIAP",
          bg: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
          color: "var(--color-primary)",
        };
      case "edicao_fiap":
        return {
          icon: <Edit3 size={12} />,
          label: "Edição de FIAP",
          bg: "color-mix(in srgb, var(--color-warning) 14%, transparent)",
          color: "var(--color-warning)",
        };
      case "exclusao_fiap":
      case "exclusao_plano":
        return {
          icon: <Trash2 size={12} />,
          label: acao === "exclusao_fiap" ? "Exclusão de FIAP" : "Exclusão de Plano",
          bg: "color-mix(in srgb, #ef4444 14%, transparent)",
          color: "#ef4444",
        };
      case "restauracao_fiap":
      case "restauracao_plano":
        return {
          icon: <RotateCcw size={12} />,
          label: acao === "restauracao_fiap" ? "Restauração de FIAP" : "Restauração de Plano",
          bg: "color-mix(in srgb, #0284c7 14%, transparent)",
          color: "#0284c7",
        };
      case "encaminhamento_aqv":
        return {
          icon: <Headphones size={12} />,
          label: "Encaminhado AQV",
          bg: "color-mix(in srgb, #0059a8 14%, transparent)",
          color: "#0059a8",
        };
      case "atendimento_aqv":
        return {
          icon: <ShieldCheck size={12} />,
          label: "Acolhimento AQV",
          bg: "color-mix(in srgb, #8b5cf6 14%, transparent)",
          color: "#8b5cf6",
        };
      case "assinatura_fiap":
        return {
          icon: <CheckCircle2 size={12} />,
          label: "Assinatura Física",
          bg: "color-mix(in srgb, var(--color-success) 14%, transparent)",
          color: "var(--color-success)",
        };
      case "criacao_plano":
      case "atualizacao_plano":
        return {
          icon: <Award size={12} />,
          label: acao === "criacao_plano" ? "Novo Plano PRP/PCA" : "Edição de Plano",
          bg: "color-mix(in srgb, #6366f1 14%, transparent)",
          color: "#6366f1",
        };
      case "login":
        return {
          icon: <LogIn size={12} />,
          label: "Login no Sistema",
          bg: "color-mix(in srgb, var(--color-text-secondary) 14%, transparent)",
          color: "var(--color-text-secondary)",
        };
      default:
        return {
          icon: <Layers size={12} />,
          label: acao,
          bg: "var(--color-surface)",
          color: "var(--color-text-primary)",
        };
    }
  }

  return (
    <div className={styles.container}>
      {/* 1. Header da Página */}
      <section className={styles.pageHeader}>
        <div className={styles.headerTextGroup}>
          <div className={styles.moduleTagRow}>
            <span className={styles.moduleTag}>Segurança & Governança</span>
            <span className={styles.versionTag}>• Rastreabilidade SENAI SIGA</span>
          </div>
          <h1 className={styles.pageTitle}>Logs de Auditoria do Sistema</h1>
          <p className={styles.pageSubtitle}>
            Histórico imutável de operações regimentais: criação de FIAPs, alterações com justificativa,
            acolhimentos da AQV, assinaturas e planos de recuperação.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={loadData}
            title="Atualizar lista de auditoria"
          >
            <RotateCcw size={14} />
            <span>Atualizar</span>
          </button>
        </div>
      </section>

      {/* 2. Grid de 5 Indicadores Rápidos */}
      <section className={styles.kpiGrid} aria-label="Indicadores gerais de auditoria">
        {/* Total de Logs */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Total de Eventos</span>
              <div className={styles.kpiValue}>
                {stats?.total_logs ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              <History size={18} />
            </div>
          </div>
        </article>

        {/* Edições em FIAPs */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Edições em FIAPs</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
                {stats?.edicoes_fiap ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
                color: "var(--color-warning)",
              }}
            >
              <Edit3 size={18} />
            </div>
          </div>
        </article>

        {/* Acolhimentos AQV */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Acolhimentos AQV</span>
              <div className={styles.kpiValue} style={{ color: "#8b5cf6" }}>
                {stats?.atendimentos_aqv ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, #8b5cf6 12%, transparent)",
                color: "#8b5cf6",
              }}
            >
              <Headphones size={18} />
            </div>
          </div>
        </article>

        {/* Assinaturas Colhidas */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Assinaturas Físicas</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                {stats?.assinaturas_fiap ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
                color: "var(--color-success)",
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
        </article>

        {/* Planos de Recuperação */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Planos PRP / PCA</span>
              <div className={styles.kpiValue} style={{ color: "#6366f1" }}>
                {stats?.planos_recuperacao ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, #6366f1 12%, transparent)",
                color: "#6366f1",
              }}
            >
              <Award size={18} />
            </div>
          </div>
        </article>
      </section>

      {/* 3. Tabela Central com Barra de Filtros */}
      <section className={styles.tableCard} aria-label="Tabela de logs de auditoria">
        {/* Barra de Filtros */}
        <div className={styles.tableToolbar}>
          <div className={styles.searchWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por descrição, usuário, e-mail ou IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar nos logs"
            />
          </div>

          <div className={styles.filtersGroup}>
            {/* Filtro por Ação */}
            <select
              className={styles.selectInput}
              value={selectedAcao}
              onChange={(e) => {
                setSelectedAcao(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por ação"
            >
              <option value="todas">Todas as Ações</option>
              <option value="criacao_fiap">Criação de FIAP</option>
              <option value="edicao_fiap">Edição de FIAP (com Versão)</option>
              <option value="exclusao_fiap">Exclusão de FIAP</option>
              <option value="restauracao_fiap">Restauração de FIAP</option>
              <option value="encaminhamento_aqv">Encaminhamento à AQV</option>
              <option value="atendimento_aqv">Acolhimento Pedagógico AQV</option>
              <option value="assinatura_fiap">Assinatura Física Confirmada</option>
              <option value="criacao_plano">Criação de Plano PRP/PCA</option>
              <option value="atualizacao_plano">Atualização de Plano</option>
              <option value="login">Login de Usuário</option>
            </select>

            {/* Filtro por Entidade */}
            <select
              className={styles.selectInput}
              value={selectedEntidade}
              onChange={(e) => {
                setSelectedEntidade(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filtrar por entidade"
            >
              <option value="todas">Todas as Entidades</option>
              <option value="Ocorrencia">FIAP / Ocorrência</option>
              <option value="PlanoRecuperacao">Plano de Recuperação</option>
              <option value="User">Usuário / Autenticação</option>
              <option value="Aluno">Aluno</option>
              <option value="Turma">Turma</option>
            </select>

            {/* Filtro por Datas */}
            <input
              type="date"
              className={styles.dateInput}
              value={dataInicio}
              onChange={(e) => {
                setDataInicio(e.target.value);
                setCurrentPage(1);
              }}
              title="Data Inicial"
              aria-label="Data inicial"
            />
            <input
              type="date"
              className={styles.dateInput}
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setCurrentPage(1);
              }}
              title="Data Final"
              aria-label="Data final"
            />

            {(searchTerm || selectedAcao !== "todas" || selectedEntidade !== "todas" || dataInicio || dataFim) && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClearFilters}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Eventos */}
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>Data & Hora</th>
                <th>Usuário Responsável</th>
                <th>Ação Realizada</th>
                <th>Entidade</th>
                <th>Descrição do Evento</th>
                <th style={{ textAlign: "right" }}>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
                    <p style={{ color: "var(--color-text-secondary)" }}>Carregando trilha de auditoria...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        <History size={24} />
                      </div>
                      <p>Nenhum registro de auditoria encontrado para os critérios selecionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.acao);
                  const initial = log.user?.name ? log.user.name.charAt(0).toUpperCase() : "S";

                  return (
                    <tr key={log.id} className={styles.tableRow}>
                      {/* Data & Hora */}
                      <td style={{ whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Clock size={13} color="var(--color-text-secondary)" />
                          <span style={{ fontWeight: 600 }}>{formatDateTime(log.created_at)}</span>
                        </div>
                      </td>

                      {/* Usuário Responsável */}
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.userAvatar}>{initial}</div>
                          <div className={styles.userInfo}>
                            <span className={styles.userName}>
                              {log.user?.name || "Sistema"}
                              {log.user?.role && (
                                <span className={styles.roleBadge}>{log.user.role}</span>
                              )}
                            </span>
                            <span className={styles.userEmail}>
                              {log.user?.email || "automático"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Ação */}
                      <td>
                        <span
                          className={styles.actionBadge}
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Entidade */}
                      <td>
                        <span style={{ fontWeight: 600 }}>{log.entidade}</span>
                        {log.entidade_id && (
                          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block" }}>
                            ID #{log.entidade_id}
                          </span>
                        )}
                      </td>

                      {/* Descrição */}
                      <td style={{ maxWidth: "340px" }}>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-text-primary)", display: "block" }}>
                          {log.descricao}
                        </span>
                        {log.ip_address && (
                          <span style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>
                            IP: {log.ip_address}
                          </span>
                        )}
                      </td>

                      {/* Botão Ver Detalhes */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.viewDetailBtn}
                          title="Visualizar detalhes do log e diff"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <Pagination
          currentPage={currentPage}
          lastPage={lastPage}
          total={total}
          perPage={perPage}
          onPageChange={setCurrentPage}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </section>

      {/* Modal de Detalhes do Log de Auditoria */}
      <AuditoriaDetalhesModal
        isOpen={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}

export default Auditoria;
