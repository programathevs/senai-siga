import { useState, useMemo } from "react";
import {
  Calendar,
  Download,
  PlusCircle,
  FileText,
  TrendingUp,
  Clock,
  Headphones,
  ClipboardCheck,
  AlertTriangle,
  Search,
  ArrowRight,
  ExternalLink,
  Eye,
  MoreVertical,
  CalendarCheck,
  BookOpen,
  PhoneCall,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Dashboard.module.css";

interface OccurrenceRecord {
  id: string;
  initials: string;
  studentName: string;
  ra: string;
  course: string;
  period: string;
  type: string;
  typeCategory: "warning" | "error" | "info" | "neutral";
  date: string;
  location: string;
  recoveryPlan: string;
  recoveryProgress?: number;
  status: "Pendente de Envio" | "Encaminhado AQV" | "Em Acompanhamento" | "Resolvido / Assinado" | "Rascunho";
}

const INITIAL_OCCURRENCES: OccurrenceRecord[] = [
  {
    id: "1",
    initials: "LF",
    studentName: "Lucas Gabriel Ferreira",
    ra: "2024.11082",
    course: "Téc. Automação Ind.",
    period: "3º Semestre • Tarde",
    type: "Falta Excessiva (>25%)",
    typeCategory: "warning",
    date: "14/05/2025 - 10:45",
    location: "Lab. Robótica",
    recoveryPlan: "Vinculado (Prazo: 28/05)",
    recoveryProgress: 45,
    status: "Encaminhado AQV",
  },
  {
    id: "2",
    initials: "MS",
    studentName: "Matheus Silva Santos",
    ra: "2023.20451",
    course: "Téc. Eletromecânica",
    period: "2º Módulo • Manhã",
    type: "Uso Indevido de EPI",
    typeCategory: "error",
    date: "13/05/2025 - 08:15",
    location: "Oficina Mecânica",
    recoveryPlan: "Não aplicável",
    status: "Pendente de Envio",
  },
  {
    id: "3",
    initials: "BA",
    studentName: "Beatriz de Almeida Ramos",
    ra: "2024.19302",
    course: "Téc. Desenv. Sistemas",
    period: "1º Termo • Noite",
    type: "Baixo Rendimento Contínuo",
    typeCategory: "info",
    date: "12/05/2025 - 19:40",
    location: "Sala TI 04",
    recoveryPlan: "Plano Pedagógico Ativo",
    recoveryProgress: 75,
    status: "Em Acompanhamento",
  },
  {
    id: "4",
    initials: "GO",
    studentName: "Guilherme Oliveira Neto",
    ra: "2024.11450",
    course: "Téc. Automação Ind.",
    period: "3º Semestre • Tarde",
    type: "Indisciplina em Oficina",
    typeCategory: "neutral",
    date: "10/05/2025 - 14:10",
    location: "Oficina Automação",
    recoveryPlan: "Concluído & Arquivado",
    status: "Resolvido / Assinado",
  },
  {
    id: "5",
    initials: "EN",
    studentName: "Eduardo Nogueira Lima",
    ra: "2024.16723",
    course: "Aprendizagem Mecânica",
    period: "1º Termo • Tarde",
    type: "Uso Indevido de Aparelho",
    typeCategory: "neutral",
    date: "09/05/2025 - 16:00",
    location: "Lab. Tornearia",
    recoveryPlan: "Sem plano",
    status: "Rascunho",
  },
  {
    id: "6",
    initials: "JP",
    studentName: "João Paulo Mendonça",
    ra: "2023.18900",
    course: "Téc. Eletromecânica",
    period: "2º Módulo • Manhã",
    type: "Falta Excessiva (>25%)",
    typeCategory: "warning",
    date: "08/05/2025 - 11:20",
    location: "Teoria Eletrotécnica",
    recoveryPlan: "Vinculado (Prazo: 22/05)",
    recoveryProgress: 90,
    status: "Encaminhado AQV",
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("todos");
  const [selectedCourse, setSelectedCourse] = useState("todas");

  // Filtro interativo em tempo real
  const filteredOccurrences = useMemo(() => {
    return INITIAL_OCCURRENCES.filter((item) => {
      const matchesSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "todos" ||
        item.status.toLowerCase().includes(selectedStatus.toLowerCase());

      const matchesCourse =
        selectedCourse === "todas" ||
        item.course.toLowerCase().includes(selectedCourse.toLowerCase());

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [searchTerm, selectedStatus, selectedCourse]);

  function getStatusStyle(status: OccurrenceRecord["status"]) {
    switch (status) {
      case "Encaminhado AQV":
        return {
          bg: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
          color: "var(--color-primary)",
          dot: "var(--color-primary)",
        };
      case "Pendente de Envio":
        return {
          bg: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
          color: "var(--color-warning)",
          dot: "var(--color-warning)",
        };
      case "Em Acompanhamento":
        return {
          bg: "color-mix(in srgb, #0059a8 12%, transparent)",
          color: "#0059a8",
          dot: "#0059a8",
        };
      case "Resolvido / Assinado":
        return {
          bg: "color-mix(in srgb, var(--color-success) 12%, transparent)",
          color: "var(--color-success)",
          dot: "var(--color-success)",
        };
      case "Rascunho":
        return {
          bg: "var(--color-surface)",
          color: "var(--color-text-secondary)",
          dot: "var(--color-text-secondary)",
        };
    }
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. Header de Ação da Página */}
      <section className={styles.pageHeader}>
        <div className={styles.headerTextGroup}>
          <div className={styles.moduleTagRow}>
            <span className={styles.moduleTag}>Módulo Acadêmico</span>
            <span className={styles.versionTag}>• SGA-D v2.4</span>
          </div>
          <h1 className={styles.pageTitle}>
            {user?.role === "admin" ? "Painel de Administração" : "Painel do Docente"}
          </h1>
          <p className={styles.pageSubtitle}>
            Bem-vindo de volta, <strong>{user?.name || "Professor"}</strong>. Gerencie suas turmas, ocorrências e planos de mediação disciplinar.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryBtn}>
            <Calendar size={16} color="var(--color-primary)" />
            <span>Maio/2025</span>
          </button>

          <button type="button" className={styles.secondaryBtn}>
            <Download size={16} />
            <span>Relatório</span>
          </button>

          <button type="button" className={styles.primaryActionBtn}>
            <PlusCircle size={18} />
            <span>+ Nova Ocorrência</span>
          </button>
        </div>
      </section>

      {/* 2. Grid de Cards KPI de Resumo */}
      <section className={styles.kpiGrid} aria-label="Indicadores gerais do mês">
        {/* Card 1 */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Ocorrências no Mês</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-primary)" }}>
                18
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
            <span style={{ color: "var(--color-success)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.2rem" }}>
              <TrendingUp size={14} /> +3 registros
            </span>
            <span>vs. Abril</span>
          </div>
        </article>

        {/* Card 2 */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Pendentes de Envio</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-warning)" }}>
                4
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
            <span style={{ color: "var(--color-warning)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span className={styles.pulseDot} style={{ backgroundColor: "var(--color-warning)" }} />
              Aguardando finalização
            </span>
          </div>
        </article>

        {/* Card 3 */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Encaminhadas à AQV</span>
              <div className={styles.kpiValue} style={{ color: "#0059a8" }}>
                9
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
            <span>Em acolhimento pedagógico</span>
            <span style={{ fontWeight: 700, color: "#0059a8" }}>50%</span>
          </div>
        </article>

        {/* Card 4 */}
        <article className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <div>
              <span className={styles.kpiLabel}>Planos de Recuperação</span>
              <div className={styles.kpiValue} style={{ color: "var(--color-text-primary)" }}>
                5
              </div>
            </div>
            <div
              className={styles.kpiIconWrapper}
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-primary)",
              }}
            >
              <ClipboardCheck size={22} />
            </div>
          </div>
          <div className={styles.kpiFooter}>
            <span style={{ color: "var(--color-success)", fontWeight: 600 }}>3 ativos</span>
            <span style={{ color: "var(--color-text-secondary)" }}>2 conc.</span>
          </div>
        </article>
      </section>

      {/* 3. Banner Institucional de Conformidade */}
      <section className={styles.alertBanner} aria-label="Alerta de conformidade">
        <div className={styles.alertLeft}>
          <div className={styles.alertIconBox}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className={styles.alertTitle}>Regulamento Escolar SENAI - Procedimento Obrigatório</div>
            <div className={styles.alertDesc}>
              Falta excessiva acumulada (&gt;25% do módulo) requer abertura de protocolo com anexo obrigatório do espelho de frequência para mediação pela AQV.
            </div>
          </div>
        </div>

        <a href="#diretrizes" className={styles.alertBtn}>
          <span>Ver Diretriz Interna</span>
          <ArrowRight size={14} />
        </a>
      </section>

      {/* 4. Tabela Interativa de Ocorrências */}
      <section className={styles.tableCard} aria-label="Tabela de Ocorrências">
        {/* Barra de Filtros */}
        <div className={styles.tableToolbar}>
          <div className={styles.tableSearchWrapper}>
            <Search size={16} className={styles.tableSearchIcon} />
            <input
              type="text"
              className={styles.tableSearchInput}
              placeholder="Buscar por aluno, RA, protocolo ou curso..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Filtrar tabela"
            />
          </div>

          <div className={styles.tableFilters}>
            <select
              className={styles.selectInput}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              aria-label="Filtrar por curso"
            >
              <option value="todas">Todas as Turmas (5)</option>
              <option value="eletromecânica">Téc. Eletromecânica</option>
              <option value="sistemas">Téc. Desenv. Sistemas</option>
              <option value="automação">Téc. Automação Ind.</option>
              <option value="mecânica">Aprendizagem Mecânica</option>
            </select>

            <select
              className={styles.selectInput}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente de Envio</option>
              <option value="aqv">Encaminhado AQV</option>
              <option value="acompanhamento">Em Acompanhamento</option>
              <option value="resolvido">Resolvido / Assinado</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className={styles.tableResponsive}>
          <table className={styles.dataTable}>
            <thead>
              <tr className={styles.tableHeadRow}>
                <th>Aluno &amp; Matrícula</th>
                <th>Turma / Período</th>
                <th>Tipo de Ocorrência</th>
                <th>Data Registro</th>
                <th>Plano de Recuperação</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredOccurrences.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--color-text-secondary)" }}>
                    Nenhuma ocorrência encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredOccurrences.map((occ) => {
                  const statusStyle = getStatusStyle(occ.status);
                  return (
                    <tr key={occ.id} className={styles.tableRow}>
                      {/* Aluno & RA */}
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.studentAvatar}>{occ.initials}</div>
                          <div className={styles.studentInfo}>
                            <span className={styles.studentName}>{occ.studentName}</span>
                            <span className={styles.studentRa}>RA: {occ.ra}</span>
                          </div>
                        </div>
                      </td>

                      {/* Turma & Período */}
                      <td>
                        <span style={{ fontWeight: 600, display: "block" }}>{occ.course}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          {occ.period}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td>
                        <span
                          className={styles.occurrenceBadge}
                          style={{
                            backgroundColor:
                              occ.typeCategory === "warning"
                                ? "color-mix(in srgb, var(--color-warning) 12%, transparent)"
                                : occ.typeCategory === "error"
                                ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                                : "var(--color-surface)",
                            color:
                              occ.typeCategory === "warning"
                                ? "var(--color-warning)"
                                : occ.typeCategory === "error"
                                ? "var(--color-primary)"
                                : "var(--color-text-primary)",
                          }}
                        >
                          {occ.typeCategory === "warning" && <AlertTriangle size={13} />}
                          {occ.typeCategory === "error" && <Shield size={13} />}
                          {occ.type}
                        </span>
                      </td>

                      {/* Data */}
                      <td>
                        <span style={{ fontWeight: 500, display: "block" }}>{occ.date.split(" - ")[0]}</span>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-secondary)" }}>
                          {occ.date.split(" - ")[1]} • {occ.location}
                        </span>
                      </td>

                      {/* Plano de Recuperação */}
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{occ.recoveryPlan}</span>
                        {occ.recoveryProgress !== undefined && (
                          <div
                            style={{
                              width: "6rem",
                              height: "0.35rem",
                              borderRadius: "9999px",
                              backgroundColor: "var(--color-surface)",
                              overflow: "hidden",
                              marginTop: "0.3rem",
                            }}
                          >
                            <div
                              style={{
                                width: `${occ.recoveryProgress}%`,
                                height: "100%",
                                backgroundColor: "var(--color-primary)",
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        )}
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
                          {occ.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.25rem" }}>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            title="Visualizar Dossiê"
                            aria-label="Visualizar Dossiê"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionIconBtn}
                            title="Mais Opções"
                            aria-label="Mais Opções"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className={styles.tablePagination}>
          <span className={styles.paginationText}>
            Exibindo <strong>{filteredOccurrences.length}</strong> de <strong>18</strong> ocorrências registradas neste mês
          </span>

          <div className={styles.paginationControls}>
            <button type="button" className={styles.pageBtn} disabled>
              Anterior
            </button>
            <button type="button" className={`${styles.pageBtn} ${styles.pageBtnActive}`}>
              1
            </button>
            <button type="button" className={styles.pageBtn}>
              2
            </button>
            <button type="button" className={styles.pageBtn}>
              3
            </button>
            <button type="button" className={styles.pageBtn}>
              Próximo
            </button>
          </div>
        </div>
      </section>

      {/* 5. Seção Inferior: Grid de 3 Blocos de Apoio Pedagógico */}
      <section className={styles.bottomSectionGrid}>
        {/* Bloco 1: Próximas Mediações */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <CalendarCheck size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>Próximas Mediações AQV</span>
            </div>

            <div className={styles.bottomCardList} style={{ marginTop: "0.75rem" }}>
              <div className={styles.mediationItem}>
                <div>
                  <div className={styles.mediationTitle}>Audiência com Responsável: Lucas G.</div>
                  <div className={styles.mediationTime}>Amanhã • 14:00 • Sala de Orientação AQV</div>
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-success)" }}>
                  Confirmado
                </span>
              </div>

              <div className={styles.mediationItem}>
                <div>
                  <div className={styles.mediationTitle}>Acompanhamento: Beatriz A.</div>
                  <div className={styles.mediationTime}>20/05 • 10:30 • Coord. Pedagógica</div>
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  Agendado
                </span>
              </div>
            </div>
          </div>

          <a href="#calendario" className={styles.cardFooterLink}>
            <span>Ver calendário completo</span>
            <ArrowRight size={14} />
          </a>
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

          <a href="#regimento" className={styles.cardFooterLink}>
            <span>Consultar Regimento Completo SENAI</span>
            <ExternalLink size={13} />
          </a>
        </article>

        {/* Bloco 3: Plantão AQV & Coordenação */}
        <article className={styles.bottomCard}>
          <div>
            <div className={styles.bottomCardHeader}>
              <PhoneCall size={18} color="var(--color-primary)" />
              <span className={styles.bottomCardTitle}>Plantão AQV &amp; Coordenação</span>
            </div>

            <div className={styles.bottomCardList} style={{ marginTop: "0.75rem" }}>
              <div className={styles.contactItem}>
                <div>
                  <div className={styles.contactName}>Coord. Mariana Prado</div>
                  <div className={styles.contactRole}>Ramal: 3341 • Sala B-12</div>
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-success)" }}>
                  Online
                </span>
              </div>

              <div className={styles.contactItem}>
                <div>
                  <div className={styles.contactName}>Psicóloga Escolar (AQV)</div>
                  <div className={styles.contactRole}>Dra. Renata Gomes • Ramal: 3388</div>
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  Plantão
                </span>
              </div>
            </div>
          </div>

          <button type="button" className={styles.fullWidthBtn}>
            Abrir Chamado Interno AQV
          </button>
        </article>
      </section>
    </div>
  );
}
