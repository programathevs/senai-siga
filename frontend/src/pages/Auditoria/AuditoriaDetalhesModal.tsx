import React, { useEffect, useState } from "react";
import {
  X,
  History,
  User as UserIcon,
  Globe,
  Clock,
  Layers,
  FileText,
  ShieldAlert,
  Code,
} from "lucide-react";
import type { AuditoriaLog } from "../../services/auditoriaService";
import styles from "./AuditoriaDetalhesModal.module.css";

interface AuditoriaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditoriaLog | null;
}

const IGNORED_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "registrado_por_id",
  "has_plano_pendente",
  "pivot",
  "remember_token",
  "password",
  "email_verified_at",
]);

const LONG_TEXT_KEYS = new Set([
  "relato_dificuldades",
  "recomendacoes_professor",
  "providencias_gestao",
  "recomendacoes_gestao",
  "outras_observacoes",
  "parecer_aqv",
  "justificativa_aluno",
  "conteudo_programatico",
  "estrategia_recuperacao",
  "criterios_avaliacao",
  "parecer_final",
  "motivo_edicao",
  "descricao",
]);

const FIELD_LABELS: Record<string, string> = {
  numero_sequencial: "Nº da FIAP / Sequencial",
  data_ocorrencia: "Data da Ocorrência",
  tipo: "Tipo de FIAP",
  status: "Status",
  motivo_edicao: "Motivo da Edição",
  relato_dificuldades: "Relato das Dificuldades",
  recomendacoes_professor: "Recomendações do Docente",
  providencias_gestao: "Providências da Coordenação/AQV",
  recomendacoes_gestao: "Recomendações da Coordenação/AQV",
  outras_observacoes: "Outras Observações",
  parecer_aqv: "Parecer da AQV",
  justificativa_aluno: "Justificativa do Aluno",
  conteudo_programatico: "Conteúdo Programático",
  estrategia_recuperacao: "Estratégia de Recuperação",
  criterios_avaliacao: "Critérios de Avaliação",
  resultado_obtido: "Resultado Obtido",
  parecer_final: "Parecer Final",
  aluno_nome: "Nome do Aluno",
  aluno_id: "ID do Aluno",
  turma_id: "ID da Turma",
  curso_id: "ID do Curso",
  unidade_curricular_id: "ID da Unidade Curricular",
  nome: "Nome",
  name: "Nome",
  email: "E-mail",
  role: "Função / Perfil",
  ativo: "Ativo",
  conceito: "Conceito / Nota",
  prazo: "Prazo",
  data_limite: "Data Limite",
  titulo: "Título",
  descricao: "Descrição",
  modulo: "Módulo",
  frequencia: "Frequência (%)",
};

const VALUE_TRANSLATIONS: Record<string, string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  enviado_aqv: "Enviada para AQV",
  aguardando_assinatura: "Aguardando Assinatura",
  assinado: "Assinado",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  professor: "Professor",
  gestor: "Gestor",
  aqv: "AQV",
  aluno: "Aluno",
  aproveitamento: "Aproveitamento",
  comportamental: "Comportamental",
};

function formatFullDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function parseJsonData(data: unknown): Record<string, any> | null {
  if (!data) return null;
  if (typeof data === "object" && !Array.isArray(data)) return data as Record<string, any>;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function formatKeyToLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatHumanValue(_key: string, val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";

  if (typeof val === "string") {
    if (VALUE_TRANSLATIONS[val]) {
      return VALUE_TRANSLATIONS[val];
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      return formatFullDate(val);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-");
      return `${d}/${m}/${y}`;
    }
    return val;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return "Nenhum";
    return val
      .map((item) => (typeof item === "object" ? JSON.stringify(item) : String(item)))
      .join(", ");
  }

  if (typeof val === "object") {
    return JSON.stringify(val);
  }

  return String(val);
}

export const AuditoriaDetalhesModal: React.FC<AuditoriaDetalhesModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const [showRawAnteriores, setShowRawAnteriores] = useState(false);
  const [showRawNovos, setShowRawNovos] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setShowRawAnteriores(false);
    setShowRawNovos(false);
  }, [log?.id, isOpen]);

  if (!isOpen || !log) return null;

  const parsedAnteriores = parseJsonData(log.dados_anteriores);
  const parsedNovos = parseJsonData(log.dados_novos);

  const renderHumanizedData = (data: Record<string, any>) => {
    const entries = Object.entries(data).filter(([key]) => !IGNORED_KEYS.has(key));

    if (entries.length === 0) {
      return (
        <div className={styles.humanizedBox}>
          <span style={{ color: "var(--color-text-secondary)", fontSize: "0.8125rem", fontStyle: "italic" }}>
            Nenhum dado relevante ou alterado.
          </span>
        </div>
      );
    }

    const regularFields = entries.filter(([key]) => !LONG_TEXT_KEYS.has(key));
    const longFields = entries.filter(([key]) => LONG_TEXT_KEYS.has(key));

    return (
      <div className={styles.humanizedBox}>
        {regularFields.length > 0 && (
          <div className={styles.fieldsGrid}>
            {regularFields.map(([key, val]) => (
              <div key={key} className={styles.fieldItem}>
                <span className={styles.fieldLabel}>
                  {FIELD_LABELS[key] || formatKeyToLabel(key)}
                </span>
                <span className={styles.fieldValue}>{formatHumanValue(key, val)}</span>
              </div>
            ))}
          </div>
        )}

        {longFields.map(([key, val]) => (
          <div key={key} className={styles.fieldFull}>
            <span className={styles.fieldLabel}>
              {FIELD_LABELS[key] || formatKeyToLabel(key)}
            </span>
            <div className={styles.fieldFullText}>{formatHumanValue(key, val)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            <div className={styles.iconBadge}>
              <History size={20} />
            </div>
            <div>
              <h2 className={styles.title}>Registro de Auditoria #{log.id}</h2>
              <p className={styles.subtitle}>{log.descricao}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar modal de auditoria"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Grid de Metadados do Evento */}
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                Data & Hora Exata
              </span>
              <span className={styles.infoValue}>{formatFullDate(log.created_at)}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <UserIcon size={12} style={{ display: "inline", marginRight: "4px" }} />
                Usuário Responsável
              </span>
              <span className={styles.infoValue}>
                {log.user?.name || "Sistema / Convidado"}
                {log.user?.role && (
                  <span className={styles.badgeRole}>{log.user.role}</span>
                )}
              </span>
              {log.user?.email && (
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  {log.user.email}
                </span>
              )}
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <Layers size={12} style={{ display: "inline", marginRight: "4px" }} />
                Entidade / Recurso
              </span>
              <span className={styles.infoValue}>
                {log.entidade} {log.entidade_id ? `(#${log.entidade_id})` : ""}
              </span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                <Globe size={12} style={{ display: "inline", marginRight: "4px" }} />
                Endereço IP & Origem
              </span>
              <span className={styles.infoValue}>{log.ip_address || "Local / Interno"}</span>
            </div>

            {log.user_agent && (
              <div className={styles.infoItem} style={{ gridColumn: "1 / -1" }}>
                <span className={styles.infoLabel}>Navegador / Dispositivo (User-Agent)</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", wordBreak: "break-all" }}>
                  {log.user_agent}
                </span>
              </div>
            )}
          </div>

          {/* Dados Anteriores e Novos (Diff / Auditoria de Conteúdo) */}
          {(log.dados_anteriores || log.dados_novos) && (
            <div className={styles.dataComparison}>
              {log.dados_anteriores && (
                <div className={styles.jsonBox}>
                  <div className={styles.jsonHeader}>
                    <div className={styles.jsonTitle}>
                      <ShieldAlert size={14} color="var(--color-warning)" />
                      <span>Dados Anteriores</span>
                    </div>
                    {parsedAnteriores && (
                      <button
                        type="button"
                        className={styles.toggleRawBtn}
                        onClick={() => setShowRawAnteriores((prev) => !prev)}
                        title="Alternar entre visualização formatada e JSON bruto"
                      >
                        <Code size={12} />
                        {showRawAnteriores ? "Ver Formatado" : "{ } Ver JSON"}
                      </button>
                    )}
                  </div>

                  {showRawAnteriores || !parsedAnteriores ? (
                    <pre className={styles.jsonPre}>
                      {typeof log.dados_anteriores === "string"
                        ? log.dados_anteriores
                        : JSON.stringify(log.dados_anteriores, null, 2)}
                    </pre>
                  ) : (
                    renderHumanizedData(parsedAnteriores)
                  )}
                </div>
              )}

              {log.dados_novos && (
                <div className={styles.jsonBox}>
                  <div className={styles.jsonHeader}>
                    <div className={styles.jsonTitle}>
                      <FileText size={14} color="var(--color-primary)" />
                      <span>Dados Novos / Atualizados</span>
                    </div>
                    {parsedNovos && (
                      <button
                        type="button"
                        className={styles.toggleRawBtn}
                        onClick={() => setShowRawNovos((prev) => !prev)}
                        title="Alternar entre visualização formatada e JSON bruto"
                      >
                        <Code size={12} />
                        {showRawNovos ? "Ver Formatado" : "{ } Ver JSON"}
                      </button>
                    )}
                  </div>

                  {showRawNovos || !parsedNovos ? (
                    <pre className={styles.jsonPre}>
                      {typeof log.dados_novos === "string"
                        ? log.dados_novos
                        : JSON.stringify(log.dados_novos, null, 2)}
                    </pre>
                  ) : (
                    renderHumanizedData(parsedNovos)
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
