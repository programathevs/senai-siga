import { Loader2 } from "lucide-react";
import senaiLogo from "../../assets/senai-logo.jpg";
import styles from "./LoadingScreen.module.css";

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img src={senaiLogo} alt="SENAI" className={styles.logo} />
        <div className={styles.spinnerWrapper}>
          <Loader2 size={24} className="animate-spin" color="var(--color-primary)" />
          <span className={styles.text}>Carregando SENAI SIGA...</span>
        </div>
      </div>
    </div>
  );
}
