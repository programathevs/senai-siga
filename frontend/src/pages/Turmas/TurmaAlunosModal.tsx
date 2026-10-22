import React, { useState, useEffect } from "react";
import { X, Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { turmaService, type Turma } from "../../services/turmaService";
import { alunoService, type Aluno } from "../../services/alunoService";
import { formatPhoneNumber } from "../../utils/formatters";
import { ConfirmModal } from "../../components/ConfirmModal/ConfirmModal";
import { showAvatarToast } from "../../utils/toast";
import styles from "./TurmaAlunosModal.module.css";

interface TurmaAlunosModalProps {
  isOpen: boolean;
  onClose: () => void;
  turmaId: number | null;
  onUpdated: () => void;
}

export const TurmaAlunosModal: React.FC<TurmaAlunosModalProps> = ({
  isOpen,
  onClose,
  turmaId,
  onUpdated,
}) => {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEnturmarPanel, setShowEnturmarPanel] = useState(false);
  const [candidatosAlunos, setCandidatosAlunos] = useState<Aluno[]>([]);
  const [searchCandidato, setSearchCandidato] = useState("");
  const [selectedAlunoIds, setSelectedAlunoIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [alunoToDesenturmar, setAlunoToDesenturmar] = useState<{ id: number; nome: string } | null>(null);

  async function loadTurmaDetails(signal?: AbortSignal) {
    if (!turmaId) return;
    try {
      setIsLoading(true);
      const data = await turmaService.getTurma(turmaId, signal);
      setTurma(data);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      setTurma(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCandidatos(signal?: AbortSignal) {
    try {
      const res = await alunoService.getAlunos({ all: true }, signal);
      // Permite enturmar qualquer aluno que não esteja já nesta turma
      const disponiveis = (res.data || []).filter((a) => a.turma_id !== turmaId);
      setCandidatosAlunos(disponiveis);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
        return;
      }
      setCandidatosAlunos([]);
    }
  }

  useEffect(() => {
    if (isOpen && turmaId) {
      const controller = new AbortController();
      loadTurmaDetails(controller.signal);
      setShowEnturmarPanel(false);
      setSelectedAlunoIds([]);
      return () => controller.abort();
    }
  }, [isOpen, turmaId]);

  useEffect(() => {
    if (showEnturmarPanel) {
      const controller = new AbortController();
      loadCandidatos(controller.signal);
      return () => controller.abort();
    }
  }, [showEnturmarPanel]);

  if (!isOpen || !turmaId) return null;

  function handleOpenDesenturmar(alunoId: number, nome: string) {
    setAlunoToDesenturmar({ id: alunoId, nome });
  }

  async function handleConfirmDesenturmar() {
    if (!alunoToDesenturmar || !turmaId) return;
    try {
      await turmaService.desenturmarAluno(turmaId, alunoToDesenturmar.id);
      showAvatarToast(
        `Estudante "${alunoToDesenturmar.nome}" desvinculado da turma com sucesso!`,
        "Desvinculado da Turma",
        "success"
      );
      loadTurmaDetails();
      onUpdated();
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message || "Não foi possível remover o aluno da turma.",
        "Erro ao Desvincular",
        "error"
      );
    }
  }

  function handleToggleSelect(alunoId: number) {
    setSelectedAlunoIds((prev) =>
      prev.includes(alunoId) ? prev.filter((id) => id !== alunoId) : [...prev, alunoId]
    );
  }

  async function handleConfirmarEnturmacao() {
    if (selectedAlunoIds.length === 0) return;
    try {
      setIsSaving(true);
      await turmaService.enturmarAlunos(turmaId!, selectedAlunoIds);
      showAvatarToast(
        `${selectedAlunoIds.length} estudante(s) enturmado(s) com sucesso!`,
        "Enturmação Realizada",
        "success"
      );
      setShowEnturmarPanel(false);
      setSelectedAlunoIds([]);
      loadTurmaDetails();
      onUpdated();
    } catch (err: any) {
      showAvatarToast(
        err.response?.data?.message || "Erro ao enturmar alunos.",
        "Erro ao Enturmar",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }

  const candidatosFiltrados = candidatosAlunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchCandidato.toLowerCase()) ||
      a.matricula.toLowerCase().includes(searchCandidato.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <Users size={18} />
            </div>
            <div>
              <h2 className={styles.title}>{turma?.nome || "Detalhes da Turma"}</h2>
              <p className={styles.subtitle}>
                {turma?.curso?.nome} • {turma?.turno} • {turma?.semestre_atual}º Semestre ({turma?.ano_letivo})
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.actionBar}>
            <div className={styles.sectionTitle}>
              Alunos Matriculados
              <span className={styles.countBadge}>{turma?.alunos?.length || 0} alunos</span>
            </div>

            <button
              type="button"
              className={styles.btnEnturmar}
              onClick={() => setShowEnturmarPanel((prev) => !prev)}
            >
              <UserPlus size={16} />
              {showEnturmarPanel ? "Ocultar Painel" : "+ Enturmar Alunos"}
            </button>
          </div>

          {/* Painel de seleção de alunos para enturmar */}
          {showEnturmarPanel && (
            <div className={styles.enturmarPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "0.875rem" }}>Selecione estudantes disponíveis para incluir:</strong>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  {selectedAlunoIds.length} selecionado(s)
                </span>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className={styles.searchAlunoInput}
                  placeholder="Filtrar por nome ou matrícula/RA..."
                  value={searchCandidato}
                  onChange={(e) => setSearchCandidato(e.target.value)}
                />
              </div>

              <div className={styles.alunosSelectGrid}>
                {candidatosFiltrados.length === 0 ? (
                  <p style={{ textAlign: "center", fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: "0.5rem 0" }}>
                    Nenhum aluno disponível encontrado.
                  </p>
                ) : (
                  candidatosFiltrados.map((aluno) => (
                    <label key={aluno.id} className={styles.alunoCheckRow}>
                      <input
                        type="checkbox"
                        checked={selectedAlunoIds.includes(aluno.id)}
                        onChange={() => handleToggleSelect(aluno.id)}
                      />
                      <div className={styles.alunoCheckInfo}>
                        <span>
                          <strong>{aluno.nome}</strong> (RA: {aluno.matricula})
                          {aluno.turma ? ` — Turma: ${aluno.turma.nome}` : " — Sem Turma"}
                        </span>
                        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>
                          {aluno.telefone ? formatPhoneNumber(aluno.telefone) : "Sem telefone"}
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedAlunoIds.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className={styles.btnEnturmar}
                    onClick={handleConfirmarEnturmacao}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 size={14} className="animate-spin" />}
                    Confirmar Inclusão na Turma ({selectedAlunoIds.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tabela de Alunos da Turma */}
          {isLoading ? (
            <div className={styles.emptyState}>
              <Loader2 size={24} className="animate-spin" />
              <p>Carregando alunos da turma...</p>
            </div>
          ) : !turma?.alunos || turma.alunos.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={36} style={{ opacity: 0.4, marginBottom: "0.5rem" }} />
              <p>Nenhum aluno matriculado nesta turma ainda.</p>
              <p style={{ fontSize: "0.8125rem" }}>Clique em <strong>+ Enturmar Alunos</strong> para incluir estudantes.</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Estudante</th>
                    <th className={styles.th}>Matrícula (RA)</th>
                    <th className={styles.th}>Contato</th>
                    <th className={styles.th} style={{ textAlign: "right" }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {turma.alunos.map((aluno) => (
                    <tr key={aluno.id} className={styles.tr}>
                      <td className={styles.td}>
                        <strong>{aluno.nome}</strong>
                      </td>
                      <td className={styles.td}>{aluno.matricula}</td>
                      <td className={styles.td}>
                        {aluno.telefone ? formatPhoneNumber(aluno.telefone) : "Não informado"}
                      </td>
                      <td className={styles.td} style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className={styles.btnDesenturmar}
                          title="Desvincular da turma"
                          onClick={() => handleOpenDesenturmar(aluno.id, aluno.nome)}
                        >
                          <UserMinus size={14} />
                          Desenturmar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      {/* Modal Institucional de Confirmação para Desenturmar */}
      <ConfirmModal
        isOpen={alunoToDesenturmar !== null}
        onClose={() => setAlunoToDesenturmar(null)}
        onConfirm={handleConfirmDesenturmar}
        title="Desvincular Aluno da Turma"
        subtitle="Confirmação de desenturmação"
        confirmLabel="Sim, desvincular aluno"
        confirmVariant="warning"
        icon="user-minus"
        itemDetails={
          alunoToDesenturmar
            ? [
                { label: "Estudante", value: alunoToDesenturmar.nome },
                { label: "Turma Atual", value: turma?.nome || "Esta Turma" },
              ]
            : []
        }
        warningText="O aluno não será excluído do sistema. Ele apenas deixará de pertencer a esta turma e ficará disponível para enturmação em outra."
      />
    </div>
  );
};
