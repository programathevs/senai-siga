import { useState, useEffect, useMemo } from "react";
import {
  X,
  ClipboardCheck,
  Save,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  Award,
} from "lucide-react";
import {
  planoRecuperacaoService,
  type PlanoRecuperacao,
  type PlanoTipoPrograma,
  type PlanoConceito,
  type PlanoStatusProcesso,
  type PlanoFrequencia,
} from "../../services/planoRecuperacaoService";
import { ocorrenciaService, type Ocorrencia } from "../../services/ocorrenciaService";
import { cursoService, type Curso, type UnidadeCurricular } from "../../services/cursoService";
import { clearApiCache } from "../../services/api";
import styles from "./PlanoRecuperacaoModal.module.css";

interface PlanoRecuperacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  ocorrencia?: Ocorrencia | null;
  planoToEdit?: PlanoRecuperacao | null;
}

const PROPOSTAS_OPCOES = [
  { id: "exercicios_reforco", label: "Exercícios de reforço" },
  { id: "monitoria", label: "Monitoria" },
  { id: "plantao_duvidas", label: "Plantão de dúvidas" },
  { id: "trabalho_pesquisa", label: "Trabalho de pesquisa" },
  { id: "aula_reforco", label: "Aula de reforço" },
  { id: "outros", label: "Outros" },
];

function unidadeUltrapassouLimite(ou: any): boolean {
  if (!ou) return false;
  const perc = Number(ou.percentual_atingido || 0);
  const qtd = Number(ou.quantidade_faltas || 0);
  const lim = Number(ou.limite_faltas_aulas || 0);

  if (lim > 0) {
    return qtd > lim || perc > 100;
  }
  return perc > 100;
}

