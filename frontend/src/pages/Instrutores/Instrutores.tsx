import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit2, Trash2, UserCheck, Loader2 } from "lucide-react";
import { instrutorService, type Instrutor } from "../../services/instrutorService";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { formatPhoneNumber } from "../../utils/formatters";
import { InstrutorModal } from "./InstrutorModal";
import styles from "./Instrutores.module.css";

export function Instrutores() {
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstrutor, setEditingInstrutor] = useState<Instrutor | null>(null);

  const isFirstRender = useRef(true);

  async function loadInstrutores(targetPage = page, targetPerPage = perPage) {
    try {
      setIsLoading(true);
      const res = await instrutorService.getInstrutores({
        search: search.trim() || undefined,
        page: targetPage,
        per_page: targetPerPage,
      });
      setInstrutores(res.data);
      setMeta(res.meta || null);
    } catch {
      setInstrutores([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Reseta página para 1 quando busca mudar
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    // Carregamento imediato no primeiro render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadInstrutores(page, perPage);
      return;
    }

    const timer = setTimeout(() => {
      loadInstrutores(page, perPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [page, perPage, search]);

  function handleOpenCreateModal() {
    setEditingInstrutor(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(instrutor: Instrutor) {
    setEditingInstrutor(instrutor);
    setIsModalOpen(true);
  }

  async function handleDeleteInstrutor(instrutor: Instrutor) {
    const nome = instrutor.user?.name || "este instrutor";
    if (
      window.confirm(
        `Tem certeza de que deseja remover o instrutor "${nome}"? Esta ação também removerá a conta de acesso associada.`
      )
    ) {
      try {
        await instrutorService.deleteInstrutor(instrutor.id);
        loadInstrutores(page, perPage);
      } catch (err: any) {
        alert(
          err.response?.data?.message ||
            "Não foi possível remover o instrutor no momento."
        );
      }
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Instrutores</h1>
          <p className={styles.subtitle}>
            Cadastre e gerencie o corpo docente e os acessos de instrutores ao sistema.
          </p>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenCreateModal}
        >
          <Plus size={18} />
          Novo Instrutor
        </button>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className="animate-spin" />
            <p>Carregando instrutores...</p>
          </div>
        ) : instrutores.length === 0 ? (
          <div className={styles.emptyState}>
            <UserCheck size={48} className={styles.emptyIcon} />
            <p>
              {search
                ? "Nenhum instrutor encontrado para os termos da busca."
                : "Nenhum instrutor cadastrado ainda."}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Instrutor</th>
                <th className={styles.th}>Telefone / Contato</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {instrutores.map((instrutor) => {
                const initial = (instrutor.user?.name || "I").charAt(0).toUpperCase();
                return (
                  <tr key={instrutor.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <div className={styles.avatarMini}>{initial}</div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {instrutor.user?.name || "Sem nome"}
                          </span>
                          <span className={styles.userEmail}>
                            {instrutor.user?.email || "Sem e-mail"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      {instrutor.telefone
                        ? formatPhoneNumber(instrutor.telefone)
                        : "Não informado"}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          title="Editar Instrutor"
                          onClick={() => handleOpenEditModal(instrutor)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title="Remover Instrutor"
                          onClick={() => handleDeleteInstrutor(instrutor)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && instrutores.length > 0 && meta && (
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

      <InstrutorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadInstrutores(page, perPage)}
        instrutorToEdit={editingInstrutor}
      />
    </div>
  );
}
export default Instrutores;
