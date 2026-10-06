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
  Loader2,
  Users,
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
            {user?.role === "admin"
              ? "Painel da Coordenação & Direção"
              : user?.role === "aqv"
              ? "Painel de Apoio e Qualidade de Vida (AQV)"
              : "Painel do Docente"}
          </h1>
          <p className={styles.pageSubtitle}>
            Bem-vindo de volta, <strong>{user?.name || "Usuário"}</strong>.{" "}
            {user?.role === "instrutor"
              ? "Acompanhe suas turmas lecionadas, o histórico disciplinar dos estudantes e atue precocemente."
              : "Visão consolidada de ocorrências, acompanhamento disciplinar e dados pedagógicos da unidade."}
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryBtn}>
            <Calendar size={16} color="var(--color-primary)" />
            <span>{stats?.periodo?.mes_nome || "Mês Vigente"}</span>
          </button>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate("/relatorios")}
            title="Ir para Relatórios Pedagógicos"
          >
            <Download size={16} />
            <span>Relatórios</span>
          </button>

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
        {/* Bloco 1: Minhas Turmas em Foco */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <CalendarCheck size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>
                {user?.role === "instrutor" ? "Minhas Turmas Atribuídas" : "Turmas em Destaque"}
              </span>
            </div>

            <div className={styles.bottomCardList} style={{ marginTop: "0.75rem" }}>
              {stats?.turmas_resumo && stats.turmas_resumo.length > 0 ? (
                stats.turmas_resumo.slice(0, 3).map((turma) => (
                  <div key={turma.id} className={styles.mediationItem}>
                    <div>
                      <div className={styles.mediationTitle}>{turma.nome}</div>
                      <div className={styles.mediationTime}>
                        {turma.curso?.nome || "Curso"} • {turma.turno || "Turno"}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)" }}>
                      {turma.alunos_count} alunos ({turma.ocorrencias_count} FIAPs)
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                  Nenhuma turma vinculada a este perfil.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            className={styles.cardFooterLink}
            onClick={() => navigate(user?.role === "admin" ? "/turmas" : "/ocorrencias")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
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

            <ul className={styles.sanctionList} style={{ marginTop: "0.75rem" }}>
              <li>
                <span className={styles.sanctionDot} />
                <span>
                  <strong>Advertência Verbal:</strong> 1ª ocorrência leve com registro e ciência do estudante.
                </span>
              </li>
              <li>
                <span className={styles.sanctionDot} />
                <span>
                  <strong>Advertência Escrita:</strong> Reincidência ou infração média com assinatura dos responsáveis.
                </span>
              </li>
              <li>
                <span className={styles.sanctionDot} />
                <span>
                  <strong>Suspensão de Atividades:</strong> Falta grave de segurança em laboratório ou oficina.
                </span>
              </li>
            </ul>
          </div>

          <div className={styles.cardFooterLink}>
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
                    <Clock size={13} color="var(--color-warning)" /> Faltas Excessivas
                  </span>
                  <span className={styles.distributionCount}>
                    {distTipo.falta} ({pctFalta}%)
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pctFalta}%`, backgroundColor: "var(--color-warning)" }}
                  />
                </div>
              </div>

              <div className={styles.distributionItem}>
                <div className={styles.distributionHeader}>
                  <span className={styles.distributionLabel}>
                    <Shield size={13} color="var(--color-primary)" /> Conduta / Disciplinar
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
                    <BookOpen size={13} color="var(--color-text-primary)" /> Aproveitamento / Desempenho
                  </span>
                  <span className={styles.distributionCount}>
                    {distTipo.desempenho} ({pctDesempenho}%)
                  </span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${pctDesempenho}%`, backgroundColor: "var(--color-text-primary)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.cardFooterLink}
            onClick={() => navigate("/relatorios")}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
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
