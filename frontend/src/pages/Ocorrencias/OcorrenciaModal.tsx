import { useState, useEffect, type FormEvent, useMemo } from "react";
import {
  X,
  Clock,
  ShieldAlert,
  BookOpen,
  AlertCircle,
  Loader2,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import {
  ocorrenciaService,
  type Ocorrencia,
  type OcorrenciaTipo,
} from "../../services/ocorrenciaService";
import { turmaService, type Turma } from "../../services/turmaService";
import { alunoService, type Aluno } from "../../services/alunoService";
import { cursoService, type Curso } from "../../services/cursoService";
import styles from "./OcorrenciaModal.module.css";

export interface UcItem {
  unidade_curricular_id: string;
  quantidade_faltas: number;
}

interface OcorrenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ocorrenciaToEdit?: Ocorrencia | null;
  onOpenPlanoModal?: (createdOcorrencia: Ocorrencia) => void;
}

export function OcorrenciaModal({
  isOpen,
  onClose,
  onSuccess,
  ocorrenciaToEdit,
  onOpenPlanoModal,
}: OcorrenciaModalProps) {
  // Dados auxiliares para seleção
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
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

  // Lista dinâmica de UCs para FIAP de falta
  const [unidadesList, setUnidadesList] = useState<UcItem[]>([
    { unidade_curricular_id: "", quantidade_faltas: 4 },
  ]);

  const [relatoDificuldades, setRelatoDificuldades] = useState("");
  const [recomendacoesProfessor, setRecomendacoesProfessor] = useState("");
  const [recomendacoesGestao, setRecomendacoesGestao] = useState("");
  const [providenciasGestao, setProvidenciasGestao] = useState("");
  const [outrasObservacoes, setOutrasObservacoes] = useState("");
  const [motivoEdicao, setMotivoEdicao] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = !!ocorrenciaToEdit;

  // Carrega turmas e cursos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      turmaService.getTurmas({ all: true }).then((res) => setTurmas(res.data)).catch(() => setTurmas([]));
      alunoService.getAlunos({ all: true }).then((res) => setAlunos(res.data)).catch(() => setAlunos([]));
      cursoService.getCursos({ all: true }).then((res) => setCursos(res.data)).catch(() => setCursos([]));
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

      if (ocorrenciaToEdit.unidade_curricular_id) {
        setSelectedUcId(String(ocorrenciaToEdit.unidade_curricular_id));
      } else if (ocorrenciaToEdit.unidades && ocorrenciaToEdit.unidades.length > 0) {
        setUnidadesList(
          ocorrenciaToEdit.unidades.map((u) => ({
            unidade_curricular_id: String(u.unidade_curricular_id || ""),
            quantidade_faltas: u.quantidade_faltas || 4,
          }))
        );
        const primaryUc = ocorrenciaToEdit.unidades[0];
        if (primaryUc.unidade_curricular_id) {
          setSelectedUcId(String(primaryUc.unidade_curricular_id));
        }
        setQuantidadeFaltas(primaryUc.quantidade_faltas);
      } else {
        setSelectedUcId("");
        setUnidadesList([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
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
    setUnidadesList([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
    setRelatoDificuldades("");
    setRecomendacoesProfessor(
      "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar."
    );
    setRecomendacoesGestao(
      "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas."
    );
    setProvidenciasGestao("");
    setOutrasObservacoes("----");
    setMotivoEdicao("");
    setErrorMessage("");
  }

  function handleAddUcLine() {
    const jaSelecionadas = new Set(unidadesList.map((u) => String(u.unidade_curricular_id)));
    const proximaUc = unidadesCurricularesFiltradas.find((uc) => !jaSelecionadas.has(String(uc.id)));

    setUnidadesList((prev) => [
      ...prev,
      { unidade_curricular_id: proximaUc ? String(proximaUc.id) : "", quantidade_faltas: 4 },
    ]);
  }

  function handleRemoveUcLine(index: number) {
    if (unidadesList.length > 1) {
      setUnidadesList((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleUpdateUcLine(index: number, field: keyof UcItem, value: any) {
    setUnidadesList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
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

  // Filtra UCs vigentes do semestre da turma (com fallback caso não haja UCs no semestre)
  const unidadesCurricularesFiltradas = useMemo(() => {
    if (!turmaSelecionada?.semestre_atual) {
      return unidadesCurriculares;
    }

    const semAtual = Number(turmaSelecionada.semestre_atual);

    const filtradas = unidadesCurriculares.filter((uc) => {
      if (uc.semestre_plano_3 == null && uc.semestre_plano_4 == null) {
        return true;
      }
      return uc.semestre_plano_3 === semAtual || uc.semestre_plano_4 === semAtual;
    });

    return filtradas.length > 0 ? filtradas : unidadesCurriculares;
  }, [unidadesCurriculares, turmaSelecionada]);

  // Seleciona a primeira UC automaticamente quando a turma é selecionada
  useEffect(() => {
    if (!isEditing && selectedTurmaId && unidadesCurricularesFiltradas.length > 0) {
      setUnidadesList((prev) => {
        if (prev.length === 1 && !prev[0].unidade_curricular_id) {
          return [{ unidade_curricular_id: String(unidadesCurricularesFiltradas[0].id), quantidade_faltas: 4 }];
        }
        return prev;
      });
    }
  }, [selectedTurmaId, unidadesCurricularesFiltradas, isEditing]);

  // Atualiza automaticamente as providências da gestão com o nome do aluno selecionado
  useEffect(() => {
    if (!isEditing) {
      const nomeAluno = alunoSelecionado?.nome || "o aluno";
      if (tipo === "falta") {
        setProvidenciasGestao(
          `Acompanhar diariamente o cumprimento dos compromissos com o curso que ${nomeAluno}, está sendo reorientado por meio da FIAP para atingir integralmente os objetivos do mesmo.`
        );
      } else if (tipo === "comportamento") {
        setProvidenciasGestao(
          `Ciência do estudante e de seus responsáveis quanto às normas regimentais e de segurança do SENAI. Acompanhamento pela equipe pedagógica/AQV para garantir a adequação comportamental de ${nomeAluno}.`
        );
      } else if (tipo === "desempenho") {
        setProvidenciasGestao(
          `Acompanhamento pedagógico individualizado junto a ${nomeAluno}, com oferta de suporte/recuperação paralela e alinhamento junto aos responsáveis sobre seu desempenho acadêmico.`
        );
      }
    }
  }, [alunoSelecionado, tipo, isEditing]);

  // Pré-preenche os textos padrão institucionais de recomendações e observações para cada tipo de FIAP
  useEffect(() => {
    if (!isEditing) {
      if (tipo === "falta") {
        setRecomendacoesProfessor(
          "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar."
        );
        setRecomendacoesGestao(
          "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas."
        );
      } else if (tipo === "comportamento") {
        setRecomendacoesProfessor(
          "Recomenda-se ao estudante atentar-se às normas regimentais do SENAI, cumprir os horários de aula e utilizar todos os EPIs/equipamentos obrigatórios, mantendo a postura adequada e respeitosa em sala e laboratórios."
        );
        setRecomendacoesGestao(
          "O estudante deverá cumprir integralmente o regimento escolar do SENAI. Reitera-se a importância do respeito mútuo, uso correto dos ambientes de prática e foco nas atividades pedagógicas propostas."
        );
        if (!relatoDificuldades) {
          setRelatoDificuldades(
            "O estudante foi orientado em relação ao cumprimento das normas regimentais e de convivência escolar em sala de aula/laboratório, comprometendo-se a adotar uma atitude adequada ao ambiente profissional."
          );
        }
      } else if (tipo === "desempenho") {
        setRecomendacoesProfessor(
          "Recomenda-se revisão sistemática dos conteúdos pedagógicos, realização tempestiva de tarefas/trabalhos pendentes e participação ativa nos momentos de dúvida e recuperação paralela oferecidos pelo docente."
        );
        setRecomendacoesGestao(
          "A coordenação pedagógica ofertará suporte de apoio de aprendizagem e acompanhará a evolução acadêmica do estudante. Reforçamos que a média mínima para aprovação no SENAI é de 50 pontos com 75% de frequência."
        );
        if (!relatoDificuldades) {
          setRelatoDificuldades(
            "O estudante apresenta rendimento insatisfatório na Unidade Curricular, com dificuldades técnicas pontuais e entregas pendentes, necessitando de plano de recuperação pedagógica."
          );
        }
      }
      setOutrasObservacoes("----");
    }
  }, [tipo, isEditing]);

  // Atualiza automaticamente o relato de circunstâncias conforme UCs e faltas forem selecionadas/alteradas
  useEffect(() => {
    if (tipo !== "falta") return;

    const relatoPartes: string[] = [];
    unidadesList.forEach((item) => {
      const uc = unidadesCurriculares.find(
        (u) => String(u.id) === String(item.unidade_curricular_id)
      );
      if (uc && Number(item.quantidade_faltas) > 0) {
        const siglaOuNome = uc.sigla ? uc.sigla : uc.nome;
        const ch = Number(uc.carga_horaria) || 80;
        const aulas = Math.round(ch / 0.75);
        const lim = Math.round(aulas * 0.25);
        const perc = lim > 0 ? ((item.quantidade_faltas / lim) * 100).toFixed(1) : "0.0";
        relatoPartes.push(
          `unidade curricular ${siglaOuNome} – ${ch} h/a: possui até a data de hoje ${item.quantidade_faltas} faltas, representando ${perc}% do limite permitido (${lim} aulas)`
        );
      }
    });

    if (relatoPartes.length > 0) {
      let textoUnidades = "";
      if (relatoPartes.length === 1) {
        textoUnidades = relatoPartes[0];
      } else {
        const copy = [...relatoPartes];
        const ultima = copy.pop();
        textoUnidades = copy.join("; ") + " e " + ultima;
      }
      setRelatoDificuldades(
        `O aluno(a) está ciente que as ausências às aulas causam prejuízos para seu aproveitamento e o mesmo apresenta excesso de faltas nas: ${textoUnidades}.`
      );
    } else if (!isEditing) {
      setRelatoDificuldades("");
    }
  }, [unidadesList, unidadesCurriculares, tipo, isEditing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedAlunoId) {
      setErrorMessage("Selecione o estudante para o qual a FIAP será registrada.");
      return;
    }

    const validUnidades = unidadesList
      .filter((u) => Boolean(u.unidade_curricular_id))
      .map((u) => ({
        unidade_curricular_id: Number(u.unidade_curricular_id),
        quantidade_faltas: Number(u.quantidade_faltas),
      }));

    if (tipo === "falta" && validUnidades.length === 0) {
      setErrorMessage("Para FIAPs de falta, selecione ao menos uma Unidade Curricular.");
      return;
    }

    if ((tipo === "comportamento" || tipo === "desempenho") && !relatoDificuldades.trim()) {
      setErrorMessage("Preencha o relato das circunstâncias ou dificuldades observadas.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedUcNum = selectedUcId ? Number(selectedUcId) : undefined;
      const payload = {
        aluno_id: Number(selectedAlunoId),
        tipo,
        data_ocorrencia: dataOcorrencia,
        unidades: tipo === "falta"
          ? validUnidades
          : (selectedUcNum ? [{ unidade_curricular_id: selectedUcNum, quantidade_faltas: 0 }] : undefined),
        unidade_curricular_id: validUnidades.length > 0 ? validUnidades[0].unidade_curricular_id : selectedUcNum,
        quantidade_faltas: validUnidades.length > 0 ? validUnidades[0].quantidade_faltas : (tipo === "falta" ? Number(quantidadeFaltas) : 0),
        limite_percentual: 25.0,
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
        const created = await ocorrenciaService.createOcorrencia(payload);
        if (onOpenPlanoModal && created.has_plano_pendente) {
          onOpenPlanoModal(created);
        }
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
                onClick={() => {
                  setTipo("comportamento");
                  if (!relatoDificuldades.trim()) {
                    setRelatoDificuldades(
                      "O estudante apresentou conduta incompatível com as normas regimentais da instituição."
                    );
                  }
                }}
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
                onClick={() => {
                  setTipo("desempenho");
                  if (!relatoDificuldades.trim()) {
                    setRelatoDificuldades(
                      "O estudante apresenta rendimento insatisfatório na Unidade Curricular e necessita de acompanhamento via Plano de Recuperação Paralela (PRP)."
                    );
                  }
                }}
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

              {/* Unidade Curricular para Desempenho e Comportamento */}
              {(tipo === "desempenho" || tipo === "comportamento") && (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Unidade Curricular (Opcional)</label>
                  <select
                    className={styles.select}
                    value={selectedUcId}
                    onChange={(e) => setSelectedUcId(e.target.value)}
                    disabled={!selectedTurmaId}
                  >
                    <option value="">
                      {selectedTurmaId
                        ? unidadesCurricularesFiltradas.length > 0
                          ? "Selecione a unidade curricular (opcional)..."
                          : "Nenhuma UC cadastrada para este semestre"
                        : "Selecione uma turma primeiro"}
                    </option>
                    {unidadesCurricularesFiltradas.map((uc) => (
                      <option key={uc.id} value={uc.id}>
                        {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 3. CALCULADORA DE INFREQUÊNCIA & UNIDADES CURRICULARES (Se for tipo FALTA) */}
          {tipo === "falta" && (
            <div className={styles.section}>
              <div className={styles.sectionHeaderBetween}>
                <span className={styles.sectionHeaderTitle}>
                  3. Unidades Curriculares &amp; Infrequência (Teto 25%)
                </span>

                {unidadesList.length < unidadesCurricularesFiltradas.length && (
                  <button
                    type="button"
                    className={styles.headerAddBtn}
                    onClick={handleAddUcLine}
                    title="Adicionar mais uma Unidade Curricular nesta FIAP"
                  >
                    <Plus size={14} />
                    <span>Adicionar matéria</span>
                  </button>
                )}
              </div>

              {unidadesList.map((item, index) => {
                const ucItemObj = unidadesCurriculares.find(
                  (u) => String(u.id) === String(item.unidade_curricular_id)
                );
                const ch = ucItemObj ? Number(ucItemObj.carga_horaria) : 80;
                const aulas = Math.round(ch / 0.75);
                const lim = Math.round(aulas * 0.25);
                const perc = lim > 0 ? Number(((item.quantidade_faltas / lim) * 100).toFixed(1)) : 0;

                return (
                  <div key={index} className={styles.calculadoraFaltasCard}>
                    <div className={styles.formGrid}>
                      {/* Dropdown da UC */}
                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                          Unidade Curricular #{index + 1}
                          <span className={styles.required}>*</span>
                        </label>
                        <select
                          className={styles.select}
                          value={item.unidade_curricular_id}
                          onChange={(e) =>
                            handleUpdateUcLine(index, "unidade_curricular_id", e.target.value)
                          }
                          disabled={!selectedTurmaId}
                          required
                        >
                          <option value="">
                            {selectedTurmaId
                              ? unidadesCurricularesFiltradas.length > 0
                                ? "Selecione a unidade curricular..."
                                : "Nenhuma UC cadastrada para este semestre"
                              : "Selecione uma turma primeiro"}
                          </option>
                          {unidadesCurricularesFiltradas
                            .filter(
                              (uc) =>
                                String(uc.id) === String(item.unidade_curricular_id) ||
                                !unidadesList.some(
                                  (other, oIdx) =>
                                    oIdx !== index && String(other.unidade_curricular_id) === String(uc.id)
                                )
                            )
                            .map((uc) => {
                              const ucAulas = Math.round(uc.carga_horaria / 0.75);
                              const ucLim = Math.round(ucAulas * 0.25);
                              const sem = uc.semestre_plano_3 || uc.semestre_plano_4;
                              const semBadge = sem ? ` (${sem}º Sem)` : "";
                              return (
                                <option key={uc.id} value={uc.id}>
                                  {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome}{semBadge} — {uc.carga_horaria}h ({ucAulas} aulas, limite: {ucLim} aulas)
                                </option>
                              );
                            })}
                        </select>
                      </div>

                      {/* Quantidade de Faltas */}
                      <div className={styles.fieldGroup} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                          <label className={styles.label}>
                            Faltas (Horas/Aulas) <span className={styles.required}>*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            className={styles.input}
                            value={item.quantidade_faltas}
                            onChange={(e) =>
                              handleUpdateUcLine(index, "quantidade_faltas", Math.max(1, Number(e.target.value)))
                            }
                            required
                          />
                        </div>

                        {unidadesList.length > 1 && (
                          <button
                            type="button"
                            className={styles.removeUcBtn}
                            onClick={() => handleRemoveUcLine(index)}
                            title="Remover matéria"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {ucItemObj && (
                      <div className={styles.calcStatsRow}>
                        <div className={styles.calcStatItem}>
                          <span className={styles.calcStatLabel}>Carga da UC</span>
                          <span className={styles.calcStatValue}>
                            {ch}h ({aulas} aulas)
                          </span>
                        </div>
                        <div className={styles.calcStatItem}>
                          <span className={styles.calcStatLabel}>Limite (25%)</span>
                          <span className={styles.calcStatValue}>{lim} aulas</span>
                        </div>
                        <div className={styles.calcStatItem}>
                          <span className={styles.calcStatLabel}>Faltas Registradas</span>
                          <span className={styles.calcStatValue}>{item.quantidade_faltas} faltas</span>
                        </div>
                        <div className={styles.calcStatItem}>
                          <span className={styles.calcStatLabel}>% do Limite</span>
                          <span
                            className={styles.calcStatValue}
                            style={{
                              color:
                                perc >= 100
                                  ? "var(--color-danger)"
                                  : perc >= 80
                                  ? "var(--color-warning)"
                                  : "var(--color-success)",
                            }}
                          >
                            {perc}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          )}

          {/* 4. RELATO DOS FATOS OU DIFICULDADES */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span>
                {tipo === "falta"
                  ? "4. Justificativa & Recomendações"
                  : tipo === "comportamento"
                  ? "3. Relato da Ocorrência Disciplinar"
                  : "3. Diagnóstico de Aproveitamento Pedagógico"}
              </span>
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
