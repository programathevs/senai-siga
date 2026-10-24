import { useState, useEffect, useRef } from "react";
import { Search, Camera, FileText, Users, Loader2, School, X, Check } from "lucide-react";
import { alunoService, type Aluno } from "../../services/alunoService";
import { turmaService, type Turma } from "../../services/turmaService";
import { UserAvatar } from "../../components/UserAvatar/UserAvatar";
import { AlunoHistoricoModal } from "../Alunos/AlunoHistoricoModal";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import { showAvatarToast } from "../../utils/toast";
import styles from "./MeusAlunos.module.css";

export function MeusAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingAlunoId, setUploadingAlunoId] = useState<number | null>(null);
  const [historicoAlunoId, setHistoricoAlunoId] = useState<number | null>(null);
  const [uploadConfirm, setUploadConfirm] = useState<{ aluno: Aluno; file: File; previewUrl: string } | null>(null);
  const [deleteConfirmAluno, setDeleteConfirmAluno] = useState<Aluno | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  // Carrega turmas ativas para o filtro
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

  async function loadAlunos(signal?: AbortSignal) {
    try {
      setIsLoading(true);
      const res = await alunoService.getAlunos({
        search: search.trim() || undefined,
        turma_id: selectedTurmaId || undefined,
        all: true,
      }, signal);
      setAlunos(res.data);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      setAlunos([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadAlunos(controller.signal);
      return () => controller.abort();
    }

    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadAlunos(controller.signal);
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }

    loadAlunos(controller.signal);
    return () => controller.abort();
  }, [search, selectedTurmaId]);

  function handleSelectFile(aluno: Aluno, file: File) {
    if (!file.type.startsWith("image/")) {
      showAvatarToast("Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).", "Formato Inválido", "error");
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
        prev.map((a) => (a.id === aluno.id ? { ...a, foto_url: updatedAluno.foto_url, foto: updatedAluno.foto } : a))
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
        prev.map((a) => (a.id === deleteConfirmAluno.id ? { ...a, foto_url: null, foto: null } : a))
      );
      showAvatarToast("Foto do estudante removida e excluída permanentemente!", "Foto Excluída", "success");
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
      {/* Cabeçalho */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Meus Alunos</h1>
          <p className={styles.subtitle}>
            Acompanhe sua turma, consulte o histórico disciplinar e atualize fotos dos estudantes diretamente pelo portal docente.
          </p>
        </div>

        <div className={styles.statsBadge}>
          <Users size={16} />
          <span>Total exibido: <strong className={styles.statsCount}>{alunos.length}</strong></span>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar aluno por nome, matrícula/RA ou e-mail..."
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
          <option value="sem_turma">Sem turma alocada</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} - {t.curso?.nome || "Curso"} ({t.turno})
            </option>
          ))}
        </select>
      </div>

      {/* Conteúdo: Loading, Vazio ou Grid */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <Loader2 size={36} className="animate-spin" />
          <p>Carregando galeria de estudantes...</p>
        </div>
      ) : alunos.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <p>
            {search || selectedTurmaId
              ? "Nenhum estudante encontrado para os filtros selecionados."
              : "Nenhum aluno cadastrado na base institucional."}
          </p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {alunos.map((aluno) => {
            const segundaTurma = aluno.turmas?.find((t) => t.id !== aluno.turma_id);
            const isUploading = uploadingAlunoId === aluno.id;

            return (
              <div key={aluno.id} className={styles.studentCard}>
                {/* Avatar com Botão de Upload de Foto */}
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <UserAvatar
                      name={aluno.nome}
                      fotoUrl={aluno.foto_url}
                      size="lg"
                    />

                    {/* Botão X para remover foto existente permanentemente */}
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

                {/* RAs (Principal e Secundário se houver) */}
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

                {/* Turmas Vinculadas */}
                <div className={styles.turmasContainer}>
                  {aluno.turmas && aluno.turmas.length > 0 ? (
                    aluno.turmas.map((t) => (
                      <span key={t.id} className={styles.turmaTag} title={t.curso?.nome || t.nome}>
                        <School size={13} />
                        {t.nome} {t.turno ? `(${t.turno})` : ""}
                      </span>
                    ))
                  ) : aluno.turma ? (
                    <span className={styles.turmaTag} title={aluno.turma.curso?.nome || aluno.turma.nome}>
                      <School size={13} />
                      {aluno.turma.nome} {aluno.turma.turno ? `(${aluno.turma.turno})` : ""}
                    </span>
                  ) : (
                    <span className={styles.turmaTag} style={{ fontStyle: "italic", opacity: 0.7 }}>
                      Sem turma vinculada
                    </span>
                  )}
                </div>

                {/* Ações: Histórico Disciplinar */}
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.historyBtn}
                    onClick={() => setHistoricoAlunoId(aluno.id)}
                  >
                    <FileText size={15} />
                    Ver Histórico Disciplinar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
        description="Tem certeza de que deseja remover a foto deste estudante? O arquivo físico da imagem será permanentemente excluído do servidor."
        warningText="Esta ação não pode ser desfeita. O estudante voltará a exibir o avatar padrão com as iniciais do nome."
        confirmLabel="Excluir Foto Definitivamente"
        confirmVariant="danger"
        icon="trash"
      />

      {/* Modal de Histórico do Aluno */}
      <AlunoHistoricoModal
        isOpen={historicoAlunoId !== null}
        onClose={() => setHistoricoAlunoId(null)}
        alunoId={historicoAlunoId}
      />
    </div>
  );
}
