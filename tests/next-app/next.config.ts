/** Resolves the actual package exports and shared styles from the repository root. */
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: { root: fileURLToPath(new URL("../../", import.meta.url)) },
  experimental: { optimizePackageImports: ["beez-ui"] },
};
export default config;
