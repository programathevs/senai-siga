import { useState, useEffect } from "react";
import {
  ClipboardCheck,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  Printer,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  planoRecuperacaoService,
  type PlanoRecuperacao,
  type PlanoTipoPrograma,
} from "../../services/planoRecuperacaoService";
import { useAuth } from "../../contexts/AuthContext";
import { PlanoRecuperacaoModal } from "./PlanoRecuperacaoModal";
import { PlanoPdfModal } from "./PlanoPdfModal";
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

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planoToEdit, setPlanoToEdit] = useState<PlanoRecuperacao | null>(null);

  // PDF Modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPlanoPdf, setSelectedPlanoPdf] = useState<PlanoRecuperacao | null>(null);

  useEffect(() => {
    loadPlanos();
  }, [search, selectedTipo, selectedStatus]);

  async function loadPlanos() {
    try {
      setIsLoading(true);
      const data = await planoRecuperacaoService.getAll({
        search: search.trim() || undefined,
        tipo_programa: selectedTipo || undefined,
        status_processo: selectedStatus || undefined,
      });
      setPlanos(data);
    } catch (err) {
      console.error("Erro ao carregar planos de recuperação:", err);
    } finally {
      setIsLoading(false);
    }
  }

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

  async function handleDelete(plano: PlanoRecuperacao) {
    if (!window.confirm(`Deseja realmente excluir o Plano de Recuperação #${plano.id}?`)) {
      return;
    }

    try {
      await planoRecuperacaoService.delete(plano.id);
      showAvatarToast("Plano Removido", `O Plano de Recuperação #${plano.id} foi excluído com sucesso.`);
      loadPlanos();
    } catch (err) {
      console.error("Erro ao excluir plano:", err);
    }
  }

  async function handleRestore(plano: PlanoRecuperacao) {
    if (!window.confirm(`Deseja restaurar o Plano de Recuperação do estudante "${plano.aluno?.nome || ''}"?`)) {
      return;
    }

    try {
      await planoRecuperacaoService.restaurar(plano.id);
      showAvatarToast("Plano Restaurado", `O Plano de Recuperação foi restaurado com sucesso!`);
      loadPlanos();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao restaurar Plano de Recuperação.");
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>
            <ClipboardCheck size={28} color="var(--color-primary)" />
            Planos de Recuperação (PRP / PCA)
          </h1>
          <p className={styles.subtitle}>
            Acompanhamento e emissão dos Planos de Recuperação Paralela e Compensação de Ausências.
          </p>
        </div>

        {user?.role !== "aqv" && (
          <button type="button" className={styles.createBtn} onClick={handleCreateNew}>
            <ClipboardCheck size={18} />
            Novo Plano de Recuperação
          </button>
        )}
      </div>

      {/* Cartão de Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.searchGroup}>
          <Search size={18} className={styles.searchIcon} />
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
          <option value="rascunho">Em Elaboração (Rascunho)</option>
          <option value="aguardando_visto">Aguardando Visto</option>
          <option value="concluido">Concluído</option>
          {user?.role === "gestor" && (
            <option value="excluidos">Excluídos / Arquivados (Lixeira)</option>
          )}
        </select>
      </div>

      {/* Tabela de Resultados */}
      <div className={styles.tableCard}>
        {isLoading ? (
          <div className={styles.emptyState}>
            <Loader2 size={36} className="animate-spin" color="var(--color-primary)" />
            <p>Carregando planos de recuperação...</p>
          </div>
        ) : planos.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={48} color="#94a3b8" />
            <p>Nenhum Plano de Recuperação encontrado.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
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
                {planos.map((plano) => {
                  const aluno = plano.aluno;
                  const initial = (aluno?.nome || "A").charAt(0).toUpperCase();

                  const isDeleted = Boolean(plano.deleted_at);
                  const regId = typeof plano.registrado_por === "object" ? plano.registrado_por?.id : plano.registrado_por;
                  const creatorId = plano.registrado_por_user?.id || regId;
                  const canDelete = user?.role === "gestor" || (creatorId === user?.id && creatorId !== undefined);

                  return (
                    <tr key={plano.id} className={styles.tr} style={isDeleted ? { opacity: 0.7 } : undefined}>
                      {/* FIAP */}
                      <td className={styles.td}>
                        <strong>{plano.ocorrencia?.numero_sequencial || "—"}</strong>
                      </td>

                      {/* Aluno */}
                      <td className={styles.td}>
                        <div className={styles.alunoCell}>
                          <div className={styles.alunoAvatar}>{initial}</div>
                          <div className={styles.alunoInfo}>
                            <span className={styles.alunoNome}>{aluno?.nome || "Estudante"}</span>
                            <span className={styles.alunoSub}>
                              RA: {aluno?.matricula || "—"} | {aluno?.turma?.nome || "Sem Turma"}
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
                          <span className={styles.statusBadge} style={{ background: "color-mix(in srgb, #ef4444 12%, transparent)", color: "#ef4444", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)" }}>
                            <Trash2 size={12} />
                            Excluído (Adormecido)
                          </span>
                        ) : plano.status_processo === "concluido" ? (
                          <span className={`${styles.statusBadge} ${styles.statusConcluido}`}>
                            <CheckCircle2 size={12} />
                            Concluído
                          </span>
                        ) : plano.status_processo === "aguardando_visto" ? (
                          <span className={`${styles.statusBadge} ${styles.statusVisto}`}>
                            <Clock size={12} />
                            Aguardando Visto
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
                            APROVADO
                          </span>
                        ) : plano.conceito === "reprovado" ? (
                          <span className={`${styles.conceitoBadge} ${styles.conceitoReprovado}`}>
                            REPROVADO
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>Pendente</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className={styles.td}>
                        <div className={styles.actionsCell}>
                          <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.pdfBtn}`}
                            onClick={() => handleViewPdf(plano)}
                            title="Visualizar e Imprimir PDF"
                          >
                            <Printer size={16} />
                          </button>

                          {!isDeleted && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.editBtn}`}
                              onClick={() => handleEdit(plano)}
                              title="Editar Plano de Recuperação"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}

                          {!isDeleted && canDelete && (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.deleteBtn}`}
                              onClick={() => handleDelete(plano)}
                              title="Excluir Plano de Recuperação"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}

                          {isDeleted && user?.role === "gestor" && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              style={{
                                backgroundColor: "color-mix(in srgb, #16a34a 12%, transparent)",
                                color: "#16a34a",
                                borderColor: "color-mix(in srgb, #16a34a 30%, transparent)",
                              }}
                              onClick={() => handleRestore(plano)}
                              title="Restaurar Plano de Recuperação Excluído"
                            >
                              <RotateCcw size={15} />
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

      {/* Modal de Formulário */}
      <PlanoRecuperacaoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={loadPlanos}
        planoToEdit={planoToEdit}
      />

      {/* Modal de PDF */}
      <PlanoPdfModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        plano={selectedPlanoPdf}
      />
    </div>
  );
}

export default PlanosRecuperacao;
