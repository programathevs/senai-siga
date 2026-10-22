import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./index.css";

// Desativa a alteração acidental de valores em inputs numéricos ao rolar o scroll do mouse
document.addEventListener(
  "wheel",
  () => {
    if (
      document.activeElement instanceof HTMLInputElement &&
      document.activeElement.type === "number"
    ) {
      document.activeElement.blur();
    }
  },
  { passive: true }
);

// React.StrictMode foi desativado para evitar montagem duplicada e chamadas HTTP repetidas em desenvolvimento
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </ThemeProvider>,
);

