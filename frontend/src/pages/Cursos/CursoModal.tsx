import { useEffect, useState, type FormEvent } from "react";
import { X, GraduationCap, Plus, Trash2, Loader2 } from "lucide-react";
import {
  cursoService,
  type Curso,
  type UnidadeCurricular,
} from "../../services/cursoService";
import styles from "./CursoModal.module.css";

interface CursoModalProps {
  isOpen: boolean;
  curso: Curso | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CursoModal({
  isOpen,
  curso,
  onClose,
  onSuccess,
}: CursoModalProps) {
  const [nome, setNome] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [unidades, setUnidades] = useState<UnidadeCurricular[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (curso) {
      setNome(curso.nome);
      setCargaHoraria(
        curso.carga_horaria_total ? String(curso.carga_horaria_total) : ""
      );
      setUnidades(curso.unidades_curriculares || []);
    } else {
      setNome("");
      setCargaHoraria("");
      setUnidades([
        { nome: "", carga_horaria: 75, semestre_plano_3: 1, semestre_plano_4: 1 },
      ]);
    }
    setError(null);
  }, [curso, isOpen]);

  if (!isOpen) return null;

  function handleAddUc() {
    setUnidades((prev) => [
      ...prev,
      { nome: "", carga_horaria: 75, semestre_plano_3: 1, semestre_plano_4: 1 },
    ]);
  }

  function handleRemoveUc(index: number) {
    setUnidades((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUcChange(
    index: number,
    field: keyof UnidadeCurricular,
    value: any
  ) {
    setUnidades((prev) =>
      prev.map((uc, i) => (i === index ? { ...uc, [field]: value } : uc))
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("Por favor, informe o nome do curso.");
      return;
    }

    // Validação das UCs preenchidas
    for (let i = 0; i < unidades.length; i++) {
      if (!unidades[i].nome.trim()) {
        setError(`Por favor, preencha o nome da Unidade Curricular #${i + 1}.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const payload = {
        nome: nome.trim(),
        carga_horaria_total: cargaHoraria ? Number(cargaHoraria) : null,
        unidades_curriculares: unidades.map((uc) => ({
          ...uc,
          nome: uc.nome.trim(),
          carga_horaria: Number(uc.carga_horaria) || 75,
          semestre_plano_3: uc.semestre_plano_3 ? Number(uc.semestre_plano_3) : null,
          semestre_plano_4: uc.semestre_plano_4 ? Number(uc.semestre_plano_4) : null,
        })),
      };

      if (curso) {
        await cursoService.updateCurso(curso.id, payload);
      } else {
        await cursoService.createCurso(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const apiMessage =
        err.response?.data?.message ||
        "Ocorreu um erro ao salvar o curso. Tente novamente.";
      setError(apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <GraduationCap size={20} />
            </div>
            <h2 className={styles.title}>
              {curso ? "Editar Curso & Matriz" : "Novo Curso & Matriz Curricular"}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label htmlFor="curso-nome" className={styles.label}>
                Nome do Curso <span className={styles.required}>*</span>
              </label>
              <input
                id="curso-nome"
                type="text"
                className={styles.input}
                placeholder="Ex: Técnico em Desenvolvimento de Sistemas"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="curso-carga-horaria" className={styles.label}>
                Carga Horária Total (h)
              </label>
              <input
                id="curso-carga-horaria"
                type="number"
                min="1"
                max="10000"
                className={styles.input}
                placeholder="Ex: 1200"
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Seção de Unidades Curriculares */}
          <div className={styles.ucSection}>
            <div className={styles.ucHeader}>
              <span className={styles.ucTitle}>
                📚 Unidades Curriculares (Matriz Padrão)
              </span>
              <button
                type="button"
                className={styles.addUcBtn}
                onClick={handleAddUc}
                disabled={isSubmitting}
              >
                <Plus size={16} />
                <span>Adicionar UC</span>
              </button>
            </div>

            <div className={styles.ucList}>
              {unidades.map((uc, index) => (
                <div key={index} className={styles.ucRow}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Nome da UC #${index + 1}`}
                    value={uc.nome}
                    onChange={(e) =>
                      handleUcChange(index, "nome", e.target.value)
                    }
                    disabled={isSubmitting}
                    required
                  />

                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    placeholder="Horas"
                    title="Carga horária da UC"
                    value={uc.carga_horaria}
                    onChange={(e) =>
                      handleUcChange(index, "carga_horaria", e.target.value)
                    }
                    disabled={isSubmitting}
                    required
                  />

                  <select
                    className={styles.select}
                    value={uc.semestre_plano_3 || ""}
                    onChange={(e) =>
                      handleUcChange(
                        index,
                        "semestre_plano_3",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    disabled={isSubmitting}
                    title="Semestre no Plano de 3 Semestres"
                  >
                    <option value="">P3: Semestre</option>
                    <option value="1">1º Semestre</option>
                    <option value="2">2º Semestre</option>
                    <option value="3">3º Semestre</option>
                  </select>

                  <select
                    className={styles.select}
                    value={uc.semestre_plano_4 || ""}
                    onChange={(e) =>
                      handleUcChange(
                        index,
                        "semestre_plano_4",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    disabled={isSubmitting}
                    title="Semestre no Plano de 4 Semestres"
                  >
                    <option value="">P4: Semestre</option>
                    <option value="1">1º Semestre</option>
                    <option value="2">2º Semestre</option>
                    <option value="3">3º Semestre</option>
                    <option value="4">4º Semestre</option>
                  </select>

                  <button
                    type="button"
                    className={styles.removeUcBtn}
                    onClick={() => handleRemoveUc(index)}
                    disabled={isSubmitting || unidades.length === 1}
                    title="Remover UC"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {curso ? "Salvar Alterações" : "Cadastrar Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
