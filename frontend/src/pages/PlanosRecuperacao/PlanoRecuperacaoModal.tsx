import { useState, useEffect } from "react";
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

    if (!ocorrencia && !planoToEdit) {
      ocorrenciaService.getOcorrencias({ per_page: 100 }).then((res) => {
        const eligible = res.data.filter((o) => !o.deleted_at);
        setAvailableOcorrencias(eligible);
      }).catch(() => setAvailableOcorrencias([]));
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
    }
  }, [isOpen, ocorrencia, planoToEdit]);

  if (!isOpen) return null;

  const targetOcorrencia = planoToEdit?.ocorrencia || ocorrencia || manualOcorrencia;
  const targetAluno = targetOcorrencia?.aluno;
  const targetTurma = targetAluno?.turma;
  const targetCurso = targetTurma?.curso;

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

    if (!targetOcorrencia || !targetAluno) {
      setErrorMsg("É obrigatório selecionar uma FIAP atrelada válida para registrar o Plano de Recuperação.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        ocorrencia_id: targetOcorrencia.id,
        aluno_id: targetAluno.id,
        unidade_curricular_id: targetOcorrencia.unidades?.[0]?.unidade_curricular_id || undefined,
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
                              value={freq.aulas_compensadas || 1}
                              onChange={(e) =>
                                updateFrequenciaRow(idx, "aulas_compensadas", parseInt(e.target.value) || 1)
                              }
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
            <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
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
