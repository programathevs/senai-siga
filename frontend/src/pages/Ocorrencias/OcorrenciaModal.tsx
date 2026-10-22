import { useState, useEffect, useRef, type FormEvent, useMemo } from "react";
import {
  X,
  Clock,
  ShieldAlert,
  BookOpen,
  AlertCircle,
  AlertTriangle,
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
import { alunoService, type Aluno, type AlunoOption } from "../../services/alunoService";
import { cursoService, type Curso } from "../../services/cursoService";
import { showAvatarToast } from "../../utils/toast";
import styles from "./OcorrenciaModal.module.css";

export interface UcItem {
  unidade_curricular_id: string;
  quantidade_faltas: number | "";
}

function areUnidadesEqual(
  listA: Array<{ unidade_curricular_id?: string | number; quantidade_faltas?: number | string | "" }>,
  listB: Array<{ unidade_curricular_id?: string | number; quantidade_faltas?: number | string | "" }>
): boolean {
  const normA = listA
    .filter((u) => Boolean(u.unidade_curricular_id))
    .map((u) => ({
      id: String(u.unidade_curricular_id),
      faltas: Number(u.quantidade_faltas) || 0,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const normB = listB
    .filter((u) => Boolean(u.unidade_curricular_id))
    .map((u) => ({
      id: String(u.unidade_curricular_id),
      faltas: Number(u.quantidade_faltas) || 0,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  if (normA.length !== normB.length) return false;
  for (let i = 0; i < normA.length; i++) {
    if (normA[i].id !== normB[i].id || normA[i].faltas !== normB[i].faltas) {
      return false;
    }
  }
  return true;
}

interface OcorrenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedOcorrencia?: Ocorrencia, isEdit?: boolean) => void;
  ocorrenciaToEdit?: Ocorrencia | null;
  onOpenPlanoModal?: (createdOcorrencia: Ocorrencia) => void;
  initialTurmas?: Turma[];
  turmas?: Turma[];
}

export function OcorrenciaModal({
  isOpen,
  onClose,
  onSuccess,
  ocorrenciaToEdit,
  onOpenPlanoModal,
  initialTurmas,
  turmas: turmasProp,
}: OcorrenciaModalProps) {
  const propTurmas = initialTurmas || turmasProp;
  // Dados auxiliares para seleção
  const [turmas, setTurmas] = useState<Turma[]>(propTurmas || []);
  const [alunos, setAlunos] = useState<Array<Aluno | AlunoOption>>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingAlunos, setIsLoadingAlunos] = useState(false);

  // Sincroniza turmas pré-carregadas pelo componente pai
  useEffect(() => {
    if (propTurmas && propTurmas.length > 0) {
      setTurmas(propTurmas);
    }
  }, [propTurmas]);

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

  const initialUnidadesSnapshotRef = useRef<string>("");
  const isRelatoManuallyEditedRef = useRef<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = !!ocorrenciaToEdit;

  // Carrega turmas e cursos leves ao abrir o modal (se turmas já vierem por props do pai, evita novo fetch)
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    setIsLoadingData(true);

    if (propTurmas && propTurmas.length > 0) {
      setTurmas(propTurmas);
      cursoService
        .getCursos({ all: true }, controller.signal)
        .then((res) => setCursos(res.data))
        .catch((err: any) => {
          if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
            setCursos([]);
          }
        })
        .finally(() => setIsLoadingData(false));
    } else {
      Promise.allSettled([
        turmaService.getTurmas({ all: true }, controller.signal),
        cursoService.getCursos({ all: true }, controller.signal),
      ]).then(([resTurmas, resCursos]) => {
        if (resTurmas.status === "fulfilled") {
          setTurmas(resTurmas.value.data);
        }
        if (resCursos.status === "fulfilled") {
          setCursos(resCursos.value.data);
        }
        setIsLoadingData(false);
      });
    }

    return () => controller.abort();
  }, [isOpen, propTurmas]);

  // Carrega estudantes sob demanda apenas da turma selecionada
  useEffect(() => {
    if (!isOpen || !selectedTurmaId) {
      if (!isEditing) {
        setAlunos([]);
      }
      return;
    }

    const controller = new AbortController();
    setIsLoadingAlunos(true);
    alunoService
      .getAlunos<AlunoOption>({ turma_id: Number(selectedTurmaId), all: true }, controller.signal)
      .then((res) => {
        let loaded: Array<Aluno | AlunoOption> = res.data;
        if (
          isEditing &&
          ocorrenciaToEdit?.aluno &&
          String(ocorrenciaToEdit.aluno.turma_id) === String(selectedTurmaId) &&
          !loaded.some((a) => a.id === ocorrenciaToEdit.aluno!.id)
        ) {
          loaded = [ocorrenciaToEdit.aluno, ...loaded];
        }
        setAlunos(loaded);
      })
      .catch((err: any) => {
        if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
          setAlunos([]);
        }
      })
      .finally(() => {
        setIsLoadingAlunos(false);
      });

    return () => controller.abort();
  }, [isOpen, selectedTurmaId, isEditing, ocorrenciaToEdit]);

  // Preenche dados ao editar
  useEffect(() => {
    if (ocorrenciaToEdit) {
      isRelatoManuallyEditedRef.current = false;
      setMotivoEdicao("");
      setErrorMessage("");
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

      if (ocorrenciaToEdit.aluno) {
        setAlunos((prev) => {
          if (prev.some((a) => a.id === ocorrenciaToEdit.aluno!.id)) return prev;
          return [ocorrenciaToEdit.aluno!, ...prev];
        });
        if (ocorrenciaToEdit.aluno.turma) {
          setTurmas((prev) => {
            if (prev.some((t) => t.id === ocorrenciaToEdit.aluno!.turma!.id)) return prev;
            return [ocorrenciaToEdit.aluno!.turma!, ...prev];
          });
          setSelectedTurmaId(String(ocorrenciaToEdit.aluno.turma_id));
        }
      }

      if (ocorrenciaToEdit.unidade_curricular_id) {
        setSelectedUcId(String(ocorrenciaToEdit.unidade_curricular_id));
      }
      if (ocorrenciaToEdit.unidades && ocorrenciaToEdit.unidades.length > 0) {
        const ucs = ocorrenciaToEdit.unidades.map((u) => ({
          unidade_curricular_id: String(u.unidade_curricular_id || ""),
          quantidade_faltas: Number(u.quantidade_faltas) || 4,
        }));
        setUnidadesList(ucs);
        initialUnidadesSnapshotRef.current = JSON.stringify(ucs);
        const primaryUc = ocorrenciaToEdit.unidades[0];
        if (primaryUc.unidade_curricular_id) {
          setSelectedUcId(String(primaryUc.unidade_curricular_id));
        }
        setQuantidadeFaltas(Number(primaryUc.quantidade_faltas) || 4);
      } else if (ocorrenciaToEdit.unidade_curricular_id) {
        const ucs = [
          {
            unidade_curricular_id: String(ocorrenciaToEdit.unidade_curricular_id),
            quantidade_faltas: Number(ocorrenciaToEdit.quantidade_faltas) || 4,
          },
        ];
        setUnidadesList(ucs);
        initialUnidadesSnapshotRef.current = JSON.stringify(ucs);
      } else {
        setSelectedUcId("");
        setUnidadesList([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
        initialUnidadesSnapshotRef.current = JSON.stringify([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
      }
    } else {
      resetForm();
    }
  }, [ocorrenciaToEdit, isOpen]);

  function resetForm() {
    isRelatoManuallyEditedRef.current = false;
    setSelectedTurmaId("");
    setSelectedAlunoId("");
    setTipo("falta");
    setDataOcorrencia(new Date().toISOString().split("T")[0]);
    setSelectedUcId("");
    setQuantidadeFaltas(4);
    setUnidadesList([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
    initialUnidadesSnapshotRef.current = "";
    setRelatoDificuldades("");
    setRecomendacoesProfessor(
      "Recomendo o aluno, frequentar e participar das aulas efetivamente, bem como as constantes ausências acabam comprometendo o aproveitamento escolar."
    );
    setRecomendacoesGestao(
      "Participar das aulas efetivamente e evitar a faltar, reforçamos que a compensação de ausência ocorre com apresentação de justificativa em período oposto ao horário de aula. Conforme orientações realizadas as faltas comprometem o aproveitamento e bom andamento do curso. Reforçamos que será considerado promovido o aluno que obtiver ao final de cada semestre letivo, em todos os componentes curriculares, nota final igual ou superior a 50 (cinquenta) e frequência igual ou superior a 75% calculados sobre o total de aulas dadas."
    );
    setProvidenciasGestao("");
    setOutrasObservacoes("");
    setMotivoEdicao("");
    setErrorMessage("");
  }

  function handleAddUcLine() {
    const jaSelecionadas = new Set(unidadesList.map((u) => String(u.unidade_curricular_id)));
    const proximaUc = unidadesCurricularesFiltradas.find((uc) => !jaSelecionadas.has(String(uc.id)));

    setUnidadesList((prev) => [
      ...prev,
      {
        unidade_curricular_id: proximaUc ? String(proximaUc.id) : "",
        quantidade_faltas: tipo === "falta" ? 4 : 0,
      },
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
    return alunos.filter((a) => !a.turma_id || String(a.turma_id) === String(selectedTurmaId));
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
          return [{
            unidade_curricular_id: String(unidadesCurricularesFiltradas[0].id),
            quantidade_faltas: tipo === "falta" ? 4 : 0,
          }];
        }
        return prev;
      });
    }
  }, [selectedTurmaId, unidadesCurricularesFiltradas, isEditing, tipo]);

  const isTipoChangedByEdit = isEditing && ocorrenciaToEdit?.tipo !== tipo;
  const shouldUpdateDefaults = !isEditing || isTipoChangedByEdit;

  // Atualiza automaticamente as providências da gestão com o nome do aluno selecionado
  useEffect(() => {
    if (shouldUpdateDefaults) {
      const nomeAluno = alunoSelecionado?.nome || "o aluno";
      if (tipo === "falta") {
        setProvidenciasGestao(
          `Acompanhar diariamente o cumprimento dos compromissos com o curso que ${nomeAluno}, está sendo reorientado por meio da FIAP para atingir integralmente os objetivos do mesmo.`
        );
      } else if (tipo === "comportamento") {
        setProvidenciasGestao(
          `Ciência do estudante e de seus responsáveis quanto às normas regimentais e de segurança do SENAI. Acompanhamento pela Equipe Escolar para garantir a adequação comportamental de ${nomeAluno}.`
        );
      } else if (tipo === "desempenho") {
        setProvidenciasGestao(
          `Acompanhamento pedagógico individualizado junto a ${nomeAluno}, com oferta de suporte/recuperação paralela e alinhamento junto aos responsáveis sobre seu desempenho acadêmico.`
        );
      }
    }
  }, [alunoSelecionado, tipo, shouldUpdateDefaults]);

  // Pré-preenche os textos padrão institucionais de recomendações e observações para cada tipo de FIAP
  useEffect(() => {
    if (shouldUpdateDefaults) {
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
        if (!relatoDificuldades || isTipoChangedByEdit) {
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
        if (!relatoDificuldades || isTipoChangedByEdit) {
          setRelatoDificuldades(
            "O estudante apresenta rendimento insatisfatório na Unidade Curricular, com dificuldades técnicas pontuais e entregas pendentes, necessitando de plano de recuperação pedagógica."
          );
        }
      }
      setOutrasObservacoes("");
    }
  }, [tipo, shouldUpdateDefaults]);

  // Lista normalizada das UCs originais da ocorrência para comparação
  const origUnidades = useMemo(() => {
    if (!ocorrenciaToEdit) return [];
    if (ocorrenciaToEdit.unidades && ocorrenciaToEdit.unidades.length > 0) {
      return ocorrenciaToEdit.unidades.map((u) => ({
        unidade_curricular_id: String(u.unidade_curricular_id || ""),
        quantidade_faltas: Number(u.quantidade_faltas) || 0,
      }));
    }
    if (ocorrenciaToEdit.unidade_curricular_id) {
      return [
        {
          unidade_curricular_id: String(ocorrenciaToEdit.unidade_curricular_id),
          quantidade_faltas: Number(ocorrenciaToEdit.quantidade_faltas) || 0,
        },
      ];
    }
    return [];
  }, [ocorrenciaToEdit]);

  // Indica se a lista atual de UCs e faltas no modal é idêntica à que veio do banco
  const unidadesIguaisAoOriginal = useMemo(() => {
    if (!isEditing) return false;
    return areUnidadesEqual(unidadesList, origUnidades);
  }, [isEditing, unidadesList, origUnidades]);

  // Atualiza automaticamente o relato de circunstâncias conforme UCs e faltas forem selecionadas/alteradas
  useEffect(() => {
    if (tipo !== "falta") return;

    if (isEditing && unidadesIguaisAoOriginal) {
      // Se as UCs e faltas voltaram ao estado original e o usuário não editou o relato manualmente,
      // restaura exatamente o texto original salvo no banco
      if (!isRelatoManuallyEditedRef.current) {
        setRelatoDificuldades(ocorrenciaToEdit?.relato_dificuldades || "");
      }
      return;
    }

    // Se o usuário customizou o relato manualmente na caixa de texto, não sobrescreve
    if (isRelatoManuallyEditedRef.current) {
      return;
    }

    const relatoPartes: string[] = [];
    unidadesList.forEach((item) => {
      const uc = unidadesCurriculares.find(
        (u) => String(u.id) === String(item.unidade_curricular_id)
      );
      const qtdFaltas = Number(item.quantidade_faltas);
      if (uc && qtdFaltas > 0) {
        const siglaOuNome = uc.sigla ? uc.sigla : uc.nome;
        const ch = Number(uc.carga_horaria) || 80;
        const aulas = Math.round(ch / 0.75);
        const lim = Math.round(aulas * 0.25);
        const perc = lim > 0 ? ((qtdFaltas / lim) * 100).toFixed(1) : "0.0";
        relatoPartes.push(
          `unidade curricular ${siglaOuNome} – ${ch} h/a: possui até a data de hoje ${qtdFaltas} faltas, representando ${perc}% do limite permitido (${lim} aulas)`
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
  }, [unidadesList, unidadesCurriculares, tipo, isEditing, unidadesIguaisAoOriginal, ocorrenciaToEdit]);

  // Verifica se o estado atual de faltas no formulário ultrapassa o limite de 25% (100% de tolerância)
  const excedeLimiteAtual = useMemo(() => {
    if (tipo !== "falta") return false;
    return unidadesList.some((item) => {
      const uc = unidadesCurriculares.find(
        (u) => String(u.id) === String(item.unidade_curricular_id)
      );
      const ch = uc ? Number(uc.carga_horaria) : 80;
      const aulas = Math.round(ch / 0.75);
      const lim = Math.round(aulas * 0.25);
      const qtd = Number(item.quantidade_faltas) || 0;
      return lim > 0 && qtd > lim;
    });
  }, [tipo, unidadesList, unidadesCurriculares]);

  // Detecta se a FIAP sendo editada possui um Plano de Recuperação vinculado ativo
  const temPlanoVinculado = useMemo(() => {
    if (!ocorrenciaToEdit || ocorrenciaToEdit.tipo !== "falta") return false;
    const planos =
      (ocorrenciaToEdit as any).planos_recuperacao ||
      (ocorrenciaToEdit as any).planosRecuperacao;
    if (Array.isArray(planos) && planos.length > 0) {
      return planos.some((p: any) => !p.deleted_at);
    }
    if (ocorrenciaToEdit.has_plano_pendente) return true;
    if (ocorrenciaToEdit.unidades && ocorrenciaToEdit.unidades.length > 0) {
      return ocorrenciaToEdit.unidades.some((u) => {
        const lim = u.limite_faltas_aulas;
        return lim != null && lim > 0 && u.quantidade_faltas > lim;
      });
    }
    return false;
  }, [ocorrenciaToEdit]);

  // Se a FIAP tinha plano e agora as faltas foram reduzidas para dentro do limite (<= 100%), o plano será enviado para a lixeira (Soft Delete)
  const planoSeraArquivado = isEditing && tipo === "falta" && temPlanoVinculado && !excedeLimiteAtual;

  // Detecta se houve alguma alteração real nos dados da FIAP
  const hasChanges = useMemo(() => {
    if (!isEditing || !ocorrenciaToEdit) return true;

    // 1. Aluno
    if (String(selectedAlunoId) !== String(ocorrenciaToEdit.aluno_id)) return true;

    // 2. Tipo
    if (tipo !== ocorrenciaToEdit.tipo) return true;

    // 3. Data da Ocorrência
    const origData = ocorrenciaToEdit.data_ocorrencia
      ? ocorrenciaToEdit.data_ocorrencia.split("T")[0]
      : "";
    if (dataOcorrencia !== origData) return true;

    // 4. Textos (normalizados com trim)
    const norm = (val?: string | null) => (val || "").trim();
    // O relato só conta como alteração se o usuário editou manualmente
    if (isRelatoManuallyEditedRef.current && norm(relatoDificuldades) !== norm(ocorrenciaToEdit.relato_dificuldades)) {
      return true;
    }
    if (norm(recomendacoesProfessor) !== norm(ocorrenciaToEdit.recomendacoes_professor)) return true;
    if (norm(recomendacoesGestao) !== norm(ocorrenciaToEdit.recomendacoes_gestao)) return true;
    if (norm(providenciasGestao) !== norm(ocorrenciaToEdit.providencias_gestao)) return true;
    if (norm(outrasObservacoes) !== norm(ocorrenciaToEdit.outras_observacoes)) return true;

    // 5. Unidades Curriculares e Faltas
    if (tipo === "falta" || tipo === "desempenho") {
      if (!areUnidadesEqual(unidadesList, origUnidades)) return true;
    } else {
      const origUcId = ocorrenciaToEdit.unidade_curricular_id
        ? String(ocorrenciaToEdit.unidade_curricular_id)
        : "";
      if (selectedUcId !== origUcId) return true;
    }

    return false;
  }, [
    isEditing,
    ocorrenciaToEdit,
    selectedAlunoId,
    tipo,
    dataOcorrencia,
    relatoDificuldades,
    recomendacoesProfessor,
    recomendacoesGestao,
    providenciasGestao,
    outrasObservacoes,
    unidadesList,
    origUnidades,
    selectedUcId,
  ]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (isEditing && !hasChanges) {
      showAvatarToast("Nenhuma alteração foi realizada no formulário.", "Sem alterações", "warning");
      return;
    }

    if (isEditing && !motivoEdicao.trim()) {
      setErrorMessage("Por favor, preencha a justificativa da edição para o histórico de auditoria.");
      return;
    }

    if (!selectedAlunoId) {
      setErrorMessage("Selecione o estudante para o qual a FIAP será registrada.");
      return;
    }

    const validUnidadesFalta = unidadesList
      .filter((u) => Boolean(u.unidade_curricular_id))
      .map((u) => ({
        unidade_curricular_id: Number(u.unidade_curricular_id),
        quantidade_faltas: Math.max(1, Number(u.quantidade_faltas) || 1),
      }));

    const validUnidadesDesempenho = unidadesList
      .filter((u) => Boolean(u.unidade_curricular_id))
      .map((u) => ({
        unidade_curricular_id: Number(u.unidade_curricular_id),
        quantidade_faltas: 0,
      }));

    if (tipo === "falta" && validUnidadesFalta.length === 0) {
      setErrorMessage("Para FIAPs de falta, selecione ao menos uma Unidade Curricular.");
      return;
    }

    if (tipo === "desempenho" && validUnidadesDesempenho.length === 0) {
      setErrorMessage("Para FIAPs de aproveitamento, selecione ao menos uma Unidade Curricular.");
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
          ? validUnidadesFalta
          : tipo === "desempenho"
            ? validUnidadesDesempenho
            : (selectedUcNum ? [{ unidade_curricular_id: selectedUcNum, quantidade_faltas: 0 }] : undefined),
        unidade_curricular_id: tipo === "falta"
          ? (validUnidadesFalta.length > 0 ? validUnidadesFalta[0].unidade_curricular_id : undefined)
          : tipo === "desempenho"
            ? (validUnidadesDesempenho.length > 0 ? validUnidadesDesempenho[0].unidade_curricular_id : undefined)
            : selectedUcNum,
        quantidade_faltas: tipo === "falta"
          ? (validUnidadesFalta.length > 0 ? validUnidadesFalta[0].quantidade_faltas : Number(quantidadeFaltas))
          : 0,
        limite_percentual: 25.0,
        relato_dificuldades: relatoDificuldades.trim() || undefined,
        recomendacoes_professor: recomendacoesProfessor.trim() || undefined,
        recomendacoes_gestao: recomendacoesGestao.trim() || undefined,
        providencias_gestao: providenciasGestao.trim() || undefined,
        outras_observacoes: outrasObservacoes.trim() || undefined,
        motivo_edicao: motivoEdicao.trim() || undefined,
      };

      let savedOcorrencia: Ocorrencia;
      const isEdit = Boolean(isEditing && ocorrenciaToEdit);

      if (isEditing && ocorrenciaToEdit) {
        const hadAqvFlow =
          ocorrenciaToEdit.status === "enviado_aqv" ||
          ocorrenciaToEdit.status === "assinado" ||
          Boolean((ocorrenciaToEdit as any).aqv_recebimento);

        const updated = await ocorrenciaService.updateOcorrencia(ocorrenciaToEdit.id, payload);
        savedOcorrencia = updated;

        if (updated.sem_alteracoes) {
          showAvatarToast("Nenhuma alteração foi realizada na FIAP.", "Sem alterações", "warning");
        } else if (updated.plano_arquivado) {
          showAvatarToast(
            "FIAP atualizada! Como as faltas voltaram para o limite permitido (≤100%), o Plano de Recuperação vinculado foi movido para a Lixeira.",
            "Plano Arquivado",
            "warning"
          );
        } else if (hadAqvFlow) {
          showAvatarToast(
            "FIAP atualizada com sucesso! O status retornou para Pendente para que você possa revisá-la e reenviá-la à Equipe Escolar.",
            "Processo Reiniciado",
            "warning"
          );
        } else {
          showAvatarToast("FIAP atualizada com sucesso!");
        }
      } else {
        const created = await ocorrenciaService.createOcorrencia(payload);
        savedOcorrencia = created;
        showAvatarToast("FIAP cadastrada com sucesso!");
        if (onOpenPlanoModal && created.tipo === "desempenho" && created.has_plano_pendente) {
          onOpenPlanoModal(created);
        }
      }

      onClose();
      onSuccess(savedOcorrencia, isEdit);
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
                className={`${styles.tipoCard} ${tipo === "falta" ? styles.tipoCardActiveFalta : ""
                  }`}
                onClick={() => setTipo("falta")}
              >
                <Clock size={28} />
                <span className={styles.tipoCardTitle}>Falta</span>
                <span className={styles.tipoCardDesc}>
                  Cálculo automático de faltas com base na carga horária da UC e teto de 25%
                </span>
              </div>

              <div
                className={`${styles.tipoCard} ${tipo === "comportamento" ? styles.tipoCardActiveComportamento : ""
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
                className={`${styles.tipoCard} ${tipo === "desempenho" ? styles.tipoCardActiveDesempenho : ""
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
                  {isLoadingData && turmas.length === 0 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                      <Loader2 size={12} className="animate-spin" /> Carregando turmas...
                    </span>
                  )}
                </label>
                <select
                  className={styles.select}
                  value={selectedTurmaId}
                  onChange={(e) => {
                    setSelectedTurmaId(e.target.value);
                    setSelectedAlunoId("");
                    setSelectedUcId("");
                    setUnidadesList([{ unidade_curricular_id: "", quantidade_faltas: 4 }]);
                  }}
                  disabled={isLoadingData && turmas.length === 0}
                  required
                >
                  <option value="">
                    {isLoadingData && turmas.length === 0
                      ? "Carregando turmas..."
                      : "Selecione a turma..."}
                  </option>
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
                  {isLoadingAlunos && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-primary)", display: "inline-flex", alignItems: "center", gap: "4px", marginLeft: "8px" }}>
                      <Loader2 size={12} className="animate-spin" /> Carregando alunos da turma...
                    </span>
                  )}
                </label>
                <select
                  className={styles.select}
                  value={selectedAlunoId}
                  onChange={(e) => setSelectedAlunoId(e.target.value)}
                  disabled={!selectedTurmaId || isLoadingAlunos}
                  required
                >
                  <option value="">
                    {isLoadingAlunos
                      ? "Carregando estudantes da turma..."
                      : !selectedTurmaId
                        ? "Selecione uma turma primeiro"
                        : alunosFiltrados.length === 0
                          ? "Nenhum estudante matriculado nesta turma"
                          : "Selecione o estudante..."}
                  </option>
                  {alunosFiltrados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} (RA: {a.ra || a.matricula})
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

              {/* Unidade Curricular para Comportamento (Opcional) */}
              {tipo === "comportamento" && (
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
                          ? "Nenhuma (Não vincular a matéria específica)"
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

          {/* 3. CALCULADORA DE FALTA & UNIDADES CURRICULARES (Se for tipo FALTA) */}
          {tipo === "falta" && (
            <div className={styles.section}>
              <div className={styles.sectionHeaderBetween}>
                <span className={styles.sectionHeaderTitle}>
                  3. Unidades Curriculares Falta (Teto 25%)
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
                const faltasNum = Number(item.quantidade_faltas) || 0;
                const perc = lim > 0 ? Number(((faltasNum / lim) * 100).toFixed(1)) : 0;

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
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateUcLine(
                                index,
                                "quantidade_faltas",
                                val === "" ? "" : Math.max(1, parseInt(val, 10) || 0)
                              );
                            }}
                            onBlur={() => {
                              if (item.quantidade_faltas === "" || Number(item.quantidade_faltas) < 1) {
                                handleUpdateUcLine(index, "quantidade_faltas", 1);
                              }
                            }}
                            onWheel={(e) => e.currentTarget.blur()}
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

              {planoSeraArquivado && (
                <div className={styles.planoNoticeBox}>
                  <AlertTriangle className={styles.planoNoticeIcon} size={20} />
                  <div className={styles.planoNoticeContent}>
                    <span className={styles.planoNoticeTitle}>
                      Aviso: Plano de Recuperação será arquivado
                    </span>
                    <span className={styles.planoNoticeText}>
                      Com a redução das faltas para dentro do limite permitido (≤100%), o <strong>Plano de Recuperação Pedagógica vinculado</strong> será movido para a <strong>Lixeira (Soft Delete)</strong> ao salvar. Caso as faltas voltem a ultrapassar o limite no futuro, o plano será reativado automaticamente.
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. UNIDADES CURRICULARES (Se for tipo DESEMPENHO / APROVEITAMENTO) */}
          {tipo === "desempenho" && (
            <div className={styles.section}>
              <div className={styles.sectionHeaderBetween}>
                <span className={styles.sectionHeaderTitle}>
                  3. Unidades Curriculares com Aproveitamento Insatisfatório
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

              {unidadesList.map((item, index) => (
                <div key={index} className={styles.calculadoraFaltasCard} style={{ padding: "0.85rem 1rem" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }} className={styles.fieldGroup}>
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
                            const sem = uc.semestre_plano_3 || uc.semestre_plano_4;
                            const semBadge = sem ? ` (${sem}º Sem)` : "";
                            return (
                              <option key={uc.id} value={uc.id}>
                                {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome}{semBadge} — {uc.carga_horaria}h
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {unidadesList.length > 1 && (
                      <button
                        type="button"
                        className={styles.removeUcBtn}
                        onClick={() => handleRemoveUcLine(index)}
                        title="Remover esta matéria"
                        style={{ marginBottom: "2px" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
                    : "4. Diagnóstico de Aproveitamento Pedagógico"}
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
                onChange={(e) => {
                  isRelatoManuallyEditedRef.current = true;
                  setRelatoDificuldades(e.target.value);
                }}
                required={tipo !== "falta"}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Recomendações do Instrutor</label>
              <textarea
                className={styles.textarea}
                rows={2}
                placeholder="Orientações e prazos para o aluno..."
                value={recomendacoesProfessor}
                onChange={(e) => setRecomendacoesProfessor(e.target.value)}
              />
            </div>
          </div>

          {/* Motivo da edição caso esteja alterando */}
          {isEditing && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Justificativa da Edição (Histórico de Auditoria)
                <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                placeholder="Informe o motivo da alteração desta ocorrência..."
                value={motivoEdicao}
                onChange={(e) => setMotivoEdicao(e.target.value)}
                required
              />
            </div>
          )}

          {/* Rodapé com Botões */}
          <div className={styles.modalFooter}>
            {isEditing && !hasChanges && (
              <span className={styles.noChangesNotice}>
                Nenhuma alteração detectada
              </span>
            )}
            {isEditing && hasChanges && !motivoEdicao.trim() && (
              <span
                className={styles.noChangesNotice}
                style={{
                  borderColor: "var(--color-warning, #f59e0b)",
                  color: "var(--color-warning, #d97706)",
                }}
              >
                Justificativa obrigatória
              </span>
            )}
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={isSubmitting || (isEditing && (!hasChanges || !motivoEdicao.trim()))}
              title={
                isEditing && !hasChanges
                  ? "Altere algum campo para habilitar o salvamento"
                  : isEditing && !motivoEdicao.trim()
                    ? "Informe a justificativa da edição para salvar"
                    : undefined
              }
            >
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
