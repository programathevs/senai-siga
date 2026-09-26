import { useEffect, useState, type FormEvent } from "react";
import { X, GraduationCap, Plus, Trash2, Loader2 } from "lucide-react";
import {
  cursoService,
  type Curso,
} from "../../services/cursoService";
import styles from "./CursoModal.module.css";

interface CursoModalProps {
  isOpen: boolean;
  curso: Curso | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormUc {
  id?: number;
  nome: string;
  carga_horaria: number | string;
  semestre: number;
}

export function CursoModal({
  isOpen,
  curso,
  onClose,
  onSuccess,
}: CursoModalProps) {
  const [nome, setNome] = useState("");
  const [plano, setPlano] = useState<"3" | "4">("3");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [unidades, setUnidades] = useState<FormUc[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (curso) {
      setNome(curso.nome);

      // Detecta se as matérias existentes estavam no plano de 4 semestres
      const hasPlan4 = curso.unidades_curriculares?.some(
        (uc) => uc.semestre_plano_4 !== null && uc.semestre_plano_4 !== undefined
      );
      const initialPlano = hasPlan4 ? "4" : "3";
      setPlano(initialPlano);

      const loadedUcs: FormUc[] =
        curso.unidades_curriculares && curso.unidades_curriculares.length > 0
          ? curso.unidades_curriculares.map((uc) => ({
            id: uc.id,
            nome: uc.nome,
            carga_horaria: uc.carga_horaria,
            semestre:
              initialPlano === "4"
                ? uc.semestre_plano_4 ?? uc.semestre_plano_3 ?? 1
                : uc.semestre_plano_3 ?? 1,
          }))
          : [{ nome: "", carga_horaria: 75, semestre: 1 }];

      setUnidades(loadedUcs);

      const sumUcs = loadedUcs.reduce(
        (acc, uc) => acc + (Number(uc.carga_horaria) || 0),
        0
      );

      if (curso.carga_horaria_total) {
        setCargaHoraria(String(curso.carga_horaria_total));
        // Se a carga total salva for diferente da soma das matérias, mantemos como manual
        setIsManuallyEdited(curso.carga_horaria_total !== sumUcs);
      } else {
        setCargaHoraria(sumUcs > 0 ? String(sumUcs) : "");
        setIsManuallyEdited(false);
      }
    } else {
      setNome("");
      setPlano("3");
      const defaultUcs: FormUc[] = [
        { nome: "", carga_horaria: 75, semestre: 1 },
      ];
      setUnidades(defaultUcs);
      setCargaHoraria("75");
      setIsManuallyEdited(false);
    }
    setError(null);
  }, [curso, isOpen]);

  if (!isOpen) return null;

  // Atualiza as UCs e recalcula a carga horária automaticamente caso não tenha sido editada manualmente
  function updateUcsAndCarga(newUcs: FormUc[], forceAuto = false) {
    setUnidades(newUcs);
    const newSum = newUcs.reduce(
      (acc, uc) => acc + (Number(uc.carga_horaria) || 0),
      0
    );

    if (!isManuallyEdited || forceAuto) {
      setCargaHoraria(newSum > 0 ? String(newSum) : "");
    }
  }

  function handlePlanoChange(newPlano: "3" | "4") {
    setPlano(newPlano);
    // Se mudou para 3 semestres, ajusta matérias que estavam no 4º semestre para o 3º
    if (newPlano === "3") {
      const adjustedUcs = unidades.map((uc) =>
        uc.semestre > 3 ? { ...uc, semestre: 3 } : uc
      );
      updateUcsAndCarga(adjustedUcs);
    }
  }

  function handleAddUc() {
    const newUcs: FormUc[] = [
      ...unidades,
      { nome: "", carga_horaria: 75, semestre: 1 },
    ];
    updateUcsAndCarga(newUcs);
  }

  function handleRemoveUc(index: number) {
    const newUcs = unidades.filter((_, i) => i !== index);
    updateUcsAndCarga(newUcs);
  }

  function handleUcChange(
    index: number,
    field: keyof FormUc,
    value: string | number
  ) {
    const newUcs = unidades.map((uc, i) =>
      i === index ? { ...uc, [field]: value } : uc
    );
    updateUcsAndCarga(newUcs);
  }

  // Soma atual das cargas horárias de todas as UCs
  const totalUcHours = unidades.reduce(
    (acc, uc) => acc + (Number(uc.carga_horaria) || 0),
    0
  );

  function handleCargaHorariaChange(val: string) {
    if (val === "") {
      // Se o admin apagou o valor, volta imediatamente a sincronizar com a soma automática
      setIsManuallyEdited(false);
      setCargaHoraria(totalUcHours > 0 ? String(totalUcHours) : "");
    } else {
      setIsManuallyEdited(true);
      setCargaHoraria(val);
    }
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
          ...(uc.id ? { id: uc.id } : {}),
          nome: uc.nome.trim(),
          carga_horaria: Number(uc.carga_horaria) || 75,
          semestre_plano_3: plano === "3" ? Number(uc.semestre) : null,
          semestre_plano_4: plano === "4" ? Number(uc.semestre) : null,
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

          {/* Dados Gerais do Curso */}
          <div className={styles.gridRow}>
            {/* Nome do Curso */}
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

            {/* Duração / Plano do Curso */}
            <div className={styles.fieldGroup}>
              <label htmlFor="curso-plano" className={styles.label}>
                Duração da Matriz <span className={styles.required}>*</span>
              </label>
              <select
                id="curso-plano"
                className={styles.select}
                value={plano}
                onChange={(e) => handlePlanoChange(e.target.value as "3" | "4")}
                disabled={isSubmitting}
              >
                <option value="3">Plano de 3 Semestres</option>
                <option value="4">Plano de 4 Semestres</option>
              </select>
            </div>

            {/* Carga Horária Total com Auto-Sync */}
            <div className={styles.fieldGroup}>
              <label htmlFor="curso-carga-horaria" className={styles.label}>
                Carga Horária (h)
              </label>
              <input
                id="curso-carga-horaria"
                type="number"
                min="1"
                max="10000"
                className={styles.input}
                placeholder="Ex: 1200"
                value={cargaHoraria}
                onChange={(e) => handleCargaHorariaChange(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Seção de Unidades Curriculares */}
          <div className={styles.ucSection}>
            <div className={styles.ucHeader}>
              <span className={styles.ucTitle}>
                📚 Unidades Curriculares ({plano === "3" ? "3 Semestres" : "4 Semestres"})
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
                  {/* Nome da Matéria */}
                  <input
                    type="text"
                    className={styles.input}
                    placeholder={`Nome da Matéria / UC #${index + 1}`}
                    value={uc.nome}
                    onChange={(e) =>
                      handleUcChange(index, "nome", e.target.value)
                    }
                    disabled={isSubmitting}
                    required
                  />

                  {/* Carga Horária */}
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

                  {/* Semestre em que a matéria ocorre */}
                  <select
                    className={styles.select}
                    value={uc.semestre}
                    onChange={(e) =>
                      handleUcChange(index, "semestre", Number(e.target.value))
                    }
                    disabled={isSubmitting}
                    title={`Semestre no Plano de ${plano} Semestres`}
                    required
                  >
                    <option value="1">1º Semestre</option>
                    <option value="2">2º Semestre</option>
                    <option value="3">3º Semestre</option>
                    {plano === "4" && <option value="4">4º Semestre</option>}
                  </select>

                  {/* Botão Remover Linha */}
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
