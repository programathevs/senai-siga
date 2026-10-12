import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Calendar,
  Download,
  PlusCircle,
  FileText,
  TrendingUp,
  Clock,
  Headphones,
  Search,
  ArrowRight,
  Eye,
  CalendarCheck,
  BookOpen,
  BarChart3,
  Shield,
  ShieldCheck,
  Loader2,
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  History,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { dashboardService, type DashboardStats } from "../../services/dashboardService";
import type { Ocorrencia } from "../../services/ocorrenciaService";
import { OcorrenciaDetalhesModal } from "../Ocorrencias/OcorrenciaDetalhesModal";
import { OcorrenciaModal } from "../Ocorrencias/OcorrenciaModal";
import styles from "./Dashboard.module.css";

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

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros locais na tabela de ocorrências recentes
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("todas");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");

  // Modais integrados
  const [selectedDetalhes, setSelectedDetalhes] = useState<Ocorrencia | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  async function loadDashboard() {
    try {
      setIsLoading(true);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredOccurrences = useMemo(() => {
    if (!stats?.ocorrencias_recentes) return [];

    return stats.ocorrencias_recentes.filter((oc) => {
      const alunoNome = oc.aluno?.nome?.toLowerCase() || "";
      const alunoRa = oc.aluno?.matricula?.toLowerCase() || "";
      const numSeq = oc.numero_sequencial?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        alunoNome.includes(search) ||
        alunoRa.includes(search) ||
        numSeq.includes(search);

      const matchesTurma =
        selectedTurmaId === "todas" ||
        String(oc.aluno?.turma_id) === selectedTurmaId;

      const matchesStatus =
        selectedStatus === "todos" || oc.status === selectedStatus;

      return matchesSearch && matchesTurma && matchesStatus;
    });
  }, [stats, searchTerm, selectedTurmaId, selectedStatus]);

  function getStatusStyle(status: string) {
    switch (status) {
      case "enviado_aqv":
        return {
          bg: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
          color: "var(--color-primary)",
          dot: "var(--color-primary)",
          label: "Encaminhado AQV",
        };
      case "pendente":
        return {
          bg: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
          color: "var(--color-warning)",
          dot: "var(--color-warning)",
          label: "Pendente de Envio",
        };
      case "assinado":
      case "impresso":
        return {
          bg: "color-mix(in srgb, var(--color-success) 12%, transparent)",
          color: "var(--color-success)",
          dot: "var(--color-success)",
          label: status === "assinado" ? "Assinado" : "Impresso",
        };
      case "pdf_gerado":
        return {
          bg: "color-mix(in srgb, #0059a8 12%, transparent)",
          color: "#0059a8",
          dot: "#0059a8",
          label: "PDF Gerado",
        };
      default:
        return {
          bg: "var(--color-surface)",
          color: "var(--color-text-secondary)",
          dot: "var(--color-text-secondary)",
          label: status,
        };
    }
  }

  const kpis = stats?.kpis;
  const difMes = kpis?.diferenca_mes ?? 0;

  const distTipo = stats?.distribuicao_tipo || { falta: 0, comportamento: 0, desempenho: 0 };
  const totalModalidades = distTipo.falta + distTipo.comportamento + distTipo.desempenho;
  const pctFalta = totalModalidades > 0 ? Math.round((distTipo.falta / totalModalidades) * 100) : 0;
  const pctComportamento = totalModalidades > 0 ? Math.round((distTipo.comportamento / totalModalidades) * 100) : 0;
  const pctDesempenho = totalModalidades > 0 ? Math.round((distTipo.desempenho / totalModalidades) * 100) : 0;

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Header de Ação da Página */}
      <section className={styles.pageHeader}>
        <div className={styles.headerTextGroup}>
          <div className={styles.moduleTagRow}>
            <span className={styles.moduleTag}>Módulo Acadêmico</span>
            <span className={styles.versionTag}>• SENAI SIGA v2.0</span>
          </div>
          <h1 className={styles.pageTitle}>
            {user?.role === "gestor"
              ? "Painel de Gestão Escolar"
              : user?.role === "aqv"
                ? "Painel de Apoio e Qualidade de Vida (AQV)"
                : "Painel do Docente"}
          </h1>
          <p className={styles.pageSubtitle}>
            Bem-vindo de volta, <strong>{user?.name || "Usuário"}</strong>.{" "}
            <br />
            {user?.role === "instrutor"
              ? "Acompanhe suas turmas lecionadas, o histórico disciplinar dos estudantes e atue precocemente."
              : "Visão consolidada de ocorrências, acompanhamento disciplinar e dados pedagógicos da unidade."}
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.periodBadge}>
            <Calendar size={16} color="var(--color-primary)" />
            <span>{stats?.periodo?.mes_nome || "Mês Vigente"}</span>
          </div>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/relatorios")}
            title="Ir para Relatórios Pedagógicos"
          >
            <Download size={16} />
            <span>Relatórios</span>
          </button>

          {user?.role === "gestor" && (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate("/auditoria")}
              title="Acessar Logs de Auditoria do Sistema"
            >
              <History size={16} />
              <span>Auditoria</span>
            </button>
          )}

          {user?.role === "instrutor" && (
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusCircle size={18} />
              <span>+ Nova FIAP</span>
            </button>
          )}
        </div>
      </section>

      {/* Seção Estratégica Executiva (Exclusiva para o perfil Gestor) */}
      {user?.role === "gestor" && stats?.metricas_gestao && (
        <section className={styles.gestorSection} aria-label="Painel de Gestão Estratégica">
          {/* 4 Cards Executivos da Escola */}
          <div className={styles.executiveGrid}>
            {/* Estudantes Ativos */}
            <article className={styles.executiveCard}>
              <div className={styles.kpiTopRow}>
                <div>
                  <span className={styles.kpiLabel}>Estudantes Matriculados</span>
                  <div className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : stats.metricas_gestao.total_alunos_ativos}
                  </div>
                </div>
                <div
                  className={styles.kpiIconWrapper}
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                    color: "var(--color-primary)",
                  }}
                >
                  <Users size={22} />
                </div>
              </div>
              <div className={styles.kpiFooter}>
                <span>
                  {stats.metricas_gestao.alunos_sem_turma > 0
                    ? `${stats.metricas_gestao.alunos_sem_turma} pendentes de enturmação`
                    : "100% dos alunos enturmados"}
                </span>
                <span
                  style={{ cursor: "pointer", color: "var(--color-primary)", fontWeight: 600 }}
                  onClick={() => navigate("/alunos")}
                >
                  Ver alunos
                </span>
              </div>
            </article>

            {/* Turmas em Andamento */}
            <article className={styles.executiveCard}>
              <div className={styles.kpiTopRow}>
                <div>
                  <span className={styles.kpiLabel}>Turmas Ativas</span>
                  <div className={styles.kpiValue} style={{ color: "#0284c7" }}>
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : stats.metricas_gestao.total_turmas_ativas}
                  </div>
                </div>
                <div
                  className={styles.kpiIconWrapper}
                  style={{
                    backgroundColor: "color-mix(in srgb, #0284c7 12%, transparent)",
                    color: "#0284c7",
                  }}
                >
                  <GraduationCap size={22} />
                </div>
              </div>
              <div className={styles.kpiFooter}>
                <span>{stats.metricas_gestao.total_cursos} cursos técnicos ofertados</span>
                <span
                  style={{ cursor: "pointer", color: "#0284c7", fontWeight: 600 }}
                  onClick={() => navigate("/turmas")}
                >
                  Ver turmas
                </span>
              </div>
            </article>

            {/* Planos de Recuperação */}
            <article className={styles.executiveCard}>
              <div className={styles.kpiTopRow}>
                <div>
                  <span className={styles.kpiLabel}>Planos de Recuperação</span>
                  <div className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : stats.metricas_gestao.total_planos_ativos}
                  </div>
                </div>
                <div
                  className={styles.kpiIconWrapper}
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
                    color: "var(--color-warning)",
                  }}
                >
                  <Award size={22} />
                </div>
              </div>
              <div className={styles.kpiFooter}>
                <span>Processos pedagógicos ativos</span>
                <span
                  style={{ cursor: "pointer", color: "var(--color-warning)", fontWeight: 600 }}
                  onClick={() => navigate("/ocorrencias")}
                >
                  Acompanhar
                </span>
              </div>
            </article>

            {/* Taxa de Resolução Escolar */}
            <article className={styles.executiveCard}>
              <div className={styles.kpiTopRow}>
                <div>
                  <span className={styles.kpiLabel}>Taxa de Resolução</span>
                  <div className={styles.kpiValue} style={{ color: "var(--color-success)" }}>
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : `${stats.metricas_gestao.taxa_resolucao}%`}
                  </div>
                </div>
                <div
                  className={styles.kpiIconWrapper}
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <div className={styles.kpiFooter}>
                <span>FIAPs assinadas/concluídas</span>
                <span style={{ color: "var(--color-success)", fontWeight: 700 }}>
                  Efetividade Escolar
                </span>
              </div>
            </article>
          </div>

          {/* 3 Blocos de Análise Executiva */}
          <div className={styles.executiveAnalyticsGrid}>
            {/* Bloco 1: Ocorrências por Curso */}
            <article className={styles.analyticsCard}>
              <div>
                <div className={styles.analyticsHeader}>
                  <div className={styles.analyticsTitleGroup}>
                    <BarChart3 size={18} color="var(--color-primary)" />
                    <span className={styles.analyticsTitle}>Ocorrências por Curso</span>
                  </div>
                  <span className={styles.analyticsBadge}>
                    {stats.metricas_gestao.distribuicao_cursos.length} Cursos
                  </span>
                </div>

                <div className={styles.distributionList}>
                  {stats.metricas_gestao.distribuicao_cursos.length > 0 ? (
                    stats.metricas_gestao.distribuicao_cursos.map((curso) => (
                      <div key={curso.id} className={styles.distributionItem}>
                        <div className={styles.distributionHeader}>
                          <span className={styles.distributionLabel}>
                            {curso.nome}
                          </span>
                          <span className={styles.distributionCount}>
                            {curso.ocorrencias_count} ({curso.percentual}%)
                          </span>
                        </div>
                        <div className={styles.progressBarTrack}>
                          <div
                            className={styles.progressBarFill}
                            style={{
                              width: `${curso.percentual}%`,
                              backgroundColor: "var(--color-primary)",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyCardText}>Nenhum registro por curso ainda.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={styles.cardFooterBtn}
                onClick={() => navigate("/relatorios")}
              >
                <span>Relatório analítico por curso</span>
                <ArrowRight size={14} />
              </button>
            </article>

            {/* Bloco 2: Top 5 UCs Críticas */}
            <article className={styles.analyticsCard}>
              <div>
                <div className={styles.analyticsHeader}>
                  <div className={styles.analyticsTitleGroup}>
                    <BookOpen size={18} color="var(--color-warning)" />
                    <span className={styles.analyticsTitle}>UCs com Mais Faltas</span>
                  </div>
                  <span className={styles.analyticsBadge} style={{ backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, transparent)", color: "var(--color-warning)" }}>
                    Top 5 Críticas
                  </span>
                </div>

                <div className={styles.rankingList}>
                  {stats.metricas_gestao.top_ucs_criticas.length > 0 ? (
                    stats.metricas_gestao.top_ucs_criticas.map((uc, index) => (
                      <div key={uc.id} className={styles.rankingItem}>
                        <div className={styles.rankingPosition}>{index + 1}</div>
                        <div className={styles.rankingInfo}>
                          <span className={styles.rankingName} title={uc.nome}>
                            {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome}
                          </span>
                          <span className={styles.rankingSubtext}>
                            {uc.total_faltas} aulas faltadas acumuladas
                          </span>
                        </div>
                        <span className={styles.rankingCount}>
                          {uc.total_ocorrencias} FIAPs
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyCardText}>Nenhuma unidade curricular com faltas críticas.</p>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={styles.cardFooterBtn}
                onClick={() => navigate("/relatorios")}
              >
                <span>Ver plano de disciplinas</span>
                <ArrowRight size={14} />
              </button>
            </article>

            {/* Bloco 3: Funil de Resoluções AQV */}
            <article className={styles.analyticsCard}>
              <div>
                <div className={styles.analyticsHeader}>
                  <div className={styles.analyticsTitleGroup}>
                    <Headphones size={18} color="#0059a8" />
                    <span className={styles.analyticsTitle}>Funil de Atendimento AQV</span>
                  </div>
                  <span className={styles.analyticsBadge} style={{ backgroundColor: "color-mix(in srgb, #0059a8 12%, transparent)", color: "#0059a8" }}>
                    {stats.metricas_gestao.funil_aqv.total} Total
                  </span>
                </div>

                <div className={styles.funnelList}>
                  <div className={styles.funnelStep}>
                    <div className={styles.funnelHeader}>
                      <span className={styles.funnelLabel}>
                        <Clock size={14} color="var(--color-warning)" /> Aguardando Acolhimento
                      </span>
                      <span className={styles.funnelValue}>
                        {stats.metricas_gestao.funil_aqv.aguardando} casos
                      </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${stats.metricas_gestao.funil_aqv.total > 0 ? (stats.metricas_gestao.funil_aqv.aguardando / stats.metricas_gestao.funil_aqv.total) * 100 : 0}%`,
                          backgroundColor: "var(--color-warning)",
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.funnelStep}>
                    <div className={styles.funnelHeader}>
                      <span className={styles.funnelLabel}>
                        <Headphones size={14} color="#0059a8" /> Em Mediação Pedagógica
                      </span>
                      <span className={styles.funnelValue}>
                        {stats.metricas_gestao.funil_aqv.em_atendimento} casos
                      </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${stats.metricas_gestao.funil_aqv.total > 0 ? (stats.metricas_gestao.funil_aqv.em_atendimento / stats.metricas_gestao.funil_aqv.total) * 100 : 0}%`,
                          backgroundColor: "#0059a8",
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.funnelStep}>
                    <div className={styles.funnelHeader}>
                      <span className={styles.funnelLabel}>
                        <CheckCircle2 size={14} color="var(--color-success)" /> Concluídas & Assinadas
                      </span>
                      <span className={styles.funnelValue}>
                        {stats.metricas_gestao.funil_aqv.concluidos} casos
                      </span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div
                        className={styles.progressBarFill}
                        style={{
                          width: `${stats.metricas_gestao.funil_aqv.total > 0 ? (stats.metricas_gestao.funil_aqv.concluidos / stats.metricas_gestao.funil_aqv.total) * 100 : 0}%`,
                          backgroundColor: "var(--color-success)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.cardFooterBtn}
                onClick={() => navigate("/aqv")}
              >
                <span>Acessar fila completa do AQV</span>
                <ArrowRight size={14} />
              </button>
            </article>
          </div>
        </section>
      )}

      {/* 2. Grid de Cards KPI de Resumo */}
      <section className={styles.kpiGrid} aria-label="Indicadores gerais do mês">
        {/* Card 1: Total do Mês */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Ocorrências no Mês</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : kpis?.total_mes ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              <FileText size={22} />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span
              style={{
                color: difMes >= 0 ? "var(--color-primary)" : "var(--color-success)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              <TrendingUp size={14} /> {difMes >= 0 ? `+${difMes}` : difMes} registros
            </span>
            <span>vs. mês anterior</span>
          </div>
        </article>

        {/* Card 2: Pendentes */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Pendentes de Envio</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : kpis?.pendentes ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
                color: "var(--color-warning)",
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span
              style={{
                color: "var(--color-warning)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <span className={styles.pulseDot} style={{ backgroundColor: "var(--color-warning)" }} />
              Aguardando encaminhamento
            </span>
          </div>
        </article>

        {/* Card 3: Encaminhadas AQV */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Encaminhadas à AQV</span>
              <div className={styles.kpiValue} style={{ color: "#0059a8" }}>
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : kpis?.encaminhadas_aqv ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, #0059a8 12%, transparent)",
                color: "#0059a8",
              }}
            >
              <Headphones size={22} />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span>Em mediação pedagógica</span>
            <span style={{ fontWeight: 700, color: "#0059a8" }}>
              {kpis && kpis.total_mes > 0
                ? `${Math.round((kpis.encaminhadas_aqv / kpis.total_mes) * 100)}%`
                : "0%"}
            </span>
          </div>
        </article>

        {/* Card 4: Alunos em Situação de Atenção */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Alunos em Alerta</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-text-primary)" }}>
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : kpis?.alunos_em_alerta ?? 0}
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                color: "var(--color-warning)",
              }}
            >
              <Users size={22} />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span style={{ color: "var(--color-warning)", fontWeight: 600 }}>Reincidentes</span>
            <span style={{ color: "var(--color-text-secondary)" }}>Atenção prioritária</span>
          </div>
        </article>
      </section>

      {/* 3. Tabela Interativa de Ocorrências Recentes */}
      <section className={styles.tableCard} aria-label="Tabela de Ocorrências Recentes">
        {/* Barra de Filtros */}
        <div className={styles.tableToolbar}>
          <div className={styles.tableSearchWrapper}>
            <Search size={16} className={styles.tableSearchIcon} />
            <input
              type="text"
              className={styles.tableSearchInput}
              placeholder="Buscar por estudante, RA ou nº da FIAP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filtrar tabela"
            />
          </div>

          <div className={styles.tableFilters}>
            <select
              className={styles.selectInput}
              value={selectedTurmaId}
              onChange={(e) => setSelectedTurmaId(e.target.value)}
              aria-label="Filtrar por turma"
            >
              <option value="todas">
                {user?.role === "instrutor" ? "Minhas Turmas" : "Todas as Turmas"}
              </option>
              {stats?.turmas_resumo?.map((turma) => (
                <option key={turma.id} value={String(turma.id)}>
                  {turma.nome}
                </option>
              ))}
            </select>

            <select
              className={styles.selectInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente de Envio</option>
              <option value="enviado_aqv">Encaminhado AQV</option>
              <option value="pdf_gerado">PDF Gerado</option>
              <option value="impresso">Impresso</option>
              <option value="assinado">Assinado</option>
            </select>
          </div>
        </div>

        {/* Tabela de Ocorrências */}
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>Nº Sequencial</th>
                <th>Estudante</th>
                <th>Turma Vinculada</th>
                <th>Tipo</th>
                <th>Data</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
                    <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
                    <p style={{ color: "var(--color-text-secondary)" }}>Carregando dados do painel...</p>
                  </td>
                </tr>
              ) : filteredOccurrences.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--color-text-secondary)" }}>
                    Nenhuma ocorrência encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOccurrences.map((occ) => {
                  const statusStyle = getStatusStyle(occ.status);
                  const aluno = occ.aluno;
                  const initial = aluno?.nome ? aluno.nome.charAt(0).toUpperCase() : "A";

                  return (
                    <tr key={occ.id} className={styles.tableRow}>
                      {/* Nº Sequencial */}
                      <td>
                        <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--color-text-primary)" }}>
                          {occ.numero_sequencial || `#${occ.id}`}
                        </span>
                      </td>

                      {/* Aluno & RA */}
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentAvatar}>{initial}</div>
                          <div className={styles.studentInfo}>
                            <span className={styles.studentName}>{aluno?.nome || "Estudante"}</span>
                            <span className={styles.studentRa}>RA: {aluno?.matricula || "—"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Turma */}
                      <td>
                        <span style={{ fontWeight: 600, display: "block" }}>
                          {aluno?.turma?.nome || "Sem Turma"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          {aluno?.turma?.turno || "Turno não def."}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td>
                        <span
                          className={styles.occurrenceBadge}
                          style={{
                            backgroundColor:
                              occ.tipo === "falta"
                                ? "color-mix(in srgb, var(--color-warning) 12%, transparent)"
                                : occ.tipo === "comportamento"
                                  ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                                  : "var(--color-surface)",
                            color:
                              occ.tipo === "falta"
                                ? "var(--color-warning)"
                                : occ.tipo === "comportamento"
                                  ? "var(--color-primary)"
                                  : "var(--color-text-primary)",
                          }}
                        >
                          {occ.tipo === "falta" && <Clock size={13} />}
                          {occ.tipo === "comportamento" && <Shield size={13} />}
                          {occ.tipo === "desempenho" && <BookOpen size={13} />}
                          <span style={{ textTransform: "capitalize" }}>{occ.tipo}</span>
                        </span>
                      </td>

                      {/* Data */}
                      <td>
                        <span style={{ fontWeight: 500, display: "block" }}>
                          {formatDate(occ.data_ocorrencia)}
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>
                          Por: {occ.registrado_por_user?.name?.split(" ")[0] || "Instrutor"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={styles.statusPill}
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          <span
                            className={styles.statusDot}
                            style={{ backgroundColor: statusStyle.dot }}
                          />
                          {statusStyle.label}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.actionIconBtn}
                          title="Visualizar FIAP Completa"
                          onClick={() => setSelectedDetalhes(occ)}
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

        {/* Rodapé da tabela com atalho */}
        <div className={styles.tablePagination}>
          <span className={styles.paginationText}>
            Exibindo <strong>{filteredOccurrences.length}</strong> de{" "}
            <strong>{stats?.ocorrencias_recentes?.length || 0}</strong> ocorrências recentes
          </span>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/ocorrencias")}
            style={{ fontSize: "0.8125rem", padding: "0.4rem 0.75rem" }}
          >
            <span>Ver Todas as FIAPs</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 5. Seção Inferior: Grid de 3 Blocos de Apoio Pedagógico */}
      <section className={styles.bottomSectionGrid}>
        {/* Bloco 1: Minhas Turmas Atribuídas */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <CalendarCheck size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>
                {user?.role === "instrutor" ? "Minhas Turmas Atribuídas" : "Turmas em Destaque"}
              </span>
            </div>

            <div className={styles.turmasList}>
              {stats?.turmas_resumo && stats.turmas_resumo.length > 0 ? (
                stats.turmas_resumo.slice(0, 3).map((turma) => (
                  <div key={turma.id} className={styles.turmaItemCard}>
                    <div className={styles.turmaHeaderRow}>
                      <span className={styles.turmaCodigoBadge}>{turma.nome}</span>
                      <span className={styles.turmaFiapsBadge}>
                        {turma.alunos_count} alunos <span className={styles.fiapSubtext}>({turma.ocorrencias_count} FIAPs)</span>
                      </span>
                    </div>
                    <div className={styles.turmaSubtext}>
                      {turma.curso?.nome || "Curso Técnico"} • {turma.turno || "Integral"}
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.emptyCardText}>
                  Nenhuma turma vinculada a este perfil.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className={styles.cardFooterBtn}
            onClick={() => navigate(user?.role === "gestor" ? "/turmas" : "/ocorrencias")}
          >
            <span>Acompanhar turmas completas</span>
            <ArrowRight size={14} />
          </button>
        </article>

        {/* Bloco 2: Escala de Sanções Regimentais */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <BookOpen size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>Escala de Sanções Regimentais</span>
            </div>

            <ul className={styles.sanctionStyledList}>
              <li className={styles.sanctionItem}>
                <span className={`${styles.sanctionBadge} ${styles.badgeWarning}`}>Advertência Verbal</span>
                <span className={styles.sanctionDesc}>1ª ocorrência leve com registro e ciência do estudante.</span>
              </li>
              <li className={styles.sanctionItem}>
                <span className={`${styles.sanctionBadge} ${styles.badgeDanger}`}>Advertência Escrita</span>
                <span className={styles.sanctionDesc}>Reincidência ou infração média com assinatura dos responsáveis.</span>
              </li>
              <li className={styles.sanctionItem}>
                <span className={`${styles.sanctionBadge} ${styles.badgeDark}`}>Suspensão de Atividades</span>
                <span className={styles.sanctionDesc}>Falta grave de segurança em laboratório ou oficina.</span>
              </li>
            </ul>
          </div>

          <div className={styles.cardFooterTag}>
            <ShieldCheck size={15} color="var(--color-primary)" />
            <span>Regimento Escolar Oficial SENAI</span>
          </div>
        </article>

        {/* Bloco 3: Distribuição por Modalidade */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <BarChart3 size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>Distribuição por Modalidade</span>
            </div>

            <div className={styles.distributionList}>
              <div className={styles.distributionItem}>
                <div className={styles.distributionHeader}>
                  <span className={styles.distributionLabel}>
                    <Clock size={14} color="#d97706" /> Faltas Excessivas
                  </span>
                  <span className={styles.distributionCount}>
                    {distTipo.falta} ({pctFalta}%)
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pctFalta}%`, backgroundColor: "#d97706" }}
                  />
                </div>
              </div>

              <div className={styles.distributionItem}>
                <div className={styles.distributionHeader}>
                  <span className={styles.distributionLabel}>
                    <Shield size={14} color="var(--color-primary)" /> Conduta / Disciplinar
                  </span>
                  <span className={styles.distributionCount}>
                    {distTipo.comportamento} ({pctComportamento}%)
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pctComportamento}%`, backgroundColor: "var(--color-primary)" }}
                  />
                </div>
              </div>

              <div className={styles.distributionItem}>
                <div className={styles.distributionHeader}>
                  <span className={styles.distributionLabel}>
                    <BookOpen size={14} color="#2563eb" /> Aproveitamento / Desempenho
                  </span>
                  <span className={styles.distributionCount}>
                    {distTipo.desempenho} ({pctDesempenho}%)
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pctDesempenho}%`, backgroundColor: "#2563eb" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardFooterBtn}
            onClick={() => navigate("/relatorios")}
          >
            <span>Ver demonstrativo completo</span>
            <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {/* Modal de Detalhes da FIAP */}
      <OcorrenciaDetalhesModal
        isOpen={Boolean(selectedDetalhes)}
        onClose={() => setSelectedDetalhes(null)}
        ocorrencia={selectedDetalhes}
      />

      {/* Modal de Criação Rápida de Ocorrência */}
      <OcorrenciaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadDashboard();
        }}
      />
    </div>
  );
}

export default Dashboard;
