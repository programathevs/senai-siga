import { useEffect, useState } from "react";
import { Plus, Search, Edit2, Trash2, GraduationCap, Loader2 } from "lucide-react";
import { cursoService, type Curso } from "../../services/cursoService";
import { useAuth } from "../../contexts/AuthContext";
import { CursoModal } from "./CursoModal";
import styles from "./Cursos.module.css";

export function Cursos() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);

  const isAdmin = user?.role === "admin";

  async function loadCursos() {
    try {
      setIsLoading(true);
      const data = await cursoService.getCursos(search);
      setCursos(data);
    } catch {
      setCursos([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCursos();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function handleOpenCreateModal() {
    setEditingCurso(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(curso: Curso) {
    setEditingCurso(curso);
    setIsModalOpen(true);
  }

  async function handleDeleteCurso(curso: Curso) {
    if (
      window.confirm(
        `Tem certeza de que deseja remover o curso "${curso.nome}"?`
      )
    ) {
      try {
        await cursoService.deleteCurso(curso.id);
        loadCursos();
      } catch (err: any) {
        alert(
          err.response?.data?.message ||
            "Não foi possível remover o curso no momento."
        );
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Página */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Cursos</h1>
          <p className={styles.subtitle}>
            Cadastre e gerencie a grade de cursos da Unidade Escolar
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleOpenCreateModal}
          >
            <Plus size={18} />
            <span>Novo Curso</span>
          </button>
        )}
      </div>

      {/* Filtro de Busca */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nome do curso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Listagem */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className="animate-spin" />
            <p>Carregando catálogo de cursos...</p>
          </div>
        ) : cursos.length === 0 ? (
          <div className={styles.emptyState}>
            <GraduationCap size={40} className={styles.emptyIcon} />
            <p>Nenhum curso encontrado.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Nome do Curso</th>
                <th className={styles.th}>Carga Horária Total</th>
                <th className={styles.th}>Matriz Curricular</th>
                {isAdmin && <th className={styles.th} style={{ textAlign: "right" }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.id} className={styles.tr}>
                  <td className={styles.td}>#{curso.id}</td>
                  <td className={styles.td} style={{ fontWeight: 600 }}>
                    {curso.nome}
                  </td>
                  <td className={styles.td}>
                    {curso.carga_horaria_total ? (
                      <span className={styles.badgeHours}>
                        {curso.carga_horaria_total} horas
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        Não informada
                      </span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {curso.unidades_curriculares?.length ? (
                      <span className={styles.badgeHours} style={{ backgroundColor: "color-mix(in srgb, var(--color-border) 40%, transparent)", color: "var(--color-text-primary)" }}>
                        {curso.unidades_curriculares.length} {curso.unidades_curriculares.length === 1 ? "UC cadastrada" : "UCs cadastradas"}
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        Sem UCs
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          onClick={() => handleOpenEditModal(curso)}
                          title="Editar curso"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          onClick={() => handleDeleteCurso(curso)}
                          title="Excluir curso"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <CursoModal
        isOpen={isModalOpen}
        curso={editingCurso}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadCursos}
      />
    </div>
  );
}
