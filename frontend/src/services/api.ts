import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// Cache em memória para requisições GET (evita recarregamentos contínuos ao trocar de tela)
interface CacheRecord {
  data: any;
  status: number;
  statusText: string;
  headers: any;
  timestamp: number;
}

const apiCache = new Map<string, CacheRecord>();
const CACHE_TTL_MS = 60 * 1000; // 60 segundos de retenção em memória

// Endpoints que nunca devem ser servidos do cache
const BYPASS_CACHE_URLS = [
  "/sanctum/csrf-cookie",
  "/api/auth/me",
  "/api/auth/login",
  "/api/auth/logout",
];

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(prefix)) {
      apiCache.delete(key);
    }
  }
}

// Configura adapter com cache inteligente
const defaultAdapter = axios.getAdapter(axios.defaults.adapter);

api.defaults.adapter = async (config) => {
  const method = (config.method || "get").toLowerCase();
  const isGet = method === "get";
  const url = config.url || "";

  // Requisições de mutação (POST, PUT, PATCH, DELETE) limpam o cache imediatamente
  if (!isGet) {
    clearApiCache();
    return defaultAdapter(config);
  }

  // Verifica se endpoint deve ignorar o cache
  const shouldBypass =
    Boolean(config.headers?.["x-no-cache"]) ||
    BYPASS_CACHE_URLS.some((bypass) => url.includes(bypass));

  if (shouldBypass) {
    return defaultAdapter(config);
  }

  // Chave única para o cache baseada em URL e parâmetros de busca
  const cacheKey = `${url}?${JSON.stringify(config.params || {})}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers,
      config,
      request: {},
    };
  }

  const response = await defaultAdapter(config);

  if (response.status >= 200 && response.status < 300) {
    apiCache.set(cacheKey, {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      timestamp: Date.now(),
    });
  }

  return response;
};
