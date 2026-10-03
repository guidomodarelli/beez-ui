/**
 * @file Configuration of `beez-rp create-version` (`pnpm create-version`, alias `pnpm cv`) for beez-ui.
 *
 * The shared command diagnoses the repository, fills an empty `[Unreleased]`
 * with Codex, bumps the version (commit `X.Y.Z` + annotated tag `vX.Y.Z`),
 * prepares, pushes `main` and the tag atomically and publishes. beez-ui
 * prepares a checksum-addressed tarball through `scripts/release-hooks.js`;
 * the engine verifies that exact tarball (SHA-256 and contents) and publishes
 * it to GitHub Packages with `NPM_TOKEN`. There are no separate checks because
 * `release:prepare` already runs the full validation on the version commit.
 */
import { prepareReleaseArtifact } from "./scripts/release-hooks.js";

/** @type {import("beez-rp/create-version").CreateVersionConfig} */
export default {
  projectName: "@guidomodarelli/beez-ui",
  changelog: { audience: "quien consume el paquete beez-ui", language: "es" },
  releaseTypeDescriptions: {
    patch: "Solo arreglos o cambios internos; nada nuevo para quien consume el paquete.",
    minor: "Funcionalidades nuevas compatibles; lo existente sigue funcionando igual.",
    major: "Cambios incompatibles: quien consume el paquete tiene que adaptar su código.",
  },
  // release:prepare already runs the full validation on the version commit, so it is not repeated before the bump.
  checks: false,
  prepare: prepareReleaseArtifact,
  publish: "npm",
  artifact: "releases/{version}-{sha256}/{name}-{version}.tgz",
  summary: ["Consumidores: pnpm add @guidomodarelli/beez-ui@^{version}"],
};
