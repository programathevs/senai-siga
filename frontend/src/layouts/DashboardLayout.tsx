import { Outlet } from "react-router";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";

export function DashboardLayout() {
  return (
    <div className="app">
      <Header />

      <div className="app-content">
        <Sidebar />

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