export function PlanoRecuperacaoModal({
  isOpen,
  onClose,
  onSaveSuccess,
  ocorrencia,
  planoToEdit,
}: PlanoRecuperacaoModalProps) {
  const [tipoPrograma, setTipoPrograma] = useState<PlanoTipoPrograma>("recuperacao_paralela");
  const [cicloAvaliacao, setCicloAvaliacao] = useState("1º");
  const [conteudoProgramatico, setConteudoProgramatico] = useState("");
  const [propostasSelecionadas, setPropostasSelecionadas] = useState<string[]>([]);
  const [periodoPrevisto, setPeriodoPrevisto] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [conceito, setConceito] = useState<PlanoConceito | "">("");
  const [statusProcesso, setStatusProcesso] = useState<PlanoStatusProcesso>("rascunho");
  const [registroDesempenho, setRegistroDesempenho] = useState("");

  // Cursos e Múltiplas Unidades Curriculares Vinculadas
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedUcIds, setSelectedUcIds] = useState<number[]>([]);

  // Frequências para compensação de ausências
  const [frequencias, setFrequencias] = useState<PlanoFrequencia[]>([]);

  // Para seleção de FIAP quando o modal for aberto sem ocorrência prévia
  const [availableOcorrencias, setAvailableOcorrencias] = useState<Ocorrencia[]>([]);
  const [selectedOcorrenciaId, setSelectedOcorrenciaId] = useState<string>("");
  const [manualOcorrencia, setManualOcorrencia] = useState<Ocorrencia | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg(null);
    cursoService.getCursos({ all: true }).then((res) => setCursos(res.data)).catch(() => setCursos([]));

    if (!ocorrencia && !planoToEdit) {
      Promise.all([
        ocorrenciaService.getOcorrencias({ per_page: 100 }),
        planoRecuperacaoService.getAll(),
      ])
        .then(([ocorrenciasRes, planosRes]) => {
          const existingOcorrenciaIdsWithPlano = new Set(
            planosRes.map((p) => p.ocorrencia_id).filter(Boolean)
          );

          const eligible = ocorrenciasRes.data.filter((o) => {
            if (o.deleted_at) return false;
            // Apenas FIAPs que realmente necessitam de Plano de Recuperação
            if (!o.has_plano_pendente) return false;
            // Não pode ter plano já criado para esta FIAP
            if (existingOcorrenciaIdsWithPlano.has(o.id)) return false;
            return true;
          });

          setAvailableOcorrencias(eligible);
        })
        .catch(() => setAvailableOcorrencias([]));
    }

    if (planoToEdit) {
      setTipoPrograma(planoToEdit.tipo_programa || "recuperacao_paralela");
      setCicloAvaliacao(planoToEdit.ciclo_avaliacao || "1º");
      setConteudoProgramatico(planoToEdit.conteudo_programatico || "");
      setPropostasSelecionadas(planoToEdit.propostas_trabalho || []);
      setPeriodoPrevisto(planoToEdit.periodo_previsto || "");
      setPeriodoInicio(planoToEdit.periodo_inicio || "");
      setPeriodoFim(planoToEdit.periodo_fim || "");
      setConceito(planoToEdit.conceito || "");
      setStatusProcesso(planoToEdit.status_processo || "rascunho");
      setRegistroDesempenho(planoToEdit.registro_desempenho || "");
      setFrequencias(planoToEdit.frequencias || []);

      if (planoToEdit.unidades && planoToEdit.unidades.length > 0) {
        setSelectedUcIds(
          planoToEdit.unidades
            .map((u) => u.id)
            .filter((id): id is number => typeof id === "number")
        );
      } else if (planoToEdit.unidade_curricular_id) {
        setSelectedUcIds([planoToEdit.unidade_curricular_id]);
      } else if (planoToEdit.ocorrencia?.unidades && planoToEdit.ocorrencia.unidades.length > 0) {
        const eFalta = planoToEdit.ocorrencia.tipo === "falta";
        const unidadesAlvo = eFalta
          ? planoToEdit.ocorrencia.unidades.filter(unidadeUltrapassouLimite)
          : planoToEdit.ocorrencia.unidades;
        const ucs = (unidadesAlvo.length > 0 ? unidadesAlvo : planoToEdit.ocorrencia.unidades)
          .map((u) => u.unidade_curricular_id)
          .filter(Boolean) as number[];
        setSelectedUcIds(ucs);
      } else {
        setSelectedUcIds([]);
      }
    } else if (ocorrencia) {
      // Sugere tipo de acordo com a FIAP
      const eFalta = ocorrencia.tipo === "falta";
      setTipoPrograma(eFalta ? "compensacao_ausencia" : "recuperacao_paralela");
      setCicloAvaliacao("1º");
      setConteudoProgramatico("");
      setPropostasSelecionadas(["exercicios_reforco"]);
      setPeriodoPrevisto(new Date().toISOString().split("T")[0]);
      setPeriodoInicio("");
      setPeriodoFim("");
      setConceito("");
      setStatusProcesso("rascunho");
      setRegistroDesempenho("");
      setFrequencias([]);

      // Para compensação de ausência (FIAP de falta), inclui apenas as unidades que ultrapassaram o limite de 100%
      const unidadesAlvo = eFalta && ocorrencia.unidades && ocorrencia.unidades.length > 0
        ? ocorrencia.unidades.filter(unidadeUltrapassouLimite)
        : (ocorrencia.unidades || []);

      const ucIds = (unidadesAlvo.length > 0 ? unidadesAlvo : (ocorrencia.unidades || []))
        .map((u) => u.unidade_curricular_id)
        .filter(Boolean) as number[];

      if (ucIds.length > 0) {
        setSelectedUcIds(ucIds);
      } else if (ocorrencia.unidade_curricular_id) {
        setSelectedUcIds([ocorrencia.unidade_curricular_id]);
      } else {
        setSelectedUcIds([]);
      }
    } else {
      setSelectedOcorrenciaId("");
      setManualOcorrencia(null);
      setConteudoProgramatico("");
      setPropostasSelecionadas(["exercicios_reforco"]);
      setPeriodoPrevisto(new Date().toISOString().split("T")[0]);
      setPeriodoInicio("");
      setPeriodoFim("");
      setConceito("");
      setStatusProcesso("rascunho");
      setRegistroDesempenho("");
      setFrequencias([]);
      setSelectedUcIds([]);
    }
  }, [isOpen, ocorrencia, planoToEdit]);

  const targetOcorrencia = planoToEdit?.ocorrencia || ocorrencia || manualOcorrencia;
  const isOcorrenciaExcluida = Boolean(targetOcorrencia?.deleted_at);
  const targetAluno = targetOcorrencia?.aluno || planoToEdit?.aluno;
  const targetTurma = targetAluno?.turma;
  const targetCurso = targetTurma?.curso;

  // Lista com as UCs disponíveis (restringindo estritamente às UCs apontadas na FIAP vinculada)
  const todasUcsDisponiveis = useMemo(() => {
    const list: UnidadeCurricular[] = [];
    const seen = new Set<number>();

    // Sempre que houver uma FIAP vinculada, restringir estritamente às Unidades Curriculares apontadas na FIAP
    if (targetOcorrencia) {
      if (targetOcorrencia.unidades && targetOcorrencia.unidades.length > 0) {
        const unidadesFiltradas = targetOcorrencia.tipo === "falta"
          ? targetOcorrencia.unidades.filter(unidadeUltrapassouLimite)
          : targetOcorrencia.unidades;

        const unidadesParaUsar = unidadesFiltradas.length > 0
          ? unidadesFiltradas
          : targetOcorrencia.unidades;

        for (const ou of unidadesParaUsar) {
          const uc = ou.unidade_curricular;
          if (uc && uc.id != null && !seen.has(uc.id)) {
            seen.add(uc.id);
            list.push(uc);
          } else if (ou.unidade_curricular_id && !seen.has(ou.unidade_curricular_id)) {
            seen.add(ou.unidade_curricular_id);
            const foundUc = cursos
              .flatMap((c) => c.unidades_curriculares || [])
              .find((u) => u.id === ou.unidade_curricular_id);
            if (foundUc) {
              list.push(foundUc);
            }
          }
        }
      } else if (targetOcorrencia.unidade_curricular_id) {
        const ucId = targetOcorrencia.unidade_curricular_id;
        seen.add(ucId);
        const foundUc =
          targetOcorrencia.unidade_curricular ||
          cursos.flatMap((c) => c.unidades_curriculares || []).find((u) => u.id === ucId);
        if (foundUc) {
          list.push(foundUc);
        }
      }

      if (planoToEdit?.unidades) {
        for (const pu of planoToEdit.unidades) {
          if (pu.id != null && !seen.has(pu.id)) {
            seen.add(pu.id);
            list.push(pu);
          }
        }
      }

      if (planoToEdit?.unidade_curricular && planoToEdit.unidade_curricular.id != null && !seen.has(planoToEdit.unidade_curricular.id)) {
        seen.add(planoToEdit.unidade_curricular.id);
        list.push(planoToEdit.unidade_curricular);
      }

      if (list.length > 0) {
        return list;
      }
    }

    // Fallback: caso a FIAP não possua nenhuma UC cadastrada previamente
    const foundCurso = cursos.find(
      (c) => c.id === targetTurma?.curso_id || c.id === targetCurso?.id
    );
    const ucsCurso =
      foundCurso?.unidades_curriculares ||
      targetTurma?.curso?.unidades_curriculares ||
      targetCurso?.unidades_curriculares ||
      [];

    for (const uc of ucsCurso) {
      if (uc.id != null && !seen.has(uc.id)) {
        seen.add(uc.id);
        list.push(uc);
      }
    }

    return list;
  }, [cursos, targetTurma, targetCurso, targetOcorrencia, planoToEdit]);

  if (!isOpen) return null;

  function handleAddUc(ucId?: number) {
    if (ucId != null) {
      if (!selectedUcIds.includes(ucId)) {
        setSelectedUcIds((prev) => [...prev, ucId]);
      }
      return;
    }
    const proxima = todasUcsDisponiveis.find((uc) => uc.id != null && !selectedUcIds.includes(uc.id));
    if (proxima && proxima.id != null) {
      setSelectedUcIds((prev) => [...prev, proxima.id!]);
    }
  }

  function handleRemoveUc(index: number) {
    if (selectedUcIds.length > 1) {
      setSelectedUcIds((prev) => prev.filter((_, i) => i !== index));
    }
  }

  function handleUpdateUc(index: number, newId: number) {
    if (!newId) return;
    setSelectedUcIds((prev) => prev.map((id, i) => (i === index ? newId : id)));
  }

  function toggleProposta(id: string) {
    setPropostasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function addFrequenciaRow() {
    setFrequencias((prev) => [
      ...prev,
      {
        data: new Date().toISOString().split("T")[0],
        entrada: "07:30",
        saida: "11:30",
        aulas_compensadas: 4,
      },
    ]);
  }

  function updateFrequenciaRow(index: number, field: keyof PlanoFrequencia, value: string | number) {
    setFrequencias((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function removeFrequenciaRow(index: number) {
    setFrequencias((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalOcorrenciaId = targetOcorrencia?.id || planoToEdit?.ocorrencia_id;
    const finalAlunoId = targetAluno?.id || planoToEdit?.aluno_id;

    if (!finalOcorrenciaId || !finalAlunoId) {
      setErrorMsg("É obrigatório selecionar uma FIAP atrelada válida para registrar o Plano de Recuperação.");
      return;
    }

    if (isOcorrenciaExcluida && !planoToEdit) {
      setErrorMsg("Não é possível criar um Plano de Recuperação para uma FIAP excluída. Restaure a FIAP antes de elaborar o plano.");
      return;
    }

    if (selectedUcIds.length === 0) {
      setErrorMsg("É obrigatório vincular ao menos uma Unidade Curricular referente à FIAP ao Plano de Recuperação.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ocorrencia_id: finalOcorrenciaId,
        aluno_id: finalAlunoId,
        unidade_curricular_id: selectedUcIds[0],
        unidade_curricular_ids: selectedUcIds,
        tipo_programa: tipoPrograma,
        ciclo_avaliacao: cicloAvaliacao,
        conteudo_programatico: conteudoProgramatico.trim(),
        propostas_trabalho: propostasSelecionadas,
        periodo_previsto: periodoPrevisto || undefined,
        periodo_inicio: periodoInicio || undefined,
        periodo_fim: periodoFim || undefined,
        conceito: conceito ? (conceito as PlanoConceito) : undefined,
        status_processo: statusProcesso,
        registro_desempenho: registroDesempenho.trim() || undefined,
        frequencias: frequencias,
      };

      if (planoToEdit) {
        await planoRecuperacaoService.update(planoToEdit.id, payload);
      } else {
        await planoRecuperacaoService.create(payload);
      }

      clearApiCache();
      onSaveSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      setErrorMsg(
        errorObj.response?.data?.message || "Não foi possível salvar o Plano de Recuperação."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <ClipboardCheck size={22} />
            </div>
            <div>
              <h2 className={styles.title}>
                {planoToEdit ? "Editar Plano de Recuperação" : "Novo Plano de Recuperação"}
              </h2>
              <p className={styles.subtitle}>
                Escola SENAI “Dr. Celso Charuri” – Unidade Sumaré
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className={styles.body}>
          {isOcorrenciaExcluida && !planoToEdit && (
            <div
              className={styles.alertBox}
              style={{
                borderColor: "color-mix(in srgb, #ef4444 40%, transparent)",
                color: "#ef4444",
                backgroundColor: "color-mix(in srgb, #ef4444 8%, transparent)",
              }}
            >
              <AlertCircle size={18} />
              <span>
                Esta FIAP está excluída (na lixeira). Restaure-a na gestão antes de elaborar um Plano de Recuperação.
              </span>
            </div>
          )}

          {errorMsg && (
            <div className={styles.alertBox}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dados de Identificação da FIAP */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <BookOpen size={18} color="var(--color-primary)" />
              Identificação &amp; FIAP Atrelada
            </h3>

            {!ocorrencia && !planoToEdit && (
              <div className={styles.formGroupFull} style={{ marginBottom: "1rem" }}>
                <label className={styles.label}>
                  Selecione a FIAP Atrelada <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={selectedOcorrenciaId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedOcorrenciaId(id);
                    const found = availableOcorrencias.find((o) => String(o.id) === id) || null;
                    setManualOcorrencia(found);
                    if (found) {
                      const isFalta = found.tipo === "falta";
                      setTipoPrograma(isFalta ? "compensacao_ausencia" : "recuperacao_paralela");

                      // Para compensação de ausência (FIAP de falta), inclui apenas as unidades que ultrapassaram o limite de 100%
                      const unidadesAlvo = isFalta && found.unidades && found.unidades.length > 0
                        ? found.unidades.filter(unidadeUltrapassouLimite)
                        : (found.unidades || []);

                      const ucIds = (unidadesAlvo.length > 0 ? unidadesAlvo : (found.unidades || []))
                        .map((u) => u.unidade_curricular_id)
                        .filter(Boolean) as number[];

                      if (ucIds.length > 0) {
                        setSelectedUcIds(ucIds);
                      } else if (found.unidade_curricular_id) {
                        setSelectedUcIds([found.unidade_curricular_id]);
                      }
                    }
                  }}
                  required
                >
                  <option value="">Selecione uma FIAP...</option>
                  {availableOcorrencias.map((oc) => (
                    <option key={oc.id} value={oc.id}>
                      {oc.numero_sequencial} - {oc.aluno?.nome} ({oc.tipo === "falta" ? "Falta" : "Aproveitamento"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Atrelado à FIAP</span>
                <span className={styles.infoValue}>
                  {targetOcorrencia?.numero_sequencial || "Selecione uma FIAP acima"}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Estudante</span>
                <span className={styles.infoValue}>{targetAluno?.nome || "—"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Curso / Turma</span>
                <span className={styles.infoValue}>
                  {targetCurso?.nome ? `${targetCurso.nome} (${targetTurma?.nome || ''})` : targetTurma?.nome || "SENAI"}
                </span>
              </div>
            </div>
          </div>

          {/* Unidades Curriculares Vinculadas ao Plano */}
          <div className={styles.section}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                <BookOpen size={18} color="var(--color-primary)" />
                Unidades Curriculares Vinculadas ao Plano
                <span className={styles.required}>*</span>
              </h3>

              {selectedUcIds.length < todasUcsDisponiveis.length && (
                <button
                  type="button"
                  className={styles.addUcBtn}
                  onClick={() => handleAddUc()}
                  title="Adicionar mais uma Unidade Curricular a este Plano"
                >
                  <Plus size={14} />
                  <span>Adicionar UC</span>
                </button>
              )}
            </div>

            <p style={{ fontSize: "0.825rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
              {targetOcorrencia?.tipo === "falta"
                ? "Para Compensação de Ausência, apenas as Unidades Curriculares que ultrapassaram o limite de 100% de faltas são incluídas no Plano de Recuperação."
                : "Apenas as Unidades Curriculares apontadas na FIAP vinculada podem ser incluídas no Plano de Recuperação (ao menos uma obrigatória)."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {selectedUcIds.length === 0 ? (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button
                    type="button"
                    className={styles.addUcBtn}
                    onClick={() => handleAddUc()}
                  >
                    <Plus size={14} />
                    <span>Selecionar primeira UC</span>
                  </button>
                </div>
              ) : (
                selectedUcIds.map((ucId, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      backgroundColor: "var(--color-surface)",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-secondary)", minWidth: "55px" }}>
                      UC #{index + 1}:
                    </span>

                    <select
                      className={styles.select}
                      style={{ flex: 1 }}
                      value={ucId}
                      onChange={(e) => handleUpdateUc(index, Number(e.target.value))}
                      required
                    >
                      <option value="">Selecione a Unidade Curricular...</option>
                      {todasUcsDisponiveis
                        .filter((uc) => uc.id != null && (uc.id === ucId || !selectedUcIds.includes(uc.id)))
                        .map((uc) => (
                          <option key={uc.id} value={uc.id}>
                            {uc.sigla ? `[${uc.sigla}] ` : ""}{uc.nome} — {uc.carga_horaria}h
                          </option>
                        ))}
                    </select>

                    {selectedUcIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUc(index)}
                        className={styles.removeUcBtn}
                        title="Remover Unidade Curricular do plano"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Configuração do Programa */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <CheckSquare size={18} color="var(--color-primary)" />
              Programa &amp; Ciclo de Avaliação
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Programa de <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={tipoPrograma}
                  onChange={(e) => setTipoPrograma(e.target.value as PlanoTipoPrograma)}
                >
                  {targetOcorrencia?.tipo === "falta" ? (
                    <option value="compensacao_ausencia">Compensação de Ausência</option>
                  ) : (targetOcorrencia?.tipo as string) === "desempenho" || (targetOcorrencia?.tipo as string) === "aproveitamento" ? (
                    <>
                      <option value="recuperacao_paralela">Recuperação Paralela</option>
                      <option value="recuperacao_final">Recuperação Final</option>
                    </>
                  ) : (
                    <>
                      <option value="recuperacao_paralela">Recuperação Paralela</option>
                      <option value="compensacao_ausencia">Compensação de Ausência</option>
                      <option value="recuperacao_final">Recuperação Final</option>
                    </>
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Ciclo de Avaliação <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={cicloAvaliacao}
                  onChange={(e) => setCicloAvaliacao(e.target.value)}
                >
                  <option value="1º">1º Ciclo de Avaliação</option>
                  <option value="2º">2º Ciclo de Avaliação</option>
                </select>
              </div>
            </div>
          </div>

          {/* 1. Conteúdos Programáticos */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              1. Conteúdos Programáticos a serem Recuperados ou Desenvolvidos
            </h3>
            <div className={styles.formGroupFull}>
              <textarea
                className={styles.textarea}
                placeholder="Descreva as capacidades básicas, conhecimentos (HTTP, PUT, DELETE, CRUD, etc.) ou orientações de exercícios/trabalhos no repositório."
                value={conteudoProgramatico}
                onChange={(e) => setConteudoProgramatico(e.target.value)}
              />
            </div>
          </div>

          {/* 2. Propostas de Trabalho */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>2. Propostas de Trabalho</h3>
            <div className={styles.checkboxGrid}>
              {PROPOSTAS_OPCOES.map((prop) => {
                const isActive = propostasSelecionadas.includes(prop.id);
                return (
                  <label
                    key={prop.id}
                    className={`${styles.checkboxItem} ${
                      isActive ? styles.checkboxItemActive : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkboxInput}
                      checked={isActive}
                      onChange={() => toggleProposta(prop.id)}
                    />
                    <span>{prop.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 3. Período Previsto */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} color="var(--color-primary)" />
              3. Período Previsto à Realização das Atividades
            </h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Data Prevista / Limite</label>
                <input
                  type="date"
                  className={styles.input}
                  value={periodoPrevisto}
                  onChange={(e) => setPeriodoPrevisto(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Status do Processo</label>
                <select
                  className={styles.select}
                  value={statusProcesso}
                  onChange={(e) => setStatusProcesso(e.target.value as PlanoStatusProcesso)}
                >
                  <option value="rascunho">Em Elaboração (Rascunho)</option>
                  <option value="aguardando_visto">Aguardando Visto/Assinatura</option>
                  <option value="concluido">Concluído / Finalizado</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Controle de Frequência (se compensação de ausência) */}
          {tipoPrograma === "compensacao_ausencia" && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <Clock size={18} color="var(--color-primary)" />
                4. Datas Propostas e Controle de Frequência (Compensação)
              </h3>

              <div className={styles.freqTableContainer}>
                <table className={styles.freqTable}>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Aulas Compensadas</th>
                      <th style={{ width: "50px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {frequencias.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#64748b", padding: "1rem" }}>
                          Nenhuma aula de compensação adicionada ainda.
                        </td>
                      </tr>
                    ) : (
                      frequencias.map((freq, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              type="date"
                              className={styles.tableInput}
                              value={freq.data}
                              onChange={(e) => updateFrequenciaRow(idx, "data", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className={styles.tableInput}
                              value={freq.entrada || ""}
                              onChange={(e) => updateFrequenciaRow(idx, "entrada", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="time"
                              className={styles.tableInput}
                              value={freq.saida || ""}
                              onChange={(e) => updateFrequenciaRow(idx, "saida", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              className={styles.tableInput}
                              value={freq.aulas_compensadas ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateFrequenciaRow(
                                  idx,
                                  "aulas_compensadas",
                                  val === "" ? ("" as any) : Math.max(1, parseInt(val, 10) || 0)
                                );
                              }}
                              onBlur={() => {
                                if (!freq.aulas_compensadas || Number(freq.aulas_compensadas) < 1) {
                                  updateFrequenciaRow(idx, "aulas_compensadas", 1);
                                }
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.removeFreqBtn}
                              onClick={() => removeFrequenciaRow(idx)}
                              title="Remover linha"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className={styles.addFreqBtn}
                onClick={addFrequenciaRow}
              >
                <Plus size={16} />
                Adicionar Aula de Compensação
              </button>
            </div>
          )}

          {/* 6 & 7. Conceito e Desempenho */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Award size={18} color="var(--color-primary)" />
              6 &amp; 7. Conceito Final e Registro de Desempenho
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.label}>Conceito do Processo</label>
                <select
                  className={styles.select}
                  value={conceito}
                  onChange={(e) => setConceito(e.target.value as PlanoConceito | "")}
                >
                  <option value="">Ainda em Avaliação (Pendente)</option>
                  <option value="aprovado">APROVADO</option>
                  <option value="reprovado">REPROVADO</option>
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.label}>
                  Registro de Informações sobre o Desempenho do Aluno
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Avaliação descritiva do instrutor sobre o desempenho e cumprimento das atividades de recuperação."
                  value={registroDesempenho}
                  onChange={(e) => setRegistroDesempenho(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Rodapé interno com botões de ação */}
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
              className={styles.saveBtn}
              disabled={isSubmitting || (isOcorrenciaExcluida && !planoToEdit)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Salvar Plano de Recuperação
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
