import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Users,
  Loader2,
  LayoutList,
  LayoutGrid,
  Camera,
  X,
  Check,
  CloudDownload,
} from "lucide-react";
import { alunoService, type Aluno } from "../../services/alunoService";
import { turmaService, type Turma } from "../../services/turmaService";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { useAuth } from "../../contexts/AuthContext";
import { formatPhoneNumber } from "../../utils/formatters";
import { AlunoModal } from "./AlunoModal";
import { AlunoHistoricoModal } from "./AlunoHistoricoModal";
import { ImportarAlunosModal } from "./ImportarAlunosModal";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import { UserAvatar } from "../../components/UserAvatar/UserAvatar";
import { StatusBadge } from "../../components/StatusBadge/StatusBadge";
import { showAvatarToast } from "../../utils/toast";
import styles from "./Alunos.module.css";

export function Alunos() {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modo de visualização: Tabela ou Cards
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Estados para gerenciamento de Foto (Upload / Exclusão física)
  const [uploadConfirm, setUploadConfirm] = useState<{
    aluno: Aluno;
    file: File;
    previewUrl: string;
  } | null>(null);
  const [deleteConfirmAluno, setDeleteConfirmAluno] = useState<Aluno | null>(null);
  const [uploadingAlunoId, setUploadingAlunoId] = useState<number | null>(null);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [historicoAlunoId, setHistoricoAlunoId] = useState<number | null>(null);
  const [alunoToDelete, setAlunoToDelete] = useState<Aluno | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  const isGestor = user?.role === "gestor";

  async function loadAlunos(targetPage = page, targetPerPage = perPage, signal?: AbortSignal) {
    try {
      setIsLoading(true);
      const res = await alunoService.getAlunos(
        {
          search: search.trim() || undefined,
          turma_id: selectedTurmaId || undefined,
          status: selectedStatus || undefined,
          page: targetPage,
          per_page: targetPerPage,
        },
        signal
      );
      setAlunos(res.data);
      setMeta(res.meta || null);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      setAlunos([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    turmaService
      .getTurmas({ all: true }, controller.signal)
      .then((res) => setTurmas(res.data))
      .catch((err: any) => {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          setTurmas([]);
        }
      });
    return () => controller.abort();
  }, []);

  // Reseta página para 1 quando filtros de pesquisa/seleção mudarem
  useEffect(() => {
    setPage(1);
  }, [search, selectedTurmaId, selectedStatus]);

  useEffect(() => {
    const controller = new AbortController();

    // Carregamento imediato no primeiro render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadAlunos(page, perPage, controller.signal);
      return () => controller.abort();
    }

    // Se a alteração foi no campo de busca digitada, aplica debounce de 300ms
    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadAlunos(page, perPage, controller.signal);
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    // Para seleções de dropdown (turma ou status) ou paginação, dispara imediatamente
    loadAlunos(page, perPage, controller.signal);
    return () => controller.abort();
  }, [page, perPage, search, selectedTurmaId, selectedStatus]);

  function handleOpenCreateModal() {
    setEditingAluno(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(aluno: Aluno) {
    setEditingAluno(aluno);
    setIsModalOpen(true);
  }

  function handleOpenDelete(aluno: Aluno) {
    setAlunoToDelete(aluno);
  }

  async function handleConfirmDelete() {
    if (!alunoToDelete) return;
    try {
      await alunoService.deleteAluno(alunoToDelete.id);
      showAvatarToast(
        `Cadastro do estudante "${alunoToDelete.nome}" removido com sucesso!`,
        "Estudante Removido",
        "success"
      );
      loadAlunos(page, perPage);
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message || "Não foi possível remover o aluno.",
        "Erro ao Remover",
        "error"
      );
    }
  }

  function handleSelectFile(aluno: Aluno, file: File) {
    if (!file.type.startsWith("image/")) {
      showAvatarToast(
        "Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).",
        "Formato Inválido",
        "error"
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showAvatarToast("A imagem deve ter no máximo 2MB.", "Arquivo muito grande", "error");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadConfirm({ aluno, file, previewUrl });
  }

  function handleCancelUpload() {
    if (uploadConfirm?.previewUrl) {
      URL.revokeObjectURL(uploadConfirm.previewUrl);
    }
    setUploadConfirm(null);
  }

  async function handleConfirmUpload() {
    if (!uploadConfirm) return;
    const { aluno, file, previewUrl } = uploadConfirm;

    try {
      setUploadingAlunoId(aluno.id);
      const updatedAluno = await alunoService.uploadFoto(aluno.id, file);
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === aluno.id
            ? { ...a, foto_url: updatedAluno.foto_url, foto: updatedAluno.foto }
            : a
        )
      );
      showAvatarToast("Foto do estudante definida com sucesso!", "Foto Atualizada", "success");
      URL.revokeObjectURL(previewUrl);
      setUploadConfirm(null);
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message || "Não foi possível enviar a foto do estudante.",
        "Erro no Upload",
        "error"
      );
    } finally {
      setUploadingAlunoId(null);
    }
  }

  async function handleConfirmDeleteFoto() {
    if (!deleteConfirmAluno) return;
    try {
      await alunoService.deleteFoto(deleteConfirmAluno.id);
      setAlunos((prev) =>
        prev.map((a) =>
          a.id === deleteConfirmAluno.id ? { ...a, foto_url: null, foto: null } : a
        )
      );
      showAvatarToast(
        "Foto do estudante removida e excluída permanentemente!",
        "Foto Excluída",
        "success"
      );
      setDeleteConfirmAluno(null);
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message || "Não foi possível remover a foto do estudante.",
        "Erro ao Remover",
        "error"
      );
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Alunos</h1>
          <p className={styles.subtitle}>
            Consulte a base de estudantes, acompanhe dados de contato, fotos e histórico disciplinar.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.viewToggleGroup}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "table" ? styles.viewToggleBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Visualização em Tabela"
            >
              <LayoutList size={16} />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              title="Visualização em Cards com Fotos"
            >
              <LayoutGrid size={16} />
              <span>Cards</span>
            </button>
          </div>

          {isGestor && (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="button"
                className={styles.importBtn}
                onClick={() => setIsImportModalOpen(true)}
                title="Importar alunos do SGSET ou planilha Excel"
              >
                <CloudDownload size={18} />
                <span>Importar Alunos</span>
              </button>

              <button type="button" className={styles.addBtn} onClick={handleOpenCreateModal}>
                <Plus size={18} />
                Novo Aluno
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nome, matrícula/RA, CPF ou e-mail..."
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
          <option value="sem_turma">📋 Sem turma alocada</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>

        <select
          className={styles.selectInput}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="transferido">Transferidos</option>
        </select>
      </div>

      {/* Conteúdo: Loading, Vazio ou Tabela / Cards */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <Loader2 size={32} className="animate-spin" />
          <p>Carregando alunos...</p>
        </div>
      ) : alunos.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <p>
            {search || selectedTurmaId || selectedStatus
              ? "Nenhum aluno encontrado para os filtros informados."
              : "Nenhum aluno cadastrado na base ainda."}
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Estudante</th>
                <th className={styles.th}>Matrícula (RA)</th>
                <th className={styles.th}>Turma Vinculada</th>
                <th className={styles.th}>Contato</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => {
                return (
                  <tr key={aluno.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <UserAvatar
                          name={aluno.nome}
                          fotoUrl={aluno.foto_url}
                          size="sm"
                          className={styles.avatarMini}
                        />
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{aluno.nome}</span>
                          <span className={styles.userEmail}>{aluno.email || "Sem e-mail"}</span>
                        </div>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div>
                        <strong>{aluno.matricula}</strong>
                        {aluno.turmas && aluno.turmas.length > 1 && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                            2º RA: {aluno.turmas.find((t) => t.id !== aluno.turma_id)?.pivot?.ra || aluno.matricula}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className={styles.td}>
                      <div className={styles.turmasList}>
                        {aluno.turmas && aluno.turmas.length > 0 ? (
                          aluno.turmas.map((t) => (
                            <span key={t.id} className={styles.badgeTurma} title={`${t.nome} (${t.turno || "Sem turno"})`}>
                              <span className={styles.turmaNome}>{t.nome}</span>
                              {t.turno && <span className={styles.turmaTurno}>• {t.turno}</span>}
                            </span>
                          ))
                        ) : aluno.turma ? (
                          <span className={styles.badgeTurma} title={`${aluno.turma.nome} (${aluno.turma.turno || "Sem turno"})`}>
                            <span className={styles.turmaNome}>{aluno.turma.nome}</span>
                            {aluno.turma.turno && <span className={styles.turmaTurno}>• {aluno.turma.turno}</span>}
                          </span>
                        ) : (
                          <span className={styles.badgeSemTurma}>Sem turma</span>
                        )}
                      </div>
                    </td>

                    <td className={styles.td}>
                      {aluno.telefone ? formatPhoneNumber(aluno.telefone) : "Não informado"}
                    </td>

                    <td className={styles.td}>
                      <StatusBadge status={aluno.status} />
                    </td>

                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnHistory}`}
                          title="Ver Ficha & Histórico"
                          onClick={() => setHistoricoAlunoId(aluno.id)}
                        >
                          <FileText size={16} />
                        </button>

                        {isGestor && (
                          <>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                              title="Editar Aluno"
                              onClick={() => handleOpenEditModal(aluno)}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                              title="Remover Aluno"
                              onClick={() => handleOpenDelete(aluno)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Modo Cards / Fotos */
        <div className={styles.cardsGrid}>
          {alunos.map((aluno) => {
            const segundaTurma = aluno.turmas?.find((t) => t.id !== aluno.turma_id);
            const isUploading = uploadingAlunoId === aluno.id;

            return (
              <div key={aluno.id} className={styles.studentCard}>
                {/* Avatar com upload e remoção de foto */}
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <UserAvatar
                      name={aluno.nome}
                      fotoUrl={aluno.foto_url}
                      size="lg"
                    />

                    {aluno.foto_url && !isUploading && (
                      <button
                        type="button"
                        className={styles.removePhotoBtn}
                        title="Remover foto do aluno permanentemente"
                        aria-label="Remover foto do aluno permanentemente"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmAluno(aluno);
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}

                    {isUploading ? (
                      <div className={styles.uploadLoadingSpinner}>
                        <Loader2 size={18} className="animate-spin" />
                      </div>
                    ) : (
                      <label
                        className={styles.uploadPhotoBtn}
                        title="Clique para adicionar ou alterar a foto deste aluno"
                      >
                        <Camera size={14} />
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleSelectFile(aluno, file);
                              e.target.value = "";
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Nome do Estudante */}
                <h3 className={styles.studentName} title={aluno.nome}>
                  {aluno.nome}
                </h3>

                {/* RAs */}
                <div className={styles.raContainer}>
                  <span className={styles.raBadge} title="RA / Matrícula Principal">
                    RA: {aluno.matricula}
                  </span>
                  {segundaTurma && (
                    <span className={styles.secondRaBadge} title={`2º RA vinculado à turma ${segundaTurma.nome}`}>
                      2º RA: {segundaTurma.pivot?.ra || aluno.matricula}
                    </span>
                  )}
                </div>

                {/* Turmas vinculadas */}
                <div className={styles.turmasContainer}>
                  {aluno.turmas && aluno.turmas.length > 0 ? (
                    aluno.turmas.map((t) => (
                      <span key={t.id} className={styles.badgeTurma} title={`${t.nome} (${t.turno || "Sem turno"})`}>
                        <span className={styles.turmaNome}>{t.nome}</span>
                        {t.turno && <span className={styles.turmaTurno}>• {t.turno}</span>}
                      </span>
                    ))
                  ) : aluno.turma ? (
                    <span className={styles.badgeTurma} title={`${aluno.turma.nome} (${aluno.turma.turno || "Sem turno"})`}>
                      <span className={styles.turmaNome}>{aluno.turma.nome}</span>
                      {aluno.turma.turno && <span className={styles.turmaTurno}>• {aluno.turma.turno}</span>}
                    </span>
                  ) : (
                    <span className={styles.badgeSemTurma}>Sem turma</span>
                  )}
                </div>

                {/* Informações de contato e status */}
                <div className={styles.cardInfoContainer}>
                  {aluno.telefone && (
                    <span title="Telefone de contato">📞 {formatPhoneNumber(aluno.telefone)}</span>
                  )}
                  {aluno.email && (
                    <span title="E-mail do estudante">✉️ {aluno.email}</span>
                  )}
                  <div style={{ marginTop: "4px" }}>
                    <StatusBadge status={aluno.status} />
                  </div>
                </div>

                {/* Rodapé com Ações */}
                <div className={styles.cardFooter}>
                  <button
                    type="button"
                    className={`${styles.cardActionBtn} ${styles.cardActionBtnHistory}`}
                    onClick={() => setHistoricoAlunoId(aluno.id)}
                    title="Ver Ficha e Histórico Disciplinar"
                  >
                    <FileText size={15} />
                    <span>Histórico</span>
                  </button>

                  {isGestor && (
                    <>
                      <button
                        type="button"
                        className={`${styles.cardActionBtn} ${styles.cardActionBtnEdit}`}
                        onClick={() => handleOpenEditModal(aluno)}
                        title="Editar Cadastro do Estudante"
                      >
                        <Edit2 size={15} />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        className={`${styles.cardActionBtn} ${styles.cardActionBtnDelete}`}
                        onClick={() => handleOpenDelete(aluno)}
                        title="Remover Cadastro do Aluno"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && alunos.length > 0 && meta && (
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

      {/* Modal de Confirmação de Upload de Foto (Colocar ou Cancelar) */}
      {uploadConfirm && (
        <div
          className={styles.fotoModalOverlay}
          onClick={handleCancelUpload}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.fotoModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.fotoModalHeader}>
              <h2 className={styles.fotoModalTitle}>Definir Foto do Aluno</h2>
              <p className={styles.fotoModalSubtitle}>
                Verifique a foto selecionada antes de salvar no sistema.
              </p>
            </div>

            <div className={styles.fotoModalPreviewWrapper}>
              <img
                src={uploadConfirm.previewUrl}
                alt={`Prévia da foto de ${uploadConfirm.aluno.nome}`}
                className={styles.fotoModalPreviewImg}
              />
            </div>

            <div className={styles.fotoModalStudentInfo}>
              <div className={styles.fotoModalStudentName}>{uploadConfirm.aluno.nome}</div>
              <div className={styles.fotoModalStudentRa}>RA: {uploadConfirm.aluno.matricula}</div>
            </div>

            <div className={styles.fotoModalActions}>
              <button
                type="button"
                className={styles.fotoModalBtnCancelar}
                onClick={handleCancelUpload}
                disabled={uploadingAlunoId !== null}
              >
                <X size={16} />
                Cancelar
              </button>

              <button
                type="button"
                className={styles.fotoModalBtnColocar}
                onClick={handleConfirmUpload}
                disabled={uploadingAlunoId !== null}
              >
                {uploadingAlunoId !== null ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Colocar Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Remoção Física da Foto */}
      <ConfirmModal
        isOpen={deleteConfirmAluno !== null}
        onClose={() => setDeleteConfirmAluno(null)}
        onConfirm={handleConfirmDeleteFoto}
        title="Remover Foto do Aluno"
        subtitle={deleteConfirmAluno?.nome}
        warningText="Esta ação não pode ser desfeita. O arquivo físico da imagem será permanentemente excluído do servidor."
        confirmLabel="Excluir Foto Definitivamente"
        confirmVariant="danger"
        icon="trash"
      />

      {/* Modal de Criação / Edição de Aluno */}
      <AlunoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadAlunos(page, perPage)}
        alunoToEdit={editingAluno}
        turmas={turmas}
      />

      {/* Modal de Ficha & Histórico Disciplinar */}
      <AlunoHistoricoModal
        isOpen={historicoAlunoId !== null}
        onClose={() => setHistoricoAlunoId(null)}
        alunoId={historicoAlunoId}
      />

      {/* Modal Institucional de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={alunoToDelete !== null}
        onClose={() => setAlunoToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Cadastro do Aluno"
        subtitle="Confirmação de exclusão do estudante"
        confirmLabel="Sim, remover aluno"
        confirmVariant="danger"
        icon="trash"
        itemDetails={
          alunoToDelete
            ? [
                { label: "Estudante", value: alunoToDelete.nome },
                { label: "Matrícula / RA", value: alunoToDelete.matricula || "—" },
                { label: "Turma", value: alunoToDelete.turma?.nome || "Sem Turma" },
              ]
            : []
        }
        warningText="Esta ação removerá o cadastro do estudante no sistema. O histórico também será afetado."
      />

      {/* Modal de Importação SGSET / Excel */}
      <ImportarAlunosModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => loadAlunos(page, perPage)}
      />
    </div>
  );
}

export default Alunos;
