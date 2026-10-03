import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  from?: number | null;
  to?: number | null;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  perPage,
  from,
  to,
  perPageOptions = [5, 10, 20, 30, 40, 50],
  onPageChange,
  onPerPageChange,
  isLoading = false,
}: PaginationProps) {
  if (total === 0) {
    return null;
  }

  const fromDisplay = from ?? (total > 0 ? (currentPage - 1) * perPage + 1 : 0);
  const toDisplay = to ?? Math.min(currentPage * perPage, total);

  // Gera a lista de páginas com reticências inteligentes
  function getPageNumbers(): (number | string)[] {
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", lastPage];
    }

    if (currentPage >= lastPage - 3) {
      return [
        1,
        "...",
        lastPage - 4,
        lastPage - 3,
        lastPage - 2,
        lastPage - 1,
        lastPage,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      lastPage,
    ];
  }

  const pageNumbers = getPageNumbers();

  return (
    <nav className={styles.paginationContainer} aria-label="Navegação da Tabela">
      {/* Lado Esquerdo: Indicador de Linhas e Seletor por Página */}
      <div className={styles.paginationLeft}>
        <div className={styles.recordsInfo}>
          Mostrando <span className={styles.highlight}>{fromDisplay}</span> a{" "}
          <span className={styles.highlight}>{toDisplay}</span> de{" "}
          <span className={styles.highlight}>{total}</span> registros
        </div>

        {onPerPageChange && (
          <div className={styles.perPageWrapper}>
            <label htmlFor="per-page-select">Linhas por página:</label>
            <select
              id="per-page-select"
              className={styles.perPageSelect}
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              disabled={isLoading}
            >
              {perPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Lado Direito: Botões de Navegação */}
      <div className={styles.paginationRight}>
        {/* Primeira Página */}
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Primeira página"
          title="Primeira página"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Páginas Numéricas */}
        {pageNumbers.map((page, index) => {
          if (typeof page === "string") {
            return (
              <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                {page}
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              className={`${styles.pageBtn} ${isActive ? styles.active : ""}`}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Página ${page}`}
            >
              {page}
            </button>
          );
        })}

        {/* Próxima Página */}
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= lastPage || isLoading}
          aria-label="Próxima página"
          title="Próxima página"
        >
          <ChevronRight size={16} />
        </button>

        {/* Última Página */}
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(lastPage)}
          disabled={currentPage >= lastPage || isLoading}
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}
