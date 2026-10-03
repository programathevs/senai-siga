export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  all?: boolean;
  estatisticas?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: PaginationMeta;
}
