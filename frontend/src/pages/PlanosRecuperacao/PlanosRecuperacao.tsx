import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  RotateCcw,
  Headphones,
  AlertTriangle,
} from "lucide-react";
import {
  planoRecuperacaoService,
  type PlanoRecuperacao,
  type PlanoTipoPrograma,
} from "../../services/planoRecuperacaoService";
import { useAuth } from "../../contexts/AuthContext";
import { Pagination } from "../../components/Pagination/Pagination";
import { PlanoRecuperacaoModal } from "./PlanoRecuperacaoModal";
import { PlanoPdfModal } from "./PlanoPdfModal";
import { PlanoParecerModal } from "./PlanoParecerModal";
import { ConfirmDeletePlanoModal } from "./ConfirmDeletePlanoModal";
import { ConfirmRestorePlanoModal } from "./ConfirmRestorePlanoModal";
import { showAvatarToast } from "../../utils/toast";
import styles from "./PlanosRecuperacao.module.css";

export function PlanosRecuperacao() {
  const { user } = useAuth();
  const [planos, setPlanos] = useState<PlanoRecuperacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<PlanoTipoPrograma | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planoToEdit, setPlanoToEdit] = useState<PlanoRecuperacao | null>(null);

  // Modais de Confirmação Institucional
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<PlanoRecuperacao | null>(null);

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [planoToRestore, setPlanoToRestore] = useState<PlanoRecuperacao | null>(null);

  // PDF Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPlanoPdf, setSelectedPlanoPdf] = useState<PlanoRecuperacao | null>(null);

  // Parecer Equipe Escolar Modal
  const [selectedPlanoParecer, setSelectedPlanoParecer] = useState<PlanoRecuperacao | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  useEffect(() => {
    setPage(1);
  }, [search, selectedTipo, selectedStatus]);

  async function loadPlanos(bypassCache = false, signal?: AbortSignal) {
    try {
      setIsLoading(true);
      const data = await planoRecuperacaoService.getAll({
        search: search.trim() || undefined,
        tipo_programa: selectedTipo || undefined,
        status_processo: selectedStatus || undefined,
      }, bypassCache, signal);
      setPlanos(data);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      console.error("Erro ao carregar planos de recuperação:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadPlanos(false, controller.signal);
      return () => controller.abort();
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadPlanos(false, controller.signal);
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    loadPlanos(false, controller.signal);
    return () => controller.abort();
  }, [search, selectedTipo, selectedStatus]);

  function handleCreateNew() {
    setPlanoToEdit(null);
    setIsModalOpen(true);
  }

  function handleEdit(plano: PlanoRecuperacao) {
    setPlanoToEdit(plano);
    setIsModalOpen(true);
  }

  function handleViewPdf(plano: PlanoRecuperacao) {
    setSelectedPlanoPdf(plano);
    setIsPdfModalOpen(true);
  }

  function handleOpenDelete(plano: PlanoRecuperacao) {
    setPlanoToDelete(plano);
    setIsDeleteModalOpen(true);
  }

  async function handleConfirmDelete() {
    if (!planoToDelete) return;

    try {
      await planoRecuperacaoService.delete(planoToDelete.id);
      showAvatarToast(
        `Plano de Recuperação #${planoToDelete.id} excluído com sucesso!`,
        "Plano Excluído",
        "success"
      );
      loadPlanos();
    } catch (err: any) {
      console.error("Erro ao excluir plano:", err);
      showAvatarToast(
        err.response?.data?.message || "Erro ao excluir Plano de Recuperação.",
        "Erro ao Excluir",
        "error"
      );
    }
  }

  function handleOpenRestore(plano: PlanoRecuperacao) {
    setPlanoToRestore(plano);
    setIsRestoreModalOpen(true);
  }

  async function handleConfirmRestore() {
    if (!planoToRestore) return;

    try {
      await planoRecuperacaoService.restaurar(planoToRestore.id);
      showAvatarToast(
        `Plano de Recuperação #${planoToRestore.id} restaurado com sucesso!`,
        "Plano Restaurado",
        "success"
      );
      loadPlanos();
    } catch (err: any) {
      console.error("Erro ao restaurar plano:", err);
      showAvatarToast(
        err.response?.data?.message || "Erro ao restaurar Plano de Recuperação.",
        "Erro ao Restaurar",
        "error"
      );
    }
  }

  const total = planos.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const startIndex = (page - 1) * perPage;
  const paginatedPlanos = planos.slice(startIndex, startIndex + perPage);

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Página */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Planos de Recuperação</h1>
          <p className={styles.subtitle}>
            Acompanhamento e emissão dos Planos de Recuperação Paralela e Compensação de Ausências.
          </p>
        </div>

        {user?.role !== "equipe_escolar" && user?.role !== "aqv" && (
          <button type="button" className={styles.addBtn} onClick={handleCreateNew}>
            <Plus size={18} />
            <span>Novo Plano de Recuperação</span>
          </button>
        )}
      </div>

      {/* Cartão de Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por estudante, matrícula ou Nº da FIAP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.selectFilter}
          value={selectedTipo}
          onChange={(e) => setSelectedTipo(e.target.value as PlanoTipoPrograma | "")}
        >
          <option value="">Todas as Modalidades</option>
          <option value="recuperacao_paralela">Recuperação Paralela</option>
          <option value="compensacao_ausencia">Compensação de Ausência</option>
          <option value="recuperacao_final">Recuperação Final</option>
        </select>

        <select
          className={styles.selectFilter}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="em_analise">Em Análise (Equipe Escolar)</option>
          <option value="aguardando_visto">Aguardando Visto</option>
          <option value="concluido">Concluído</option>
          <option value="recusado">Recusado</option>
          <option value="rascunho">Em Elaboração (Rascunho)</option>
          {user?.role === "gestor" && (
            <option value="excluidos">Excluídos / Arquivados (Lixeira)</option>
          )}
        </select>
      </div>

      {/* Tabela de Listagem */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className="animate-spin" />
            <p>Carregando planos de recuperação...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={40} className={styles.emptyIcon} />
            <p>Nenhum Plano de Recuperação encontrado.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>FIAP Atrelada</th>
                <th className={styles.th}>Estudante</th>
                <th className={styles.th}>Programa</th>
                <th className={styles.th}>Ciclo</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Conceito</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlanos.map((plano) => {
                const aluno = plano.aluno;
                const initial = (aluno?.nome || "A").charAt(0).toUpperCase();

                const isDeleted = Boolean(plano.deleted_at);
                const regId = typeof plano.registrado_por === "object" ? plano.registrado_por?.id : plano.registrado_por;
                const creatorId = plano.registrado_por_user?.id || regId;
                const canDelete =
                  user?.role === "gestor" ||
                  (creatorId === user?.id &&
                    creatorId !== undefined &&
                    plano.status_processo !== "concluido");

                const isEquipeEscolar = user?.role === "equipe_escolar" || user?.role === "aqv" || user?.role === "gestor";
                const canDarParecer = !isDeleted && isEquipeEscolar && plano.status_processo === "em_analise";

                const canEdit =
                  !isDeleted &&
                  user?.role !== "equipe_escolar" &&
                  user?.role !== "aqv" &&
                  (user?.role === "gestor" ||
                    (user?.role === "instrutor" && plano.status_processo !== "concluido" && plano.status_processo !== "recusado"));

                const ucsText = plano.unidades && plano.unidades.length > 0
                  ? plano.unidades.map((u) => u.sigla || u.nome).join(", ")
                  : plano.unidade_curricular?.sigla || plano.unidade_curricular?.nome || "";

                return (
                  <tr key={plano.id} className={`${styles.tr} ${isDeleted ? styles.trDeleted : ""}`}>
                    {/* FIAP */}
                    <td className={styles.td}>
                      {plano.ocorrencia?.numero_sequencial ? (
                        <span className={styles.fiapBadge}>
                          {plano.ocorrencia.numero_sequencial}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-secondary)" }}>—</span>
                      )}
                    </td>

                    {/* Aluno */}
                    <td className={styles.td}>
                      <div className={styles.alunoCell}>
                        <div className={styles.alunoAvatar}>{initial}</div>
                        <div className={styles.alunoInfo}>
                          <span className={styles.alunoNome}>{aluno?.nome || "Estudante"}</span>
                          <span className={styles.alunoSub}>
                            RA: {aluno?.matricula || "—"} | {aluno?.turma?.nome || "Sem Turma"}
                            {ucsText ? ` • UC: ${ucsText}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Programa */}
                    <td className={styles.td}>
                      {plano.tipo_programa === "recuperacao_paralela" && (
                        <span className={`${styles.tipoBadge} ${styles.tipoParalela}`}>
                          Recuperação Paralela
                        </span>
                      )}
                      {plano.tipo_programa === "compensacao_ausencia" && (
                        <span className={`${styles.tipoBadge} ${styles.tipoCompensacao}`}>
                          Compensação Ausência
                        </span>
                      )}
                      {plano.tipo_programa === "recuperacao_final" && (
                        <span className={`${styles.tipoBadge} ${styles.tipoFinal}`}>
                          Recuperação Final
                        </span>
                      )}
                    </td>

                    {/* Ciclo */}
                    <td className={styles.td}>{plano.ciclo_avaliacao || "1º"}</td>

                    {/* Status */}
                    <td className={styles.td}>
                      {isDeleted ? (
                        <span className={`${styles.statusBadge} ${styles.statusExcluido}`}>
                          <Trash2 size={12} />
                          Excluído
                        </span>
                      ) : plano.status_processo === "concluido" ? (
                        <span className={`${styles.statusBadge} ${styles.statusConcluido}`}>
                          <CheckCircle2 size={12} />
                          Concluído
                        </span>
                      ) : plano.status_processo === "recusado" ? (
                        <span
                          className={`${styles.statusBadge} ${styles.statusRecusado}`}
                          title={plano.parecer_equipe_escolar ? `Parecer Equipe Escolar: ${plano.parecer_equipe_escolar}` : "Plano Recusado pela Equipe Escolar"}
                        >
                          <AlertTriangle size={12} />
                          Recusado
                        </span>
                      ) : plano.status_processo === "aguardando_visto" ? (
                        <span className={`${styles.statusBadge} ${styles.statusVisto}`}>
                          <Clock size={12} />
                          Aguardando Visto
                        </span>
                      ) : plano.status_processo === "em_analise" ? (
                        <span className={`${styles.statusBadge} ${styles.statusEmAnalise}`}>
                          <Clock size={12} />
                          Em Análise
                        </span>
                      ) : (
                        <span className={`${styles.statusBadge} ${styles.statusRascunho}`}>
                          Rascunho
                        </span>
                      )}
                    </td>

                    {/* Conceito */}
                    <td className={styles.td}>
                      {plano.conceito === "aprovado" ? (
                        <span className={`${styles.conceitoBadge} ${styles.conceitoAprovado}`}>
                          Aprovado
                        </span>
                      ) : plano.conceito === "reprovado" ? (
                        <span className={`${styles.conceitoBadge} ${styles.conceitoReprovado}`}>
                          Reprovado
                        </span>
                      ) : (
                        <span className={`${styles.conceitoBadge} ${styles.conceitoPendente}`}>
                          Pendente
                        </span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnPdf}`}
                          onClick={() => handleViewPdf(plano)}
                          title="Visualizar Plano de Recuperação (Imprimir ou Baixar PDF)"
                        >
                          <Eye size={16} />
                        </button>

                        {canDarParecer && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnParecer}`}
                            onClick={() => setSelectedPlanoParecer(plano)}
                            title="Analisar Plano (Parecer da Equipe Escolar: Aceitar/Recusar)"
                          >
                            <Headphones size={16} />
                          </button>
                        )}

                        {canEdit && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                            onClick={() => handleEdit(plano)}
                            title="Editar Plano de Recuperação"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}

                        {!isDeleted && canDelete && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                            onClick={() => handleOpenDelete(plano)}
                            title="Excluir Plano de Recuperação"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}

                        {isDeleted && user?.role === "gestor" && (
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.actionBtnRestore}`}
                            onClick={() => handleOpenRestore(plano)}
                            title="Restaurar Plano de Recuperação Excluído"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && planos.length > 0 && (
        <Pagination
          currentPage={page}
          lastPage={totalPages}
          total={total}
          perPage={perPage}
          from={startIndex + 1}
          to={Math.min(startIndex + perPage, total)}
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          isLoading={isLoading}
        />
      )}

      {/* Modal de Formulário */}
      <PlanoRecuperacaoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPlanoToEdit(null);
        }}
        onSaveSuccess={(salvo, isEdit) => {
          setIsModalOpen(false);
          setPlanoToEdit(null);
          if (salvo) {
            if (isEdit) {
              setPlanos((prev) =>
                prev.map((item) => (item.id === salvo.id ? salvo : item))
              );
            } else {
              setPlanos((prev) => [salvo, ...prev]);
            }
          }
        }}
        planoToEdit={planoToEdit}
      />

      {/* Modal de PDF */}
      <PlanoPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        plano={selectedPlanoPdf}
        onEdit={(plano) => {
          setIsPdfModalOpen(false);
          handleEdit(plano);
        }}
        canEdit={Boolean(
          selectedPlanoPdf &&
          !selectedPlanoPdf.deleted_at &&
          user?.role !== "equipe_escolar" &&
          user?.role !== "aqv" &&
          (user?.role === "gestor" ||
            (user?.role === "instrutor" && selectedPlanoPdf.status_processo !== "concluido"))
        )}
      />

      {/* Modal Institucional de Confirmação de Exclusão */}
      <ConfirmDeletePlanoModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPlanoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        plano={planoToDelete}
      />

      {/* Modal Institucional de Confirmação de Restauração */}
      <ConfirmRestorePlanoModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setPlanoToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        plano={planoToRestore}
      />

      {/* Modal de Análise e Parecer da Equipe Escolar */}
      <PlanoParecerModal
        isOpen={Boolean(selectedPlanoParecer)}
        onClose={() => setSelectedPlanoParecer(null)}
        onSuccess={() => loadPlanos(true)}
        plano={selectedPlanoParecer}
      />
    </div>
  );
}

export default PlanosRecuperacao;
