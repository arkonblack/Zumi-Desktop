import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/themes.css";
import "./styles/globals.css";

const root = document.getElementById("root") as HTMLElement;
const isBubble = new URLSearchParams(window.location.search).has("bubble");

if (isBubble) {
  // Estilos del bubble aplicados via JS para no contaminar la ventana principal
  document.documentElement.style.cssText = "background:transparent;overflow:hidden;";
  document.body.style.cssText = "background:transparent;overflow:hidden;width:72px;height:72px;margin:0;padding:0;display:flex;align-items:center;justify-content:center;";
  root.style.cssText = "background:transparent;width:72px;height:72px;flex:none;";

  // Importación dinámica para aislar el componente Bubble
  import("./components/Bubble/Bubble").then(({ default: Bubble }) => {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <Bubble />
      </React.StrictMode>
    );
  });
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
