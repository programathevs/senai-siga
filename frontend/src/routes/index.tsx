import { createBrowserRouter } from "react-router";

import { Login } from "../pages/Login/Login";
import { Dashboard } from "../pages/Dashboard/Dashboard";
import { DashboardLayout } from "../layouts/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/",
    element: <DashboardLayout />,

    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
]);
