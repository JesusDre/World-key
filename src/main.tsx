import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { SorobanProvider } from "./context/SorobanContext";
import "./styles/globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId}>
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SorobanProvider>
          <App />
        </SorobanProvider>
      </ThemeProvider>
    </StrictMode>
  </GoogleOAuthProvider>,
);
