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
  RotateCcw,
  Check,
} from "lucide-react";
import {
  ocorrenciaService,
  type Ocorrencia,
  type OcorrenciaTipo,
  type OcorrenciaStatus,
  type OcorrenciaEstatisticas,
} from "../../services/ocorrenciaService";
import { turmaService, type Turma } from "../../services/turmaService";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { useAuth } from "../../contexts/AuthContext";
import { OcorrenciaModal } from "./OcorrenciaModal";
import { OcorrenciaDetalhesModal } from "./OcorrenciaDetalhesModal";
import { ConfirmAqvModal } from "./ConfirmAqvModal";
import { ConfirmAssinaturaModal } from "../EncaminhamentosAqv/ConfirmAssinaturaModal";
import { PlanoRecuperacaoModal } from "../PlanosRecuperacao/PlanoRecuperacaoModal";
import { ClipboardCheck } from "lucide-react";
import { aqvService } from "../../services/aqvService";
import { showAvatarToast } from "../../utils/toast";
import styles from "./Ocorrencias.module.css";

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
  const parts = clean.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("pt-BR");
}

export function Ocorrencias() {
  const { user } = useAuth();
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [estatisticas, setEstatisticas] = useState<OcorrenciaEstatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<OcorrenciaTipo | "">("");
  const [selectedStatus, setSelectedStatus] = useState<OcorrenciaStatus | "">("");

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOcorrencia, setEditingOcorrencia] = useState<Ocorrencia | null>(null);
  const [selectedDetalhes, setSelectedDetalhes] = useState<Ocorrencia | null>(null);
  const [ocorrenciaAqvPending, setOcorrenciaAqvPending] = useState<Ocorrencia | null>(null);

  // Modal de Plano de Recuperação (Ideia 2 & 3)
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
  const [ocorrenciaParaPlano, setOcorrenciaParaPlano] = useState<Ocorrencia | null>(null);

  function handleOpenPlanoModal(oc: Ocorrencia) {
    setOcorrenciaParaPlano(oc);
    setIsPlanoModalOpen(true);
  }

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  const canCreate = user?.role === "instrutor";

  function canSendAqv(oc: Ocorrencia): boolean {
    if (oc.status === "enviado_aqv" || oc.status === "assinado" || !user) return false;
    if (user.role === "gestor") return true;
    if (user.role === "instrutor") {
      const regId = typeof oc.registrado_por === "number" ? oc.registrado_por : oc.registrado_por?.id;
      const creatorId = oc.registrado_por_user?.id || oc.registrado_por_id || regId;
      return creatorId === user.id;
    }
    return false;
  }

  // Modal de Confirmação Rápida de Assinatura Física (Gestor e AQV)
  const [confirmAssinaturaModalOpen, setConfirmAssinaturaModalOpen] = useState(false);
  const [itemParaAssinar, setItemParaAssinar] = useState<Ocorrencia | null>(null);

  function handleOpenConfirmAssinatura(oc: Ocorrencia) {
    setItemParaAssinar(oc);
    setConfirmAssinaturaModalOpen(true);
  }

  async function handleConfirmAssinaturaSubmit() {
    if (!itemParaAssinar) return;
    try {
      await aqvService.confirmarAssinatura(itemParaAssinar.id);
      showAvatarToast(
        "Assinatura Confirmada",
        `Assinatura física da FIAP ${itemParaAssinar.numero_sequencial} confirmada com sucesso.`
      );
      loadOcorrencias(page, perPage);
    } catch (err) {
      console.error("Erro ao confirmar assinatura:", err);
      throw err;
    }
  }

  async function loadOcorrencias(targetPage = page, targetPerPage = perPage) {
    try {
      setIsLoading(true);
      const res = await ocorrenciaService.getOcorrencias({
        search: search.trim() || undefined,
        turma_id: selectedTurmaId || undefined,
        tipo: selectedTipo || undefined,
        status: selectedStatus || undefined,
        page: targetPage,
        per_page: targetPerPage,
      });

      setOcorrencias(res.data);
      setMeta(res.meta || null);
      if (res.meta?.estatisticas) {
        setEstatisticas(res.meta.estatisticas);
      }
    } catch {
      setOcorrencias([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    turmaService
      .getTurmas({ all: true })
      .then((res) => setTurmas(res.data))
      .catch(() => setTurmas([]));
  }, []);

  // Reseta página para 1 quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [search, selectedTurmaId, selectedTipo, selectedStatus]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadOcorrencias(page, perPage);
      return;
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadOcorrencias(page, perPage);
      }, 300);
      return () => clearTimeout(timer);
    }

    loadOcorrencias(page, perPage);
  }, [page, perPage, search, selectedTurmaId, selectedTipo, selectedStatus]);

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
        loadOcorrencias(page, perPage);
      } catch (err: any) {
        alert(err.response?.data?.message || "Não foi possível remover a ocorrência.");
      }
    }
  }

  async function handleRestore(oc: Ocorrencia) {
    if (
      window.confirm(
        `Deseja restaurar a FIAP "${oc.numero_sequencial}" do aluno "${oc.aluno?.nome}"?`
      )
    ) {
      try {
        await ocorrenciaService.restaurarOcorrencia(oc.id);
        alert(`FIAP "${oc.numero_sequencial}" restaurada com sucesso!`);
        loadOcorrencias(page, perPage);
      } catch (err: any) {
        alert(err.response?.data?.message || "Erro ao restaurar ocorrência.");
      }
    }
  }

  function handleEncaminharAqv(ocOrId: Ocorrencia | number) {
    const targetOc =
      typeof ocOrId === "number"
        ? ocorrencias.find((o) => o.id === ocOrId) || selectedDetalhes
        : ocOrId;

    if (targetOc?.has_plano_pendente) {
      alert("Não é possível encaminhar para a AQV pois esta FIAP possui um Plano de Recuperação pendente.");
      return;
    }

    if (targetOc) {
      setOcorrenciaAqvPending(targetOc);
    }
  }

  async function handleConfirmEncaminharAqv() {
    if (!ocorrenciaAqvPending) return;
    const oc = ocorrenciaAqvPending;

    try {
      await ocorrenciaService.encaminharAqv(oc.id);
      showAvatarToast(
        `FIAP "${oc.numero_sequencial}" encaminhada com sucesso!`
      );
      loadOcorrencias(page, perPage);
      if (selectedDetalhes?.id === oc.id) {
        const updated = await ocorrenciaService.getOcorrencia(oc.id);
        setSelectedDetalhes(updated);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao encaminhar para o AQV.");
      throw err;
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
              {t.nome}
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
                  <th className={styles.th}>Resumo</th>
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
                  const creatorId =
                    typeof oc.registrado_por === "object" && oc.registrado_por !== null
                      ? (oc.registrado_por as any).id
                      : (oc as any).registrado_por_user?.id ??
                      (oc as any).registrado_por_id ??
                      oc.registrado_por;

                  const isOwner = Boolean(
                    user?.id && creatorId && Number(creatorId) === Number(user.id)
                  );
                  const isDeleted = Boolean(oc.deleted_at);

                  const canEdit =
                    !isDeleted &&
                    (user?.role === "gestor" ||
                      user?.role === "aqv" ||
                      (user?.role === "instrutor" && isOwner));

                  const canDelete =
                    !isDeleted &&
                    (user?.role === "gestor" || (user?.role === "instrutor" && isOwner));
                  const canRestore = isDeleted && user?.role === "gestor";

                  const canSign =
                    !isDeleted &&
                    oc.status !== "assinado" &&
                    (user?.role === "gestor" || user?.role === "aqv");

                  return (
                    <tr key={oc.id} className={`${styles.tr} ${isDeleted ? styles.trDeleted : ""}`}>
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
                        {formatDate(oc.data_ocorrencia)}
                      </td>

                      {/* Resumo / Indicadores */}
                      <td className={styles.td}>
                        <div className={styles.resumoCell}>
                          {oc.tipo === "falta" && primaryUc && (
                            <>
                              {oc.unidades && oc.unidades.length > 1 ? (
                                <>
                                  <div className={styles.resumoPrimary}>
                                    <span className={styles.ucNomeSpan}>
                                      {oc.unidades
                                        .map(
                                          (u) =>
                                            u.unidade_curricular?.sigla ||
                                            u.unidade_curricular?.nome ||
                                            "UC"
                                        )
                                        .join(" / ")}
                                    </span>
                                  </div>
                                  <span className={styles.resumoSecondary}>
                                    FIAP com múltiplas unidades
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className={styles.resumoPrimary}>
                                    <span className={styles.ucNomeSpan}>
                                      {primaryUc.unidade_curricular?.nome || "Unidade Curricular"}
                                    </span>
                                  </div>
                                  <span className={styles.resumoSecondary}>
                                    {primaryUc.quantidade_faltas} faltas registradas (
                                    {Number(primaryUc.percentual_atingido || 0).toFixed(1)}% do limite permitido)
                                  </span>
                                </>
                              )}
                            </>
                          )}

                          {oc.tipo === "comportamento" && (
                            <>
                              <div className={styles.resumoPrimary}>
                                <span className={styles.ucNomeSpan}>
                                  {primaryUc?.unidade_curricular?.nome
                                    ? (primaryUc.unidade_curricular.sigla ? `[${primaryUc.unidade_curricular.sigla}] ${primaryUc.unidade_curricular.nome}` : primaryUc.unidade_curricular.nome)
                                    : (oc.unidade_curricular?.nome
                                      ? (oc.unidade_curricular.sigla ? `[${oc.unidade_curricular.sigla}] ${oc.unidade_curricular.nome}` : oc.unidade_curricular.nome)
                                      : "Convivência / Regimento Escolar")}
                                </span>
                              </div>
                              <span className={styles.resumoSecondary} title={oc.providencias_gestao || oc.relato_dificuldades || ""}>
                                {oc.providencias_gestao || oc.relato_dificuldades || "Ocorrência disciplinar registrada"}
                              </span>
                            </>
                          )}

                          {oc.tipo === "desempenho" && (
                            <>
                              <div className={styles.resumoPrimary}>
                                <span className={styles.ucNomeSpan}>
                                  {primaryUc?.unidade_curricular?.nome || "Dificuldade Pedagógica"}
                                </span>
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
                        {isDeleted ? (
                          <span className={`${styles.statusBadge} ${styles.statusExcluido}`}>
                            Excluída
                          </span>
                        ) : (
                          <>
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
                            {oc.has_plano_pendente && (
                              <div style={{ marginTop: "4px" }}>
                                <span
                                  className={styles.planoPendenteBadge}
                                  title="Esta FIAP necessita da elaboração de um Plano de Recuperação"
                                >
                                  Plano Pendente
                                </span>
                              </div>
                            )}
                          </>
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

                          {oc.has_plano_pendente && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.planoBtn}`}
                              onClick={() => handleOpenPlanoModal(oc)}
                              title="Criar Plano de Recuperação para esta FIAP"
                            >
                              <ClipboardCheck size={15} />
                            </button>
                          )}

                          {canRestore && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.restoreBtn}`}
                              onClick={() => handleRestore(oc)}
                              title="Restaurar FIAP excluída"
                            >
                              <RotateCcw size={15} />
                              <span>Restaurar</span>
                            </button>
                          )}

                          {canSendAqv(oc) && !isDeleted && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.aqvBtn}`}
                              onClick={() => handleEncaminharAqv(oc)}
                              disabled={oc.has_plano_pendente}
                              style={
                                oc.has_plano_pendente
                                  ? { opacity: 0.4, cursor: "not-allowed", borderColor: "var(--color-border)" }
                                  : undefined
                              }
                              title={
                                oc.has_plano_pendente
                                  ? "Não é possível encaminhar para a AQV enquanto o Plano de Recuperação estiver pendente"
                                  : "Encaminhar para o AQV"
                              }
                            >
                              <Send size={15} />
                            </button>
                          )}

                          {/* Confirmação de Assinatura Física para Gestão e AQV */}
                          {canSign && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              style={{
                                backgroundColor: "color-mix(in srgb, #16a34a 12%, transparent)",
                                color: "#16a34a",
                                borderColor: "color-mix(in srgb, #16a34a 30%, transparent)",
                              }}
                              onClick={() => handleOpenConfirmAssinatura(oc)}
                              title="Confirmar Assinatura Física da FIAP (Gestão / AQV)"
                            >
                              <Check size={16} />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              onClick={() => handleOpenEdit(oc)}
                              title="Editar FIAP / Ocorrência"
                              aria-label="Editar FIAP"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {canDelete && (
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

        {!isLoading && ocorrencias.length > 0 && meta && (
          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            total={meta.total}
            perPage={perPage}
            from={meta.from}
            to={meta.to}
            onPageChange={(newPage) => setPage(newPage)}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Modal de Criação / Edição de Ocorrência */}
      <OcorrenciaModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={() => {
          setIsFormModalOpen(false);
          loadOcorrencias(page, perPage);
        }}
        ocorrenciaToEdit={editingOcorrencia}
        onOpenPlanoModal={handleOpenPlanoModal}
      />

      {/* Modal do Plano de Recuperação (Ideia 2 & 3) */}
      <PlanoRecuperacaoModal
        isOpen={isPlanoModalOpen}
        onClose={() => {
          setIsPlanoModalOpen(false);
          setOcorrenciaParaPlano(null);
        }}
        onSaveSuccess={() => loadOcorrencias(page, perPage)}
        ocorrencia={ocorrenciaParaPlano}
      />

      {/* Modal de Detalhes da FIAP Oficial */}
      <OcorrenciaDetalhesModal
        isOpen={Boolean(selectedDetalhes)}
        onClose={() => setSelectedDetalhes(null)}
        ocorrencia={selectedDetalhes}
        onEncaminharAqv={handleEncaminharAqv}
        onEdit={(oc) => {
          setSelectedDetalhes(null);
          handleOpenEdit(oc);
        }}
        canEdit={(() => {
          if (!selectedDetalhes || !user) return false;
          if (user.role === "gestor" || user.role === "aqv") return true;
          const cId =
            typeof selectedDetalhes.registrado_por === "object" && selectedDetalhes.registrado_por !== null
              ? (selectedDetalhes.registrado_por as any).id
              : (selectedDetalhes as any).registrado_por_user?.id ??
              (selectedDetalhes as any).registrado_por_id ??
              selectedDetalhes.registrado_por;
          return user.role === "instrutor" && Number(cId) === Number(user.id);
        })()}
      />

      {/* Modal de Confirmação para Envio ao AQV */}
      <ConfirmAqvModal
        isOpen={Boolean(ocorrenciaAqvPending)}
        onClose={() => setOcorrenciaAqvPending(null)}
        onConfirm={handleConfirmEncaminharAqv}
        ocorrencia={ocorrenciaAqvPending}
      />

      {/* Modal de Confirmação de Assinatura Física */}
      {confirmAssinaturaModalOpen && itemParaAssinar && (
        <ConfirmAssinaturaModal
          isOpen={confirmAssinaturaModalOpen}
          onClose={() => {
            setConfirmAssinaturaModalOpen(false);
            setItemParaAssinar(null);
          }}
          onConfirm={handleConfirmAssinaturaSubmit}
          item={itemParaAssinar as any}
        />
      )}
    </div>
  );
}
