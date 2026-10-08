import { useState } from "react";
import {
  User,
  ShieldCheck,
  Building2,
  KeyRound,
  CheckCircle2,
  Save,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { AlterarSenhaModal } from "../../components/AlterarSenhaModal/AlterarSenhaModal";
import styles from "./Configuracoes.module.css";

export function Configuracoes() {
  const { user } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isAlterarSenhaModalOpen, setIsAlterarSenhaModalOpen] = useState(false);

  const roleText =
    user?.role === "gestor"
      ? "Gestão Escolar & Direção"
      : user?.role === "aqv"
      ? "Apoio e Qualidade de Vida (AQV)"
      : "Docente / Instrutor Acadêmico";

  function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  }

  return (
    <>
      <div className={styles.container}>
        {/* Cabeçalho da Página */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Configurações do Sistema</h1>
            <p className={styles.subtitle}>
              Gerencie suas informações de conta e parâmetros do SENAI SIGA
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className={styles.alertSuccess} role="alert">
            <CheckCircle2 size={18} />
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSavePreferences} className={styles.contentGrid}>
          {/* Seção 1: Dados do Perfil */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <User size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Meu Perfil &amp; Credenciais</h2>
                <p className={styles.cardSubtitle}>Informações vinculadas à sua conta institucional</p>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome Completo</label>
                <input
                  type="text"
                  className={styles.input}
                  value={user?.name || ""}
                  disabled
                  readOnly
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>E-mail Institucional</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={user?.email || ""}
                    disabled
                    readOnly
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Perfil de Acesso (RBAC)</label>
                  <div className={styles.roleBadgeWrapper}>
                    <ShieldCheck size={16} color="var(--color-primary)" />
                    <span className={styles.roleText}>{roleText}</span>
                  </div>
                </div>
              </div>

              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsAlterarSenhaModalOpen(true)}
                >
                  <KeyRound size={16} />
                  <span>Alterar Senha de Acesso</span>
                </button>
              </div>
            </div>
          </div>

          {/* Unidade Escolar */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Building2 size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Unidade Escolar &amp; Diretrizes</h2>
                <p className={styles.cardSubtitle}>Parâmetros institucionais do SENAI SP</p>
              </div>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Unidade Escolar Vinculada</label>
                  <input
                    type="text"
                    className={styles.input}
                    value='Escola SENAI "Dr. Celso Charuri"'
                    disabled
                    readOnly
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Regulamento Disciplinar</label>
                  <input
                    type="text"
                    className={styles.input}
                    value="Regimento Comum das Escolas SENAI-SP (2026)"
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Salvar */}
          <div className={styles.footerActions}>
            <button type="submit" className={styles.btnPrimary}>
              <Save size={18} />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>

      <AlterarSenhaModal
        isOpen={isAlterarSenhaModalOpen}
        onClose={() => setIsAlterarSenhaModalOpen(false)}
      />
    </>
  );
}


