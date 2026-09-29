import React, { useState, useEffect } from "react";
import { X, School, AlertCircle, Loader2 } from "lucide-react";
import { turmaService, type Turma } from "../../services/turmaService";
import { cursoService, type Curso } from "../../services/cursoService";
import { instrutorService, type Instrutor } from "../../services/instrutorService";
import styles from "./TurmaModal.module.css";

interface TurmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  turmaToEdit?: Turma | null;
  cursos?: Curso[];
}

export const TurmaModal: React.FC<TurmaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  turmaToEdit,
  cursos: cursosProp = [],
}) => {
  const [cursos, setCursos] = useState<Curso[]>(cursosProp);
  const [cursoId, setCursoId] = useState<number | "">("");
  const [nome, setNome] = useState("");
  const [turno, setTurno] = useState("Manhã");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [semestreAtual, setSemestreAtual] = useState(1);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [selectedInstrutorIds, setSelectedInstrutorIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (cursosProp && cursosProp.length > 0) {
        setCursos(cursosProp);
      }
      cursoService.getCursos().then(setCursos).catch(() => {});
      instrutorService.getInstrutores().then(setInstrutores).catch(() => setInstrutores([]));

      if (turmaToEdit) {
        setCursoId(turmaToEdit.curso_id);
        setNome(turmaToEdit.nome);
        setTurno(turmaToEdit.turno || "Manhã");
        setAnoLetivo(turmaToEdit.ano_letivo);
        setSemestreAtual(turmaToEdit.semestre_atual || 1);
        setSelectedInstrutorIds(
          turmaToEdit.instrutores ? turmaToEdit.instrutores.map((i) => i.id) : []
        );
      } else {
        setCursoId("");
        setNome("");
        setTurno("Manhã");
        setAnoLetivo(new Date().getFullYear().toString());
        setSemestreAtual(1);
        setSelectedInstrutorIds([]);
      }
      setError(null);
    }
  }, [isOpen, turmaToEdit, cursosProp]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cursoId) {
      setError("Selecione um curso para a turma.");
      return;
    }
    if (!nome.trim()) {
      setError("O nome ou código da turma é obrigatório.");
      return;
    }
    if (!anoLetivo.trim()) {
      setError("O ano letivo é obrigatório.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        curso_id: Number(cursoId),
        nome: nome.trim(),
        turno,
        ano_letivo: anoLetivo.trim(),
        semestre_atual: Number(semestreAtual),
        instrutor_ids: selectedInstrutorIds,
      };

      if (turmaToEdit) {
        await turmaService.updateTurma(turmaToEdit.id, payload);
      } else {
        await turmaService.createTurma(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocorreu um erro ao salvar a turma.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <School size={18} />
            </div>
            <h2 className={styles.title}>
              {turmaToEdit ? "Editar Turma" : "Nova Turma"}
            </h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }} />
              {error}
            </div>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Curso Vinculado <span className={styles.required}>*</span>
            </label>
            <select
              className={styles.select}
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">
                {cursos.length === 0 ? "Nenhum curso disponível (cadastre em Gestão de Cursos)" : "Selecione o curso..."}
              </option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.carga_horaria_total ? `(${c.carga_horaria_total}h)` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Código / Nome da Turma <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: DES-1AM ou 2025.1"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Turno</label>
              <select
                className={styles.select}
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </select>
            </div>
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Ano Letivo <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={anoLetivo}
                onChange={(e) => setAnoLetivo(e.target.value)}
                placeholder="Ex: 2025"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Semestre Atual</label>
              <select
                className={styles.select}
                value={semestreAtual}
                onChange={(e) => setSemestreAtual(Number(e.target.value))}
              >
                <option value={1}>1º Semestre</option>
                <option value={2}>2º Semestre</option>
                <option value={3}>3º Semestre</option>
                <option value={4}>4º Semestre</option>
              </select>
            </div>
          </div>

          {/* Seleção de Docentes / Instrutores Responsáveis */}
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              Docentes / Instrutores Responsáveis
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  marginLeft: "0.5rem",
                  fontWeight: 400,
                }}
              >
                (Marque todos os professores que lecionam nesta turma)
              </span>
            </label>
            <div className={styles.instrutoresContainer}>
              {instrutores.length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", padding: "0.5rem" }}>
                  Nenhum instrutor cadastrado.
                </p>
              ) : (
                instrutores.map((inst) => {
                  const isChecked = selectedInstrutorIds.includes(inst.id);
                  return (
                    <label
                      key={inst.id}
                      className={`${styles.instrutorCheckboxItem} ${
                        isChecked ? styles.instrutorCheckboxChecked : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedInstrutorIds((prev) =>
                            prev.includes(inst.id)
                              ? prev.filter((id) => id !== inst.id)
                              : [...prev, inst.id]
                          );
                        }}
                      />
                      <span>{inst.user?.name || `Instrutor #${inst.id}`}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {turmaToEdit ? "Salvar Alterações" : "Cadastrar Turma"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
