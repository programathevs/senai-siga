import React, { useState, useEffect } from "react";
import { X, FileText, AlertTriangle, ShieldCheck, Loader2, Phone, Mail, Calendar } from "lucide-react";
import { alunoService, type AlunoHistorico } from "../../services/alunoService";
import { formatPhoneNumber, formatCpf } from "../../utils/formatters";
import styles from "./AlunoHistoricoModal.module.css";

interface AlunoHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  alunoId: number | null;
}

export const AlunoHistoricoModal: React.FC<AlunoHistoricoModalProps> = ({
  isOpen,
  onClose,
  alunoId,
}) => {
  const [data, setData] = useState<AlunoHistorico | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && alunoId) {
      setIsLoading(true);
      alunoService
        .getHistorico(alunoId)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, alunoId]);

  if (!isOpen || !alunoId) return null;

  const aluno = data?.aluno;
  const initial = (aluno?.nome || "A").charAt(0).toUpperCase();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <FileText size={18} />
            </div>
            <div>
              <h2 className={styles.title}>Ficha & Histórico Disciplinar</h2>
              <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                Acompanhamento individual de ocorrências, faltas e planos de recuperação.
              </p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className={styles.body}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <Loader2 size={32} className="animate-spin" />
              <p>Carregando histórico do estudante...</p>
            </div>
          ) : !aluno ? (
            <div className={styles.emptyState}>
              <AlertTriangle size={36} color="var(--color-danger)" />
              <p>Não foi possível carregar a ficha deste aluno.</p>
            </div>
          ) : (
            <>
              {/* Card com os dados do estudante */}
              <div className={styles.profileCard}>
                <div className={styles.avatarBig}>{initial}</div>
                <div className={styles.profileDetails}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h3 className={styles.alunoNome}>{aluno.nome}</h3>
                    <div className={styles.profileBadges}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)", color: "var(--color-primary)" }}>
                        RA: {aluno.matricula}
                      </span>
                      {aluno.turma ? (
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", backgroundColor: "color-mix(in srgb, var(--color-border) 40%, transparent)", color: "var(--color-text-primary)" }}>
                          Turma: {aluno.turma.nome} ({aluno.turma.curso?.nome || "Curso"})
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", fontStyle: "italic", padding: "0.2rem 0.6rem", borderRadius: "var(--radius)", backgroundColor: "color-mix(in srgb, var(--color-border) 30%, transparent)", color: "var(--color-text-secondary)" }}>
                          Sem turma vinculada
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.profileInfoGrid}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Phone size={13} />
                      {aluno.telefone ? formatPhoneNumber(aluno.telefone) : "Telefone não informado"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Mail size={13} />
                      {aluno.email || "E-mail não informado"}
                    </span>
                    {aluno.data_nascimento && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Calendar size={13} />
                        Nascimento: {new Date(aluno.data_nascimento).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {aluno.cpf && (
                      <span>CPF: {formatCpf(aluno.cpf)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* KPIs de Desempenho Disciplinar */}
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <p className={styles.kpiValue} style={{ color: "#3b82f6" }}>
                    {data?.estatisticas?.total_ocorrencias || 0}
                  </p>
                  <p className={styles.kpiLabel}>Ocorrências Registradas</p>
                </div>

                <div className={styles.kpiCard}>
                  <p className={styles.kpiValue} style={{ color: "#f59e0b" }}>
                    {data?.estatisticas?.total_faltas || 0}h
                  </p>
                  <p className={styles.kpiLabel}>Faltas Acumuladas</p>
                </div>

                <div className={styles.kpiCard}>
                  <p className={styles.kpiValue} style={{ color: "#10b981" }}>
                    {data?.estatisticas?.planos_recuperacao_ativos || 0}
                  </p>
                  <p className={styles.kpiLabel}>Planos de Recuperação</p>
                </div>
              </div>

              {/* Linha do Tempo / Histórico de FIAPs */}
              <div className={styles.historySection}>
                <h4 className={styles.historyTitle}>Histórico de Advertências e Acolhimento</h4>

                {(!data?.ocorrencias || data.ocorrencias.length === 0) ? (
                  <div className={styles.emptyState}>
                    <ShieldCheck size={36} color="#10b981" />
                    <strong>Situação Disciplinar Regular</strong>
                    <p style={{ margin: 0, fontSize: "0.8125rem" }}>
                      Nenhuma advertência, ocorrência ou encaminhamento disciplinar registrado para este aluno.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Lista de ocorrências preenchida no módulo de Ocorrências */}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.closeFooterBtn} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
