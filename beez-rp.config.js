/**
 * @file Configuration of `beez-rp create-version` (`pnpm create-version`, alias `pnpm cv`) for beez-ui.
 *
 * The shared command diagnoses the repository, fills an empty `[Unreleased]`
 * with Codex, bumps the version (commit `X.Y.Z` + annotated tag `vX.Y.Z`),
 * prepares, pushes `main` and the tag atomically and publishes. beez-ui
 * prepares and publishes a checksum-verified tarball through
 * `scripts/release-hooks.js`; there are no separate checks because
 * `release:prepare` already runs the full validation on the version commit.
 */
import { prepareReleaseArtifact, publishReleaseArtifact } from "./scripts/release-hooks.js";

/** @type {import("beez-rp/create-version").CreateVersionConfig} */
export default {
  projectName: "beez-ui",
  changelog: { audience: "quien consume el paquete beez-ui", language: "es" },
  releaseTypeDescriptions: {
    patch: "Solo arreglos o cambios internos; nada nuevo para quien consume el paquete.",
    minor: "Funcionalidades nuevas compatibles; lo existente sigue funcionando igual.",
    major: "Cambios incompatibles: quien consume el paquete tiene que adaptar su código.",
  },
  registry: "npm",
  prepare: prepareReleaseArtifact,
  publish: publishReleaseArtifact,
  summary: ["Consumidores: pnpm add beez-ui@^{version}"],
};
