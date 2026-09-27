/**
 * Utilitários de formatação e máscaras para a aplicação SENAI SIGA.
 */

/**
 * Aplica máscara de telefone brasileiro dinamicamente:
 * - Celular com 9 dígitos: (11) 98765-4321
 * - Fixo com 8 dígitos: (11) 3456-7890
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}
