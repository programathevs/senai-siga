import { Loader2 } from "lucide-react";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.spinnerWrapper}>
          <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
          <div className={styles.textWrapper}>
            <span className={styles.text}>Carregando SENAI SIGA</span>
            <span className={styles.subtext}>Sistema Interno de Gestão de Advertências</span>
          </div>
        </div>
      </div>
    </div>
  );
}
