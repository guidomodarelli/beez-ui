/** Serves a genuine consumer app for browser checks against the public barrel. */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [react(), tailwind()],
  resolve: { alias: [
    { find: /^beez-ui$/, replacement: fileURLToPath(new URL("../../dist/index.js", import.meta.url)) },
    { find: "beez-ui/next", replacement: fileURLToPath(new URL("../../dist/next.js", import.meta.url)) },
  ] },
  server: { host: "127.0.0.1", port: 3108, strictPort: true },
});
