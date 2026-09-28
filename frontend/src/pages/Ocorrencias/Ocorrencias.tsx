import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  FileText,
  Clock,
  ShieldAlert,
  BookOpen,
  Headphones,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  Send,
} from "lucide-react";
import {
  ocorrenciaService,
  type Ocorrencia,
  type OcorrenciaTipo,
  type OcorrenciaStatus,
  type OcorrenciaEstatisticas,
} from "../../services/ocorrenciaService";
import { turmaService, type Turma } from "../../services/turmaService";
import { useAuth } from "../../contexts/AuthContext";
import { OcorrenciaModal } from "./OcorrenciaModal";
import { OcorrenciaDetalhesModal } from "./OcorrenciaDetalhesModal";
import styles from "./Ocorrencias.module.css";

export function Ocorrencias() {
  const { user } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [estatisticas, setEstatisticas] = useState<OcorrenciaEstatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<OcorrenciaTipo | "">("");
  const [selectedStatus, setSelectedStatus] = useState<OcorrenciaStatus | "">("");

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [selectedDetalhes, setSelectedDetalhes] = useState<Ocorrencia | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  const canCreate = user?.role === "admin" || user?.role === "instrutor";

  async function loadOcorrencias() {
    try {
      setIsLoading(true);
      const res = await ocorrenciaService.getOcorrencias({
        search: search.trim() || undefined,
        turma_id: selectedTurmaId || undefined,
        tipo: selectedTipo || undefined,
        status: selectedStatus || undefined,
      });

      setOcorrencias(res.data);
      if (res.meta?.estatisticas) {
        setEstatisticas(res.meta.estatisticas);
      }
    } catch {
      setOcorrencias([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    turmaService.getTurmas().then(setTurmas).catch(() => setTurmas([]));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadOcorrencias();
      return;
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadOcorrencias();
      }, 300);
      return () => clearTimeout(timer);
    }

    loadOcorrencias();
  }, [search, selectedTurmaId, selectedTipo, selectedStatus]);

  function handleOpenCreate() {
    setEditingOcorrencia(null);
    setIsFormModalOpen(true);
  }

  function handleOpenEdit(oc: Ocorrencia) {
    setEditingOcorrencia(oc);
    setIsFormModalOpen(true);
  }

  function handleOpenDetalhes(oc: Ocorrencia) {
    setSelectedDetalhes(oc);
  }

  async function handleDelete(oc: Ocorrencia) {
    if (
      window.confirm(
        `Tem certeza de que deseja remover a FIAP "${oc.numero_sequencial}" do aluno "${oc.aluno?.nome}"?`
      )
    ) {
      try {
        await ocorrenciaService.deleteOcorrencia(oc.id);
        loadOcorrencias();
      } catch (err: any) {
        alert(err.response?.data?.message || "Não foi possível remover a ocorrência.");
      }
    }
  }

  async function handleEncaminharAqv(id: number) {
    if (window.confirm("Deseja encaminhar este caso para o acompanhamento do AQV?")) {
      try {
        await ocorrenciaService.encaminharAqv(id);
        alert("Ocorrência encaminhada com sucesso ao setor de AQV!");
        loadOcorrencias();
        if (selectedDetalhes?.id === id) {
          const updated = await ocorrenciaService.getOcorrencia(id);
          setSelectedDetalhes(updated);
        }
      } catch (err: any) {
        alert(err.response?.data?.message || "Erro ao encaminhar para o AQV.");
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Página */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Ocorrências &amp; FIAPs</h1>
          <p className={styles.subtitle}>
            Fichas Individuais de Acompanhamento Periódico: faltas, comportamento disciplinar e
            rendimento acadêmico.
          </p>
        </div>

        {canCreate && (
          <button type="button" className={styles.addBtn} onClick={handleOpenCreate}>
            <Plus size={18} />
            Nova Ocorrência (FIAP)
          </button>
        )}
      </div>

      {/* Grid de Cards KPI */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}
          >
            <FileText size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{estatisticas?.total_mes ?? ocorrencias.length}</span>
            <span className={styles.kpiLabel}>Total Registradas</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{ backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)", color: "#f59e0b" }}
          >
            <Clock size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: "#d97706" }}>
              {estatisticas?.total_falta ?? ocorrencias.filter((o) => o.tipo === "falta").length}
            </span>
            <span className={styles.kpiLabel}>Falta (Infrequência)</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{ backgroundColor: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444" }}
          >
            <ShieldAlert size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: "#dc2626" }}>
              {estatisticas?.total_comportamento ?? ocorrencias.filter((o) => o.tipo === "comportamento").length}
            </span>
            <span className={styles.kpiLabel}>Comportamento</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{ backgroundColor: "color-mix(in srgb, #3b82f6 12%, transparent)", color: "#3b82f6" }}
          >
            <BookOpen size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: "#2563eb" }}>
              {estatisticas?.total_desempenho ?? ocorrencias.filter((o) => o.tipo === "desempenho").length}
            </span>
            <span className={styles.kpiLabel}>Desempenho</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div
            className={styles.kpiIconWrapper}
            style={{ backgroundColor: "color-mix(in srgb, #8b5cf6 12%, transparent)", color: "#8b5cf6" }}
          >
            <Headphones size={22} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: "#7c3aed" }}>
              {estatisticas?.total_aqv ?? ocorrencias.filter((o) => o.status === "enviado_aqv").length}
            </span>
            <span className={styles.kpiLabel}>Encaminhadas AQV</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className={styles.filterCard}>
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
          <option value="">Todas as Turmas</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} - {t.curso?.nome}
            </option>
          ))}
        </select>

        <select
          className={styles.selectInput}
          value={selectedTipo}
          onChange={(e) => setSelectedTipo(e.target.value as OcorrenciaTipo | "")}
        >
          <option value="">Todos os Tipos</option>
          <option value="falta">Falta (Infrequência)</option>
          <option value="comportamento">Comportamento Disciplinar</option>
          <option value="desempenho">Desempenho Pedagógico</option>
        </select>

        <select
          className={styles.selectInput}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as OcorrenciaStatus | "")}
        >
          <option value="">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="enviado_aqv">Enviado ao AQV</option>
          <option value="pdf_gerado">PDF Gerado</option>
          <option value="impresso">Impresso</option>
          <option value="assinado">Assinado</option>
        </select>
      </div>

      {/* Tabela de Ocorrências */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className="animate-spin" />
            <p>Carregando ocorrências e FIAPs...</p>
          </div>
        ) : ocorrencias.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} className={styles.emptyIcon} />
            <p>
              {search || selectedTurmaId || selectedTipo || selectedStatus
                ? "Nenhuma ocorrência encontrada para os filtros aplicados."
                : "Nenhuma ocorrência registrada no sistema até o momento."}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Nº Sequencial</th>
                  <th className={styles.th}>Estudante</th>
                  <th className={styles.th}>Modalidade</th>
                  <th className={styles.th}>Data</th>
                  <th className={styles.th}>Resumo / Indicadores</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th} style={{ textAlign: "right" }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.map((oc) => {
                  const aluno = oc.aluno;
                  const initial = (aluno?.nome || "A").charAt(0).toUpperCase();
                  const primaryUc = oc.unidades && oc.unidades.length > 0 ? oc.unidades[0] : null;
                  const isCriticalAbsence =
                    oc.tipo === "falta" &&
                    ((primaryUc?.percentual_atingido || 0) >= 100 ||
                      (primaryUc?.quantidade_faltas || 0) >= (primaryUc?.limite_faltas_aulas || 999));

                  const canEdit =
                    user?.role === "admin" ||
                    (user?.role === "instrutor" && oc.registrado_por === user.id);

                  return (
                    <tr key={oc.id} className={styles.tr}>
                      {/* Nº Sequencial */}
                      <td className={styles.td}>
                        <span className={styles.seqNumberBadge}>
                          {oc.numero_sequencial || `#${oc.id}`}
                        </span>
                      </td>

                      {/* Aluno */}
                      <td className={styles.td}>
                        <div className={styles.alunoCell}>
                          <div className={styles.alunoAvatar}>{initial}</div>
                          <div className={styles.alunoInfo}>
                            <span className={styles.alunoNome}>{aluno?.nome || "Sem identificação"}</span>
                            <span className={styles.alunoSub}>
                              RA: {aluno?.matricula || "—"} | {aluno?.turma?.nome || "Sem Turma"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className={styles.td}>
                        {oc.tipo === "falta" && (
                          <span className={`${styles.tipoBadge} ${styles.tipoFalta}`}>
                            <Clock size={12} />
                            Falta
                          </span>
                        )}
                        {oc.tipo === "comportamento" && (
                          <span className={`${styles.tipoBadge} ${styles.tipoComportamento}`}>
                            <ShieldAlert size={12} />
                            Comportamento
                          </span>
                        )}
                        {oc.tipo === "desempenho" && (
                          <span className={`${styles.tipoBadge} ${styles.tipoDesempenho}`}>
                            <BookOpen size={12} />
                            Desempenho
                          </span>
                        )}
                      </td>

                      {/* Data */}
                      <td className={styles.td}>
                        {oc.data_ocorrencia
                          ? new Date(oc.data_ocorrencia + "T00:00:00").toLocaleDateString("pt-BR")
                          : "—"}
                      </td>

                      {/* Resumo / Indicadores */}
                      <td className={styles.td}>
                        <div className={styles.resumoCell}>
                          {oc.tipo === "falta" && primaryUc && (
                            <>
                              <div className={styles.resumoPrimary}>
                                <span>{primaryUc.unidade_curricular?.nome || "Unidade Curricular"}</span>
                                {isCriticalAbsence && (
                                  <span className={styles.limiteAlertBadge}>
                                    Limite Atingido
                                  </span>
                                )}
                              </div>
                              <span className={styles.resumoSecondary}>
                                {primaryUc.quantidade_faltas} faltas registradas (
                                {Number(primaryUc.percentual_atingido || 0).toFixed(1)}% do limite permitido)
                              </span>
                            </>
                          )}

                          {oc.tipo === "comportamento" && (
                            <>
                              <div className={styles.resumoPrimary}>
                                <span>{oc.providencias_gestao || "Medida Pedagógica"}</span>
                              </div>
                              <span className={styles.resumoSecondary} title={oc.relato_dificuldades || ""}>
                                {oc.relato_dificuldades || "Sem relato descritivo"}
                              </span>
                            </>
                          )}

                          {oc.tipo === "desempenho" && (
                            <>
                              <div className={styles.resumoPrimary}>
                                <span>{primaryUc?.unidade_curricular?.nome || "Dificuldade Pedagógica"}</span>
                              </div>
                              <span
                                className={styles.resumoSecondary}
                                title={oc.recomendacoes_professor || oc.relato_dificuldades || ""}
                              >
                                {oc.recomendacoes_professor || oc.relato_dificuldades || "Acompanhamento docente sugerido"}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        {oc.status === "pendente" && (
                          <span className={`${styles.statusBadge} ${styles.statusPendente}`}>
                            Pendente
                          </span>
                        )}
                        {oc.status === "enviado_aqv" && (
                          <span className={`${styles.statusBadge} ${styles.statusEnviadoAqv}`}>
                            Enviado ao AQV
                          </span>
                        )}
                        {oc.status === "pdf_gerado" && (
                          <span className={`${styles.statusBadge} ${styles.statusPdfGerado}`}>
                            PDF Gerado
                          </span>
                        )}
                        {oc.status === "impresso" && (
                          <span className={`${styles.statusBadge} ${styles.statusPdfGerado}`}>
                            Impresso
                          </span>
                        )}
                        {oc.status === "assinado" && (
                          <span className={`${styles.statusBadge} ${styles.statusAssinado}`}>
                            Assinado
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className={styles.td}>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenDetalhes(oc)}
                            title="Visualizar FIAP oficial e Imprimir"
                          >
                            <Eye size={16} />
                          </button>

                          {oc.status !== "enviado_aqv" && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.aqvBtn}`}
                              onClick={() => handleEncaminharAqv(oc.id)}
                              title="Encaminhar para o AQV"
                            >
                              <Send size={15} />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handleOpenEdit(oc)}
                              title="Editar Ocorrência"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              onClick={() => handleDelete(oc)}
                              title="Remover Registro"
                            >
                              <Trash2 size={16} />
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
      </div>

      {/* Modal de Criação / Edição de Ocorrência */}
      <OcorrenciaModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          setIsFormModalOpen(false);
          loadOcorrencias();
        }}
        ocorrenciaToEdit={editingOcorrencia}
      />

      {/* Modal de Detalhes da FIAP Oficial */}
      <OcorrenciaDetalhesModal
        isOpen={Boolean(selectedDetalhes)}
        onClose={() => setSelectedDetalhes(null)}
        ocorrencia={selectedDetalhes}
        onEncaminharAqv={handleEncaminharAqv}
      />
    </div>
  );
}
