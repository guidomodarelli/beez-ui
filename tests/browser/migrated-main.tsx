/** Mounts product helpers that depend on real browser APIs in a plain React consumer. */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BeezUIProvider, Button, FileUploadItem, FileUploadList, copyTextToClipboard } from "beez-ui";
import "./styles.css";

const CLIPBOARD_TEXT = "https://example.com/invitacion";

/** Groups the examples whose behavior jsdom cannot reproduce, such as the clipboard. */
function MigratedExample() {
  const [copyResult, setCopyResult] = useState("");

  return (
    <main>
      <h1>Componentes de producto</h1>
      <section className="controls" aria-label="Portapapeles">
        <Button type="button" onClick={() => void copyTextToClipboard(CLIPBOARD_TEXT).then((isCopied) => setCopyResult(isCopied ? "Copiado" : "No se pudo copiar"))}>
          Copiar invitación
        </Button>
        <output aria-label="Resultado de copia">{copyResult}</output>
      </section>
      <section aria-label="Archivos">
        <FileUploadList>
          <FileUploadItem name="recibo.pdf" size={1024} progress={50} progressVariant="fill" />
        </FileUploadList>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <BeezUIProvider>
    <MigratedExample />
  </BeezUIProvider>,
);
