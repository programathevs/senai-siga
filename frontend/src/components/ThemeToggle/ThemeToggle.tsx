import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import styles from "./ThemeToggle.module.css";

interface ThemeToggleProps {
  variant?: "header" | "floating";
  className?: string;
}

export function ThemeToggle({ variant = "header", className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const label = isDark ? "Alternar para tema claro" : "Alternar para tema escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${styles.toggleBtn} ${variant === "floating" ? styles.floating : ""} ${className}`}
      aria-label={label}
      title={label}
    >
      <div className={styles.iconWrapper} aria-hidden="true">
        <Sun className={`${styles.icon} ${styles.sunIcon}`} size={18} />
        <Moon className={`${styles.icon} ${styles.moonIcon}`} size={18} />
      </div>
    </button>
  );
}
