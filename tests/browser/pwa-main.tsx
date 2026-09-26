/** Registers a versioned service worker and mounts the update control, like an installed PWA would. */
import { createRoot } from "react-dom/client";
import { PwaUpdateControl } from "beez-ui";
import "./styles.css";

/** The worker version comes from the page URL, so the test can publish a new one by navigating. */
const workerVersion = new URLSearchParams(window.location.search).get("version") ?? "1";

if ("serviceWorker" in navigator) {
  void navigator.serviceWorker.register(`/sw-update.js?version=${workerVersion}`);
}

createRoot(document.getElementById("root")!).render(
  <main>
    <h1>Actualización PWA</h1>
    <PwaUpdateControl />
  </main>,
);
