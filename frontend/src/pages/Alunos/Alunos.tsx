import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit2, Trash2, FileText, Users, Loader2 } from "lucide-react";
import { alunoService, type Aluno } from "../../services/alunoService";
import { turmaService, type Turma } from "../../services/turmaService";
import { useAuth } from "../../contexts/AuthContext";
import { formatPhoneNumber } from "../../utils/formatters";
import { AlunoModal } from "./AlunoModal";
import { AlunoHistoricoModal } from "./AlunoHistoricoModal";
import styles from "./Alunos.module.css";

export function Alunos() {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [historicoAlunoId, setHistoricoAlunoId] = useState<number | null>(null);

  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(search);

  const isAdmin = user?.role === "admin";

  async function loadAlunos() {
    try {
      setIsLoading(true);
      const data = await alunoService.getAlunos({
        search: search.trim() || undefined,
        turma_id: selectedTurmaId || undefined,
        status: selectedStatus || undefined,
      });
      setAlunos(data);
    } catch {
      setAlunos([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    turmaService.getTurmas().then(setTurmas).catch(() => setTurmas([]));
  }, []);

  useEffect(() => {
    // Carregamento imediato no primeiro render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadAlunos();
      return;
    }

    // Se a alteração foi no campo de busca digitada, aplica debounce de 300ms
    const isSearchChange = prevSearchRef.current !== search;
    prevSearchRef.current = search;

    if (isSearchChange) {
      const timer = setTimeout(() => {
        loadAlunos();
      }, 300);
      return () => clearTimeout(timer);
    }

    // Para seleções de dropdown (turma ou status), dispara imediatamente
    loadAlunos();
  }, [search, selectedTurmaId, selectedStatus]);

  function handleOpenCreateModal() {
    setEditingAluno(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(aluno: Aluno) {
    setEditingAluno(aluno);
    setIsModalOpen(true);
  }

  async function handleDeleteAluno(aluno: Aluno) {
    if (window.confirm(`Tem certeza de que deseja remover o cadastro do aluno "${aluno.nome}"?`)) {
      try {
        await alunoService.deleteAluno(aluno.id);
        loadAlunos();
      } catch (err: any) {
        alert(err.response?.data?.message || "Não foi possível remover o aluno.");
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Alunos</h1>
          <p className={styles.subtitle}>
            Consulte a base de estudantes, dados de contato e acompanhe o histórico disciplinar.
          </p>
        </div>

        {isAdmin && (
          <button type="button" className={styles.addBtn} onClick={handleOpenCreateModal}>
            <Plus size={18} />
            Novo Aluno
          </button>
        )}
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
          <option value="sem_turma">Sem turma alocada</option>
          {turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} - {t.curso?.nome}
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

      <div className={styles.tableContainer}>
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
        ) : (
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
                const initial = aluno.nome.charAt(0).toUpperCase();
                return (
                  <tr key={aluno.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <div className={styles.avatarMini}>{initial}</div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{aluno.nome}</span>
                          <span className={styles.userEmail}>{aluno.email || "Sem e-mail"}</span>
                        </div>
                      </div>
                    </td>

                    <td className={styles.td}>
                      <strong>{aluno.matricula}</strong>
                    </td>

                    <td className={styles.td}>
                      {aluno.turma ? (
                        <span className={styles.badgeTurma}>
                          {aluno.turma.nome} ({aluno.turma.turno || "Turno"})
                        </span>
                      ) : (
                        <span className={styles.badgeSemTurma}>Sem turma</span>
                      )}
                    </td>

                    <td className={styles.td}>
                      {aluno.telefone ? formatPhoneNumber(aluno.telefone) : "Não informado"}
                    </td>

                    <td className={styles.td}>
                      {aluno.status === "ativo" && <span className={styles.badgeStatusAtivo}>Ativo</span>}
                      {aluno.status === "inativo" && <span className={styles.badgeStatusInativo}>Inativo</span>}
                      {aluno.status === "transferido" && <span className={styles.badgeStatusTransferido}>Transferido</span>}
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

                        {isAdmin && (
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
                              onClick={() => handleDeleteAluno(aluno)}
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
        )}
      </div>

      {/* Modal de Criação / Edição de Aluno */}
      <AlunoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadAlunos}
        alunoToEdit={editingAluno}
      />

      {/* Modal de Ficha & Histórico Disciplinar */}
      <AlunoHistoricoModal
        isOpen={historicoAlunoId !== null}
        onClose={() => setHistoricoAlunoId(null)}
        alunoId={historicoAlunoId}
      />
    </div>
  );
}
export default Alunos;
