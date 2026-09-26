/* Minimal worker for the PWA update test: it waits while an older worker controls the page and
   activates only when PwaUpdateControl asks it to. The version travels in the script URL. */
self.addEventListener("install", () => {});
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
