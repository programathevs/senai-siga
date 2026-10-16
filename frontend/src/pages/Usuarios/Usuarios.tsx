import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  GraduationCap,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import { usuarioService, type Usuario } from "../../services/usuarioService";
import { useAuth } from "../../contexts/AuthContext";
import { Pagination } from "../../components/Pagination/Pagination";
import type { PaginationMeta } from "../../types/pagination";
import { formatPhoneNumber } from "../../utils/formatters";
import { UsuarioModal } from "./UsuarioModal";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import { showAvatarToast } from "../../utils/toast";
import styles from "./Usuarios.module.css";

export function Usuarios() {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [usuarioToDelete, setUsuarioToDelete] = useState<Usuario | null>(null);

  const isFirstRender = useRef(true);

  async function loadUsuarios(targetPage = page, targetPerPage = perPage) {
    try {
      setIsLoading(true);
      const res = await usuarioService.getUsuarios({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page: targetPage,
        per_page: targetPerPage,
      });
      setUsuarios(res.data);
      setMeta(res.meta || null);
    } catch {
      setUsuarios([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }

  // Reseta página para 1 quando busca ou filtro de perfil mudar
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadUsuarios(page, perPage);
      return;
    }

    const timer = setTimeout(() => {
      loadUsuarios(page, perPage);
    }, 300);

    return () => clearTimeout(timer);
  }, [page, perPage, search, roleFilter]);

  function handleOpenCreateModal() {
    setEditingUsuario(null);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(usuario: Usuario) {
    setEditingUsuario(usuario);
    setIsModalOpen(true);
  }

  function handleOpenDelete(usuario: Usuario) {
    if (currentUser?.id && Number(currentUser.id) === Number(usuario.id)) {
      showAvatarToast(
        "Você não pode excluir sua própria conta enquanto estiver conectado.",
        "Ação Bloqueada",
        "warning"
      );
      return;
    }
    setUsuarioToDelete(usuario);
  }

  async function handleConfirmDelete() {
    if (!usuarioToDelete) return;
    try {
      await usuarioService.deleteUsuario(usuarioToDelete.id);
      showAvatarToast(
        `Usuário "${usuarioToDelete.name}" removido com sucesso!`,
        "Usuário Removido",
        "success"
      );
      loadUsuarios(page, perPage);
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message ||
          "Não foi possível remover o usuário no momento.",
        "Erro ao Remover",
        "error"
      );
    }
  }

  function renderRoleBadge(role: string) {
    switch (role) {
      case "gestor":
        return (
          <span className={`${styles.roleBadge} ${styles.roleBadgeGestor}`}>
            <ShieldCheck size={13} />
            Gestor
          </span>
        );
      case "aqv":
        return (
          <span className={`${styles.roleBadge} ${styles.roleBadgeAqv}`}>
            <HeartHandshake size={13} />
            AQV
          </span>
        );
      default:
        return (
          <span className={`${styles.roleBadge} ${styles.roleBadgeInstrutor}`}>
            <GraduationCap size={13} />
            Instrutor
          </span>
        );
    }
  }

  return (
    <div className={styles.container}>
      {/* Cabeçalho da Página */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Gestão de Usuários</h1>
          <p className={styles.subtitle}>
            Cadastre e gerencie os acessos ao sistema com perfis de Gestor, Instrutor e AQV.
          </p>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={handleOpenCreateModal}
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Barra de Filtros */}
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

        <select
          className={styles.roleFilterSelect}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Todos os Perfis</option>
          <option value="gestor">Apenas Gestores</option>
          <option value="instrutor">Apenas Instrutores (Docentes)</option>
          <option value="aqv">Apenas AQV (Acolhimento)</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={32} className="animate-spin" />
            <p>Carregando usuários...</p>
          </div>
        ) : usuarios.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={48} className={styles.emptyIcon} />
            <p>
              {search || roleFilter
                ? "Nenhum usuário encontrado para os filtros selecionados."
                : "Nenhum usuário cadastrado ainda."}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Usuário</th>
                <th className={styles.th}>Perfil / Acesso</th>
                <th className={styles.th}>Telefone / Contato</th>
                <th className={styles.th}>Status de Acesso</th>
                <th className={styles.th} style={{ textAlign: "right" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const initial = (usuario.name || "U").charAt(0).toUpperCase();
                const isSelf = Boolean(
                  currentUser?.id && Number(currentUser.id) === Number(usuario.id)
                );
                const isVerified = Boolean(usuario.email_verified_at);
                const telDisplay = usuario.telefone || usuario.instrutor?.telefone;

                return (
                  <tr key={usuario.id} className={styles.tr}>
                    {/* Usuário / Nome */}
                    <td className={styles.td}>
                      <div className={styles.userCell}>
                        <div className={styles.avatarMini}>{initial}</div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>
                            {usuario.name || "Sem nome"}
                            {isSelf && " (Você)"}
                          </span>
                          <span className={styles.userEmail}>
                            {usuario.email || "Sem e-mail"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Perfil */}
                    <td className={styles.td}>
                      {renderRoleBadge(usuario.role)}
                    </td>

                    {/* Telefone */}
                    <td className={styles.td}>
                      {telDisplay ? formatPhoneNumber(telDisplay) : "Não informado"}
                    </td>

                    {/* Status */}
                    <td className={styles.td}>
                      <span className={styles.statusBadge}>
                        <span
                          className={`${styles.statusDot} ${
                            isVerified ? styles.statusDotVerified : styles.statusDotPending
                          }`}
                        />
                        {isVerified ? "Confirmado" : "Aguardando 1º acesso"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className={styles.td}>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
                          title="Editar Usuário"
                          onClick={() => handleOpenEditModal(usuario)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                          title={
                            isSelf
                              ? "Você não pode excluir sua própria conta"
                              : "Remover Usuário"
                          }
                          disabled={isSelf}
                          onClick={() => handleOpenDelete(usuario)}
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

      {/* Paginação */}
      {!isLoading && usuarios.length > 0 && meta && (
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

      {/* Modal de Cadastro / Edição */}
      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => loadUsuarios(page, perPage)}
        usuarioToEdit={editingUsuario}
      />

      {/* Modal Institucional de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={usuarioToDelete !== null}
        onClose={() => setUsuarioToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Remover Usuário"
        subtitle="Confirmação de exclusão de usuário do sistema"
        confirmLabel="Sim, remover usuário"
        confirmVariant="danger"
        icon="trash"
        itemDetails={
          usuarioToDelete
            ? [
                { label: "Nome", value: usuarioToDelete.name || "—" },
                { label: "E-mail", value: usuarioToDelete.email || "—" },
                {
                  label: "Perfil",
                  value:
                    usuarioToDelete.role === "gestor"
                      ? "Gestor"
                      : usuarioToDelete.role === "aqv"
                      ? "AQV"
                      : "Instrutor",
                },
                {
                  label: "Telefone",
                  value:
                    usuarioToDelete.telefone || usuarioToDelete.instrutor?.telefone
                      ? formatPhoneNumber(
                          usuarioToDelete.telefone ||
                            usuarioToDelete.instrutor?.telefone ||
                            ""
                        )
                      : "Não informado",
                },
              ]
            : []
        }
        warningText="Esta ação revogará definitivamente as credenciais de acesso deste usuário ao sistema."
      />
    </div>
  );
}

export default Usuarios;
