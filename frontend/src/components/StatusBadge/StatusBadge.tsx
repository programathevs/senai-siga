import styles from "./StatusBadge.module.css";

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
  showDot?: boolean;
}

export interface StatusConfig {
  label: string;
  className: string;
  color: string;
  bg: string;
  dot: string;
}

export function getStatusConfig(status: string): StatusConfig {
  switch (status) {
    case "enviado_equipe_escolar":
    case "enviado_aqv":
      return {
        label: "Enviado Equipe Escolar",
        className: styles.statusEnviadoEquipeEscolar,
        color: "#7c3aed",
        bg: "color-mix(in srgb, #8b5cf6 15%, transparent)",
        dot: "#7c3aed",
      };
    case "pendente":
      return {
        label: "Pendente",
        className: styles.statusPendente,
        color: "#d97706",
        bg: "color-mix(in srgb, #f59e0b 14%, transparent)",
        dot: "#f59e0b",
      };
    case "aguardando_assinatura":
      return {
        label: "Aguardando Assinatura",
        className: styles.statusAguardandoAssinatura,
        color: "#b45309",
        bg: "color-mix(in srgb, #f59e0b 15%, transparent)",
        dot: "#d97706",
      };
    case "pdf_gerado":
      return {
        label: "PDF Gerado",
        className: styles.statusPdfGerado,
        color: "#0284c7",
        bg: "color-mix(in srgb, #0284c7 14%, transparent)",
        dot: "#0284c7",
      };
    case "impresso":
      return {
        label: "Impresso",
        className: styles.statusImpresso,
        color: "#0284c7",
        bg: "color-mix(in srgb, #0284c7 14%, transparent)",
        dot: "#0284c7",
      };
    case "assinado":
    case "ativo":
      return {
        label: status === "ativo" ? "Ativo" : "Assinado",
        className: styles.statusAssinado,
        color: "#059669",
        bg: "color-mix(in srgb, #10b981 14%, transparent)",
        dot: "#10b981",
      };
    case "inativo":
      return {
        label: "Inativo",
        className: styles.statusDefault,
        color: "var(--color-text-secondary, #64748b)",
        bg: "color-mix(in srgb, var(--color-border) 40%, transparent)",
        dot: "var(--color-text-secondary, #64748b)",
      };
    case "transferido":
      return {
        label: "Transferido",
        className: styles.statusPendente,
        color: "#d97706",
        bg: "color-mix(in srgb, #f59e0b 14%, transparent)",
        dot: "#f59e0b",
      };
    case "excluida":
    case "excluido":
      return {
        label: "Excluída",
        className: styles.statusExcluido,
        color: "#dc2626",
        bg: "color-mix(in srgb, #ef4444 14%, transparent)",
        dot: "#ef4444",
      };
    default:
      return {
        label: status,
        className: styles.statusDefault,
        color: "var(--color-text-secondary, #64748b)",
        bg: "var(--color-surface, #f8fafc)",
        dot: "var(--color-text-secondary, #64748b)",
      };
  }
}

export function StatusBadge({ status, label, className = "", showDot = false }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const text = label || config.label;

  return (
    <span className={`${styles.badge} ${config.className} ${className}`}>
      {showDot && <span className={styles.dot} style={{ backgroundColor: config.dot }} />}
      {text}
    </span>
  );
}

export default StatusBadge;
