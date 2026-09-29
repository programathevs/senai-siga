import { useState, useEffect, type FormEvent, useMemo } from "react";
import {
  X,
  Clock,
  ShieldAlert,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
} from "lucide-react";
import {
  ocorrenciaService,
  type Ocorrencia,
  type OcorrenciaTipo,
} from "../../services/ocorrenciaService";
import { turmaService, type Turma } from "../../services/turmaService";
import { alunoService, type Aluno } from "../../services/alunoService";
import { instrutorService, type Instrutor } from "../../services/instrutorService";
import { cursoService, type Curso } from "../../services/cursoService";
import styles from "./OcorrenciaModal.module.css";

interface OcorrenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ocorrenciaToEdit?: Ocorrencia | null;
}

export function OcorrenciaModal({
  isOpen,
  onClose,
  onSuccess,
  ocorrenciaToEdit,
}: OcorrenciaModalProps) {
  // Dados auxiliares para seleção
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  // Estados do Formulário
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [tipo, setTipo] = useState<OcorrenciaTipo>("falta");
  const [dataOcorrencia, setDataOcorrencia] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedUcId, setSelectedUcId] = useState<string>("");
  const [quantidadeFaltas, setQuantidadeFaltas] = useState<number>(4);
  const [selectedInstrutorIds, setSelectedInstrutorIds] = useState<number[]>([]);

  const [relatoDificuldades, setRelatoDificuldades] = useState("");
  const [recomendacoesProfessor, setRecomendacoesProfessor] = useState("");
  const [recomendacoesGestao, setRecomendacoesGestao] = useState("");
  const [providenciasGestao, setProvidenciasGestao] = useState("");
  const [outrasObservacoes, setOutrasObservacoes] = useState("");
  const [motivoEdicao, setMotivoEdicao] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = !!ocorrenciaToEdit;

  // Carrega turmas, cursos e instrutores ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      turmaService.getTurmas().then(setTurmas).catch(() => setTurmas([]));
      alunoService.getAlunos().then(setAlunos).catch(() => setAlunos([]));
      instrutorService.getInstrutores().then(setInstrutores).catch(() => setInstrutores([]));
      cursoService.getCursos().then(setCursos).catch(() => setCursos([]));
    }
  }, [isOpen]);

  // Preenche dados ao editar
  useEffect(() => {
    if (ocorrenciaToEdit) {
      setSelectedAlunoId(String(ocorrenciaToEdit.aluno_id));
      setTipo(ocorrenciaToEdit.tipo);
      setDataOcorrencia(
        ocorrenciaToEdit.data_ocorrencia
          ? ocorrenciaToEdit.data_ocorrencia.split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setRelatoDificuldades(ocorrenciaToEdit.relato_dificuldades || "");
      setRecomendacoesProfessor(ocorrenciaToEdit.recomendacoes_professor || "");
      setRecomendacoesGestao(ocorrenciaToEdit.recomendacoes_gestao || "");
      setProvidenciasGestao(ocorrenciaToEdit.providencias_gestao || "");
      setOutrasObservacoes(ocorrenciaToEdit.outras_observacoes || "");

      if (ocorrenciaToEdit.aluno?.turma_id) {
        setSelectedTurmaId(String(ocorrenciaToEdit.aluno.turma_id));
      }

      if (ocorrenciaToEdit.unidades && ocorrenciaToEdit.unidades.length > 0) {
        const primaryUc = ocorrenciaToEdit.unidades[0];
        if (primaryUc.unidade_curricular_id) {
          setSelectedUcId(String(primaryUc.unidade_curricular_id));
        }
        setQuantidadeFaltas(primaryUc.quantidade_faltas);
      }

      if (ocorrenciaToEdit.instrutores) {
        setSelectedInstrutorIds(ocorrenciaToEdit.instrutores.map((i) => i.id));
      }
    } else {
      resetForm();
    }
  }, [ocorrenciaToEdit, isOpen]);

  function resetForm() {
    setSelectedTurmaId("");
    setSelectedAlunoId("");
    setTipo("falta");
    setDataOcorrencia(new Date().toISOString().split("T")[0]);
    setSelectedUcId("");
    setQuantidadeFaltas(4);
    setSelectedInstrutorIds([]);
    setRelatoDificuldades("");
    setRecomendacoesProfessor("");
    setRecomendacoesGestao("");
    setProvidenciasGestao("");
    setOutrasObservacoes("");
    setMotivoEdicao("");
    setErrorMessage("");
  }

  // Filtra alunos pertencentes à turma selecionada
  const alunosFiltrados = useMemo(() => {
    if (!selectedTurmaId) return alunos;
    return alunos.filter((a) => String(a.turma_id) === String(selectedTurmaId));
  }, [alunos, selectedTurmaId]);

  const alunoSelecionado = useMemo(() => {
    return alunos.find((a) => String(a.id) === String(selectedAlunoId));
  }, [alunos, selectedAlunoId]);

  // Encontra a turma selecionada e suas unidades curriculares
  const turmaSelecionada = useMemo(() => {
    return turmas.find((t) => String(t.id) === String(selectedTurmaId));
  }, [turmas, selectedTurmaId]);

  const unidadesCurriculares = useMemo(() => {
    if (!turmaSelecionada) return [];
    if (
      turmaSelecionada.curso?.unidades_curriculares &&
      turmaSelecionada.curso.unidades_curriculares.length > 0
    ) {
      return turmaSelecionada.curso.unidades_curriculares;
    }
    const foundCurso = cursos.find((c) => c.id === turmaSelecionada.curso_id);
    return foundCurso?.unidades_curriculares || [];
  }, [turmaSelecionada, cursos]);

  // Obtém a UC selecionada e sua carga horária
  const ucSelecionada = useMemo(() => {
    return unidadesCurriculares.find((u) => String(u.id) === String(selectedUcId));
  }, [unidadesCurriculares, selectedUcId]);

  const cargaHorariaTotal = ucSelecionada ? Number(ucSelecionada.carga_horaria) : 80;
  const aulasTotais = Math.round(cargaHorariaTotal / 0.75);
  const limiteFaltasAulas = Math.round(aulasTotais * 0.25);
  const percentualDoPermitido =
    limiteFaltasAulas > 0
      ? Number(((quantidadeFaltas / limiteFaltasAulas) * 100).toFixed(1))
      : 0;

  // Atualização automática dos campos ao selecionar a UC, Aluno ou Faltas
  useEffect(() => {
    if (!isEditing && tipo === "falta" && ucSelecionada) {
      const nomeUc = ucSelecionada.sigla
        ? `${ucSelecionada.nome} (${ucSelecionada.sigla})`
        : ucSelecionada.nome;
      const ch = Number(ucSelecionada.carga_horaria) || 80;
      const aulas = Math.round(ch / 0.75);
      const lim = Math.round(aulas * 0.25);
      const perc = lim > 0 ? ((quantidadeFaltas / lim) * 100).toFixed(1) : "0.0";

      setRelatoDificuldades(
        `O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas na unidade curricular ${nomeUc} – ${ch} h/a: Limite de 25% h/a possui até a data de hoje ${quantidadeFaltas} faltas ${perc}% do permitido.`
      );

      if (!recomendacoesProfessor) {
        setRecomendacoesProfessor(
          "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar."
        );
      }
      if (!recomendacoesGestao) {
        setRecomendacoesGestao(
          "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas."
        );
      }
      const nomeAluno = alunoSelecionado?.nome || "o aluno";
      setProvidenciasGestao(
        `Acompanhar diariamente o cumprimento dos compromissos com o curso que ${nomeAluno}, está sendo reorientado por meio da FIAP para atingir integralmente os objetivos do mesmo.`
      );
      if (!outrasObservacoes) {
        setOutrasObservacoes("----");
      }
    }
  }, [selectedUcId, quantidadeFaltas, selectedAlunoId, tipo, isEditing, ucSelecionada, alunoSelecionado]);

  function handlePreencherPadraoSenai() {
    const nomeUc = ucSelecionada
      ? ucSelecionada.sigla
        ? `${ucSelecionada.nome} (${ucSelecionada.sigla})`
        : ucSelecionada.nome
      : "Componente Curricular";
    const nomeAluno = alunoSelecionado?.nome || "o aluno";

    if (tipo === "falta") {
      setRelatoDificuldades(
        `O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas na unidade curricular ${nomeUc} – ${cargaHorariaTotal} h/a: Limite de 25% h/a possui até a data de hoje ${quantidadeFaltas} faltas ${percentualDoPermitido}% do permitido.`
      );
    }
    setRecomendacoesProfessor(
      "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar."
    );
    setRecomendacoesGestao(
      "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas."
    );
    setProvidenciasGestao(
      `Acompanhar diariamente o cumprimento dos compromissos com o curso que ${nomeAluno}, está sendo reorientado por meio da FIAP para atingir integralmente os objetivos do mesmo.`
    );
    setOutrasObservacoes("----");
  }

  function toggleInstrutor(id: number) {
    setSelectedInstrutorIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedAlunoId) {
      setErrorMessage("Selecione o estudante para o qual a FIAP será registrada.");
      return;
    }

    if (tipo === "falta" && !selectedUcId) {
      setErrorMessage("Para FIAPs de falta, selecione a Unidade Curricular correspondente.");
      return;
    }

    if ((tipo === "comportamento" || tipo === "desempenho") && !relatoDificuldades.trim()) {
      setErrorMessage("Preencha o relato das circunstâncias ou dificuldades observadas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        aluno_id: Number(selectedAlunoId),
        tipo,
        data_ocorrencia: dataOcorrencia,
        unidade_curricular_id: selectedUcId ? Number(selectedUcId) : undefined,
        quantidade_faltas: tipo === "falta" ? Number(quantidadeFaltas) : undefined,
        limite_percentual: 25.0,
        instrutor_ids: selectedInstrutorIds,
        relato_dificuldades: relatoDificuldades.trim() || undefined,
        recomendacoes_professor: recomendacoesProfessor.trim() || undefined,
        recomendacoes_gestao: recomendacoesGestao.trim() || undefined,
        providencias_gestao: providenciasGestao.trim() || undefined,
        outras_observacoes: outrasObservacoes.trim() || undefined,
        motivo_edicao: motivoEdicao.trim() || undefined,
      };

      if (isEditing && ocorrenciaToEdit) {
        await ocorrenciaService.updateOcorrencia(ocorrenciaToEdit.id, payload);
      } else {
        await ocorrenciaService.createOcorrencia(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Não foi possível salvar o registro da FIAP. Verifique os campos.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h2 className={styles.title}>
              <FileText size={22} color="var(--color-primary)" />
              {isEditing
                ? `Editar FIAP — ${ocorrenciaToEdit?.numero_sequencial}`
                : "Nova FIAP / Registro de Ocorrência"}
            </h2>
            <p className={styles.subtitle}>
              Preencha os dados da Ficha Individual de Acompanhamento Pedagógico do estudante
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMessage && (
            <div className={`${styles.alertaLimiteFaltas} ${styles.alertaCritico}`}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. SELEÇÃO DO TIPO DE FIAP */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>1. Motivação da FIAP</span>
            </div>

            <div className={styles.tipoCardsGrid}>
              <div
                className={`${styles.tipoCard} ${
                  tipo === "falta" ? styles.tipoCardActiveFalta : ""
                }`}
                onClick={() => setTipo("falta")}
              >
                <Clock size={28} />
                <span className={styles.tipoCardTitle}>Falta (Infrequência)</span>
                <span className={styles.tipoCardDesc}>
                  Cálculo automático de faltas com base na carga horária da UC e teto de 25%
                </span>
              </div>

              <div
                className={`${styles.tipoCard} ${
                  tipo === "comportamento" ? styles.tipoCardActiveComportamento : ""
                }`}
                onClick={() => setTipo("comportamento")}
              >
                <ShieldAlert size={28} />
                <span className={styles.tipoCardTitle}>Comportamento</span>
                <span className={styles.tipoCardDesc}>
                  Ocorrência disciplinar, descumprimento de normas, atitude e segurança/EPI
                </span>
              </div>

              <div
                className={`${styles.tipoCard} ${
                  tipo === "desempenho" ? styles.tipoCardActiveDesempenho : ""
                }`}
                onClick={() => setTipo("desempenho")}
              >
                <BookOpen size={28} />
                <span className={styles.tipoCardTitle}>Aproveitamento</span>
                <span className={styles.tipoCardDesc}>
                  Rendimento insatisfatório, defasagem de competências e plano pedagógico
                </span>
              </div>
            </div>
          </div>

          {/* 2. IDENTIFICAÇÃO DO ESTUDANTE & TURMA */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>2. Identificação do Estudante</span>
            </div>

            <div className={styles.formGrid}>
              {/* Turma */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Turma
                  <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={selectedTurmaId}
                  onChange={(e) => {
                    setSelectedTurmaId(e.target.value);
                    setSelectedAlunoId("");
                    setSelectedUcId("");
                  }}
                  required
                >
                  <option value="">Selecione a turma...</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.curso?.nome}) - {t.turno}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estudante */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Estudante
                  <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  disabled={!selectedTurmaId}
                  required
                >
                  <option value="">
                    {selectedTurmaId ? "Selecione o estudante..." : "Selecione uma turma primeiro"}
                  </option>
                  {alunosFiltrados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} (RA: {a.matricula})
                    </option>
                  ))}
                </select>
              </div>

              {/* Data da Ocorrência */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Data da Ocorrência
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={dataOcorrencia}
                  onChange={(e) => setDataOcorrencia(e.target.value)}
                  required
                />
              </div>

              {/* Unidade Curricular */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Unidade Curricular (UC)
                  {tipo === "falta" && <span className={styles.required}>*</span>}
                </label>
                <select
                  className={styles.select}
                  value={selectedUcId}
                  onChange={(e) => setSelectedUcId(e.target.value)}
                  disabled={!selectedTurmaId}
                  required={tipo === "falta"}
                >
                  <option value="">
                    {selectedTurmaId
                      ? unidadesCurriculares.length > 0
                        ? "Selecione a unidade curricular..."
                        : "Nenhuma UC cadastrada para o curso desta turma"
                      : "Selecione uma turma primeiro"}
                  </option>
                  {unidadesCurriculares.map((uc) => {
                    const aulas = Math.round(uc.carga_horaria / 0.75);
                    const limite = Math.round(aulas * 0.25);
                    return (
                      <option key={uc.id} value={uc.id}>
                        {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome} — {uc.carga_horaria}h ({aulas} aulas, limite: {limite} aulas)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* 3. CALCULADORA DE INFREQUÊNCIA (Se for tipo FALTA) */}
          {tipo === "falta" && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span>3. Cálculo de Infrequência e Faltas (Teto de 25%)</span>
              </div>

              <div className={styles.calculadoraFaltasCard}>
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.label}>Faltas Acumuladas (Horas/Aulas)</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.input}
                      value={quantidadeFaltas}
                      onChange={(e) => setQuantidadeFaltas(Math.max(1, Number(e.target.value)))}
                      required
                    />
                  </div>
                </div>

                <div className={styles.calcStatsRow}>
                  <div className={styles.calcStatItem}>
                    <span className={styles.calcStatLabel}>Carga da UC</span>
                    <span className={styles.calcStatValue}>
                      {cargaHorariaTotal}h ({aulasTotais} aulas)
                    </span>
                  </div>
                  <div className={styles.calcStatItem}>
                    <span className={styles.calcStatLabel}>Limite de Faltas (25%)</span>
                    <span className={styles.calcStatValue}>{limiteFaltasAulas} aulas</span>
                  </div>
                  <div className={styles.calcStatItem}>
                    <span className={styles.calcStatLabel}>Faltas Registradas</span>
                    <span className={styles.calcStatValue}>{quantidadeFaltas} faltas</span>
                  </div>
                  <div className={styles.calcStatItem}>
                    <span className={styles.calcStatLabel}>% do Limite Permitido</span>
                    <span
                      className={styles.calcStatValue}
                      style={{
                        color:
                          percentualDoPermitido >= 100
                            ? "var(--color-danger)"
                            : percentualDoPermitido >= 80
                            ? "var(--color-warning)"
                            : "var(--color-success)",
                      }}
                    >
                      {percentualDoPermitido}%
                    </span>
                  </div>
                </div>

                {percentualDoPermitido >= 100 ? (
                  <div className={`${styles.alertaLimiteFaltas} ${styles.alertaCritico}`}>
                    <AlertTriangle size={18} />
                    <span>
                      Atenção: O estudante atingiu ou ultrapassou 100% do limite institucional de
                      faltas ({limiteFaltasAulas} aulas / 25% da UC). Abertura de processo pedagógico
                      necessária.
                    </span>
                  </div>
                ) : percentualDoPermitido >= 80 ? (
                  <div className={`${styles.alertaLimiteFaltas} ${styles.alertaAtencao}`}>
                    <AlertCircle size={18} />
                    <span>
                      Alerta Preventivo: O aluno atingiu {percentualDoPermitido}% do limite de faltas (
                      {quantidadeFaltas} de {limiteFaltasAulas} aulas permitidas).
                    </span>
                  </div>
                ) : (
                  <div className={`${styles.alertaLimiteFaltas} ${styles.alertaOk}`}>
                    <CheckCircle2 size={18} />
                    <span>
                      Infrequência dentro do limite regulamentar permitido ({quantidadeFaltas} de{" "}
                      {limiteFaltasAulas} aulas).
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. RELATO DOS FATOS OU DIFICULDADES */}
          <div className={styles.section}>
            <div
              className={styles.sectionHeader}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}
            >
              <span>
                {tipo === "falta"
                  ? "4. Justificativa & Recomendações"
                  : tipo === "comportamento"
                  ? "3. Relato da Ocorrência Disciplinar"
                  : "3. Diagnóstico de Aproveitamento Pedagógico"}
              </span>

              {tipo === "falta" && (
                <button
                  type="button"
                  onClick={handlePreencherPadraoSenai}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-primary)",
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                    color: "var(--color-primary)",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  title="Preencher campos com o modelo institucional padrão da Unidade Sumaré"
                >
                  <FileText size={13} />
                  Preencher Texto Padrão SENAI
                </button>
              )}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                {tipo === "falta"
                  ? "Relato circunstanciado das faltas / motivos apresentados"
                  : tipo === "comportamento"
                  ? "Descrição detalhada do comportamento / incidente observado"
                  : "Dificuldades de aprendizagem e competências não atingidas"}
                {tipo !== "falta" && <span className={styles.required}>*</span>}
              </label>
              <textarea
                className={styles.textarea}
                rows={3}
                placeholder="Descreva detalhadamente o ocorrido com horário, local e contexto..."
                value={relatoDificuldades}
                onChange={(e) => setRelatoDificuldades(e.target.value)}
                required={tipo !== "falta"}
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Recomendações do Docente / Instrutor</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="Orientações e prazos para o aluno..."
                  value={recomendacoesProfessor}
                  onChange={(e) => setRecomendacoesProfessor(e.target.value)}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Providências da Gestão Escolar / AQV</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  placeholder="Medidas adotadas pela coordenação / encaminhamentos..."
                  value={providenciasGestao}
                  onChange={(e) => setProvidenciasGestao(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 5. INSTRUTORES NOTIFICANTES */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>Docentes / Instrutores Notificantes</span>
            </div>

            <div className={styles.instrutoresCheckGrid}>
              {instrutores.map((inst) => (
                <label key={inst.id} className={styles.instrutorCheckItem}>
                  <input
                    type="checkbox"
                    checked={selectedInstrutorIds.includes(inst.id)}
                    onChange={() => toggleInstrutor(inst.id)}
                  />
                  <span>
                    {inst.user?.name || "Instrutor"} ({inst.user?.email || "Sem e-mail"})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Motivo da edição caso esteja alterando */}
          {isEditing && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Justificativa da Edição (Histórico de Auditoria)
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Informe o motivo da alteração desta ocorrência..."
                value={motivoEdicao}
                onChange={(e) => setMotivoEdicao(e.target.value)}
              />
            </div>
          )}

          {/* Rodapé com Botões */}
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando FIAP...
                </>
              ) : isEditing ? (
                "Atualizar FIAP"
              ) : (
                "Registrar FIAP"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
