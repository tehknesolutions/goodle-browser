import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AplicacaoGoodle } from "./aplicacao/AplicacaoGoodle";
import "./estilos.css";

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <AplicacaoGoodle />
  </StrictMode>,
);