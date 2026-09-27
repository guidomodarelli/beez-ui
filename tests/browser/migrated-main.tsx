/** Mounts product components that depend on real CSS animations or browser APIs in a plain React consumer. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BeezUIProvider, BouncingDotsLoader, Button, copyTextToClipboard } from "beez-ui";
import "./styles.css";

const CLIPBOARD_TEXT = "https://example.com/invitacion";

/** Groups the examples whose behavior jsdom cannot reproduce. */
function MigratedExample() {
  const [copyResult, setCopyResult] = useState("");

  return (
    <main>
      <h1>Componentes de producto</h1>
      <section aria-label="Cargadores">
        <BouncingDotsLoader label="Cargando panel" />
        <BouncingDotsLoader label="Cargando fila" size="sm" />
      </section>
      <section className="controls" aria-label="Portapapeles">
        <Button type="button" onClick={() => void copyTextToClipboard(CLIPBOARD_TEXT).then((isCopied) => setCopyResult(isCopied ? "Copiado" : "No se pudo copiar"))}>
          Copiar invitación
        </Button>
        <output aria-label="Resultado de copia">{copyResult}</output>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <BeezUIProvider>
    <MigratedExample />
  </BeezUIProvider>,
);
