import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit2, Trash2, Users, School, Calendar, BookOpen, Loader2 } from "lucide-react";
import { turmaService, type Turma } from "../../services/turmaService";
import { cursoService, type Curso } from "../../services/cursoService";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { useAuth } from "../../contexts/AuthContext";
import { TurmaModal } from "./TurmaModal";
import { TurmaAlunosModal } from "./TurmaAlunosModal";
import styles from "./Turmas.module.css";

export function Turmas() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCursoId, setSelectedCursoId] = useState<string>("");
  const [selectedTurno, setSelectedTurno] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null);
  const [selectedTurmaIdParaAlunos, setSelectedTurmaIdParaAlunos] = useState<number | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  const isAdmin = user?.role === "admin";

  async function loadTurmas(targetPage = page, targetPerPage = perPage) {
    try {
      setIsLoading(true);
      const res = await turmaService.getTurmas({
        search: search.trim() || undefined,
        curso_id: selectedCursoId ? Number(selectedCursoId) : undefined,
        turno: selectedTurno || undefined,
        page: targetPage,
        per_page: targetPerPage,
      });
      setTurmas(res.data);
      setMeta(res.meta || null);
    } catch {
      setTurmas([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    cursoService
      .getCursos({ all: true })
      .then((res) => setCursos(res.data))
      .catch(() => setCursos([]));
  }, []);

  // Reseta página para 1 quando filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [search, selectedCursoId, selectedTurno]);

  useEffect(() => {
    // Carregamento imediato no primeiro render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadTurmas(page, perPage);
      return;
    }

    // Se a alteração foi no campo de busca digitada, aplica debounce de 300ms
    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadTurmas(page, perPage);
      }, 300);
      return () => clearTimeout(timer);
    }

    // Para seleções de dropdown (curso ou turno) ou paginação, dispara imediatamente
    loadTurmas(page, perPage);
  }, [page, perPage, search, selectedCursoId, selectedTurno]);

  function handleOpenCreateModal() {
    setEditingTurma(null);
    cursoService.getCursos({ all: true }).then((res) => setCursos(res.data)).catch(() => {});
    setIsModalOpen(true);
  }

  function handleOpenEditModal(turma: Turma) {
    setEditingTurma(turma);
    cursoService.getCursos({ all: true }).then((res) => setCursos(res.data)).catch(() => {});
    setIsModalOpen(true);
  }

  async function handleDeleteTurma(turma: Turma) {
    if (
      window.confirm(
        `Tem certeza de que deseja remover a turma "${turma.nome}"? Os alunos vinculados serão mantidos no sistema e marcados como sem turma.`
      )
    ) {
      try {
        await turmaService.deleteTurma(turma.id);
        loadTurmas(page, perPage);
      } catch (err: any) {
        alert(err.response?.data?.message || "Não foi possível remover a turma.");
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Turmas</h1>
          <p className={styles.subtitle}>
            Organize os semestres, turnos e aloque os estudantes em suas respectivas turmas.
          </p>
        </div>

        {isAdmin && (
          <button type="button" className={styles.addBtn} onClick={handleOpenCreateModal}>
            <Plus size={18} />
            Nova Turma
          </button>
        )}
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por código, nome da turma ou curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className={styles.selectInput}
          value={selectedCursoId}
          onChange={(e) => setSelectedCursoId(e.target.value)}
        >
          <option value="">Todos os Cursos</option>
          {cursos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          className={styles.selectInput}
          value={selectedTurno}
          onChange={(e) => setSelectedTurno(e.target.value)}
        >
          <option value="">Todos os Turnos</option>
          <option value="Manhã">Manhã</option>
          <option value="Tarde">Tarde</option>
          <option value="Noite">Noite</option>
          <option value="Integral">Integral</option>
        </select>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <Loader2 size={32} className="animate-spin" />
          <p>Carregando turmas...</p>
        </div>
      ) : turmas.length === 0 ? (
        <div className={styles.emptyState}>
          <School size={48} className={styles.emptyIcon} />
          <p>
            {search || selectedCursoId || selectedTurno
              ? "Nenhuma turma encontrada para os filtros aplicados."
              : "Nenhuma turma cadastrada ainda."}
          </p>
        </div>
      ) : (
        <div className={styles.gridTurmas}>
          {turmas.map((turma) => (
            <div key={turma.id} className={styles.turmaCard}>
              <div>
                <div className={styles.cardTop}>
                  <h3 className={styles.turmaNome}>{turma.nome}</h3>
                  {turma.turno && <span className={styles.badgeTurno}>{turma.turno}</span>}
                </div>

                <p className={styles.cursoNome}>
                  <BookOpen size={14} />
                  {turma.curso?.nome || "Curso não informado"}
                </p>

                {turma.instrutores && turma.instrutores.length > 0 && (
                  <div style={{ marginTop: "0.4rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {turma.instrutores.map((inst) => (
                      <span
                        key={inst.id}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                          color: "var(--color-primary)",
                          border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                        }}
                        title={`Docente: ${inst.user?.name || "Instrutor"}`}
                      >
                        {inst.user?.name ? inst.user.name.split(" ")[0] : "Instrutor"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardDetails}>
                <span className={styles.detailItem}>
                  <Calendar size={13} />
                  Ano: {turma.ano_letivo}
                </span>
                <span className={styles.detailItem}>
                  Semestre: {turma.semestre_atual ? `${turma.semestre_atual}º` : "1º"}
                </span>
                <span className={styles.alunosBadge}>
                  <Users size={14} />
                  {turma.alunos_count || 0} alunos
                </span>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={styles.btnVerAlunos}
                  onClick={() => setSelectedTurmaIdParaAlunos(turma.id)}
                >
                  <Users size={15} />
                  Ver Alunos ({turma.alunos_count || 0})
                </button>

                {isAdmin && (
                  <div className={styles.actionBtnsRight}>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                      title="Editar Turma"
                      onClick={() => handleOpenEditModal(turma)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                      title="Remover Turma"
                      onClick={() => handleDeleteTurma(turma)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && turmas.length > 0 && meta && (
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

      {/* Modal de Criação / Edição de Turma */}
      <TurmaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadTurmas(page, perPage)}
        turmaToEdit={editingTurma}
        cursos={cursos}
      />

      {/* Modal de Gestão de Alunos da Turma (Enturmação) */}
      <TurmaAlunosModal
        isOpen={selectedTurmaIdParaAlunos !== null}
        onClose={() => setSelectedTurmaIdParaAlunos(null)}
        turmaId={selectedTurmaIdParaAlunos}
        onUpdated={() => loadTurmas(page, perPage)}
      />
    </div>
  );
}
export default Turmas;
