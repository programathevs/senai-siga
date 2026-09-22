import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";

export type UserRole = "admin" | "instrutor" | "aqv";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  deve_trocar_senha: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se o usuário já possui sessão ativa ao carregar a página
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await api.get<{ data: User }>("/api/me");
        setUser(response.data.data);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  async function login(credentials: LoginCredentials): Promise<User> {
    // 1. Obtém o token CSRF do Laravel Sanctum
    await api.get("/sanctum/csrf-cookie");

    // 2. Efetua a tentativa de login via sessão
    const response = await api.post<{ data: User }>("/api/login", credentials);
    const loggedUser = response.data.data;

    setUser(loggedUser);
    return loggedUser;
  }

  async function logout(): Promise<void> {
    try {
      await api.post("/api/logout");
    } finally {
      setUser(null);
    }
  }

  function updateUser(updatedData: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um <AuthProvider />");
  }

  return context;
}
