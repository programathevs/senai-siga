import { useState } from "react";
import { Trash2, AlertTriangle, UserMinus, X, Loader2 } from "lucide-react";
import styles from "./ConfirmModal.module.css";

export interface ConfirmModalDetail {
  label: string;
  value: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  subtitle?: string;
  description?: string;
  itemDetails?: ConfirmModalDetail[];
  warningText?: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  icon?: "trash" | "warning" | "user-minus";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  itemDetails,
  warningText,
  confirmLabel = "Confirmar",
  confirmVariant = "danger",
  icon = "trash",
}: ConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Erros tratados pelo componente chamador
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerClass =
    confirmVariant === "danger"
      ? styles.headerDanger
      : confirmVariant === "warning"
        ? styles.headerWarning
        : styles.headerPrimary;

  const iconCircleClass =
    confirmVariant === "danger"
      ? styles.iconDanger
      : confirmVariant === "warning"
        ? styles.iconWarning
        : styles.iconPrimary;

  const confirmBtnClass =
    confirmVariant === "danger"
      ? styles.btnConfirmDanger
      : confirmVariant === "warning"
        ? styles.btnConfirmWarning
        : styles.btnConfirmPrimary;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className={`${styles.header} ${headerClass}`}>
          <div className={styles.headerTitleGroup}>
            <div className={`${styles.iconCircle} ${iconCircleClass}`}>
              {icon === "trash" && <Trash2 size={22} />}
              {icon === "warning" && <AlertTriangle size={22} />}
              {icon === "user-minus" && <UserMinus size={22} />}
            </div>
            <div>
              <h3 className={styles.title}>{title}</h3>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className={styles.body}>
          {description && <p className={styles.description}>{description}</p>}

          {itemDetails && itemDetails.length > 0 && (
            <div className={styles.summaryCard}>
              {itemDetails.map((detail, idx) => (
                <div key={idx} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{detail.label}</span>
                  <span className={styles.summaryValue}>{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          {warningText && (
            <div
              className={`${styles.warningBox} ${
                confirmVariant === "warning" ? styles.warningBoxAmber : ""
              }`}
            >
              <AlertTriangle
                size={18}
                className={
                  confirmVariant === "warning"
                    ? styles.warningIconAmber
                    : styles.warningIcon
                }
              />
              <div className={styles.warningText}>
                <p>{warningText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={`${styles.btnConfirm} ${confirmBtnClass}`}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {icon === "trash" && <Trash2 size={16} />}
                {icon === "user-minus" && <UserMinus size={16} />}
                {icon === "warning" && <AlertTriangle size={16} />}
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
