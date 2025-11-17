import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App";
import { SorobanProvider } from "./context/SorobanContext";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SorobanProvider>
        <App />
      </SorobanProvider>
    </ThemeProvider>
  </StrictMode>,
);
