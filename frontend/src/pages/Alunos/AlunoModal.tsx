import React, { useState, useEffect } from "react";
import { X, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { alunoService, type Aluno } from "../../services/alunoService";
import { turmaService, type Turma } from "../../services/turmaService";
import { formatPhoneNumber, formatCpf } from "../../utils/formatters";
import styles from "./AlunoModal.module.css";

interface AlunoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alunoToEdit?: Aluno | null;
}

export const AlunoModal: React.FC<AlunoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  alunoToEdit,
}) => {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [turmaId, setTurmaId] = useState<number | "">("");
  const [status, setStatus] = useState<"ativo" | "inativo" | "transferido">("ativo");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      turmaService.getTurmas({ all: true }).then((res) => setTurmas(res.data)).catch(() => setTurmas([]));
      if (alunoToEdit) {
        setNome(alunoToEdit.nome);
        setMatricula(alunoToEdit.matricula);
        setCpf(formatCpf(alunoToEdit.cpf || ""));
        setDataNascimento(alunoToEdit.data_nascimento ? alunoToEdit.data_nascimento.slice(0, 10) : "");
        setEmail(alunoToEdit.email || "");
        setTelefone(formatPhoneNumber(alunoToEdit.telefone || ""));
        setTurmaId(alunoToEdit.turma_id || "");
        setStatus(alunoToEdit.status);
      } else {
        setNome("");
        setMatricula("");
        setCpf("");
        setDataNascimento("");
        setEmail("");
        setTelefone("");
        setTurmaId("");
        setStatus("ativo");
      }
      setError(null);
    }
  }, [isOpen, alunoToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("O nome completo do aluno é obrigatório.");
      return;
    }
    if (!matricula.trim()) {
      setError("A matrícula / RA é obrigatória.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        nome: nome.trim(),
        matricula: matricula.trim(),
        cpf: cpf.trim() || null,
        data_nascimento: dataNascimento || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        turma_id: turmaId ? Number(turmaId) : null,
        status,
      };

      if (alunoToEdit) {
        await alunoService.updateAluno(alunoToEdit.id, payload);
      } else {
        await alunoService.createAluno(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Ocorreu um erro ao salvar os dados do aluno.");
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
              <UserPlus size={18} />
            </div>
            <h2 className={styles.title}>
              {alunoToEdit ? "Editar Aluno" : "Novo Aluno"}
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

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Nome Completo <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Lucas Henrique Santos"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Matrícula / RA <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: RA123456"
                required
              />
            </div>
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>CPF</label>
              <input
                type="text"
                className={styles.input}
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="111.222.333-45"
                maxLength={14}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Data de Nascimento</label>
              <input
                type="date"
                className={styles.input}
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>E-mail</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: lucas@aluno.senai.br"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Telefone / WhatsApp</label>
              <input
                type="tel"
                className={styles.input}
                value={telefone}
                onChange={(e) => setTelefone(formatPhoneNumber(e.target.value))}
                placeholder="(11) 98765-4321"
                maxLength={15}
              />
            </div>
          </div>

          <div className={styles.gridRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Turma Alocada (Opcional)</label>
              <select
                className={styles.select}
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Sem turma vinculada (aguardando enturmação)</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} - {t.curso?.nome} ({t.turno})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Status do Estudante</label>
              <select
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="transferido">Transferido</option>
              </select>
            </div>
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {alunoToEdit ? "Salvar Alterações" : "Cadastrar Aluno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
