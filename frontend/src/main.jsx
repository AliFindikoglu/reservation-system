import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import "./styles/Theme.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />

      <Toaster
        position="top-right"
        gutter={12}
        toastOptions={{
          duration: 3000,

          style: {
            borderRadius: "18px",
            padding: "16px 18px",
            background: "#ffffff",
            color: "#374151",
            border: "1px solid #fde68a",
            boxShadow: "0 10px 30px rgba(0,0,0,.12)",
            fontSize: "15px",
            fontWeight: "500",
          },

          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#fff",
            },
          },

          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fff",
            },
          },
        }}
      />
    </AuthProvider>
  </StrictMode>
);
