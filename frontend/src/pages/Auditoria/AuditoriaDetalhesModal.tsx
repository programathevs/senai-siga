import React, { useEffect } from "react";
import {
  X,
  History,
  User as UserIcon,
  Globe,
  Clock,
  Layers,
  FileText,
  ShieldAlert,
} from "lucide-react";
import type { AuditoriaLog } from "../../services/auditoriaService";
import styles from "./AuditoriaDetalhesModal.module.css";

interface AuditoriaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditoriaLog | null;
}

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

export const AuditoriaDetalhesModal: React.FC<AuditoriaDetalhesModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
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

  if (!isOpen || !log) return null;

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
                  <div className={styles.jsonTitle}>
                    <ShieldAlert size={14} color="var(--color-warning)" />
                    <span>Dados Anteriores</span>
                  </div>
                  <pre className={styles.jsonPre}>
                    {JSON.stringify(log.dados_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {log.dados_novos && (
                <div className={styles.jsonBox}>
                  <div className={styles.jsonTitle}>
                    <FileText size={14} color="var(--color-primary)" />
                    <span>Dados Novos / Atualizados</span>
                  </div>
                  <pre className={styles.jsonPre}>
                    {JSON.stringify(log.dados_novos, null, 2)}
                  </pre>
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
