/** @file Creates a version and prepares its validated tarball without Git changes or publication. */
import { execFileSync } from "node:child_process";
import console from "node:console";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createReleaseVersion } from "./release-version.js";

/** Anchors version changes to this repository rather than the caller's working directory. */
const root = fileURLToPath(new URL("../", import.meta.url));
/** Documents the required version target and optional, repeatable release notes. */
const USAGE = 'pnpm run create-version <patch|minor|major|VERSION> [--notes "Descripción del cambio"] [--notes "Otro cambio"]';
const { values, positionals } = parseArgs({
  options: { notes: { type: "string", multiple: true, short: "n" }, help: { type: "boolean", short: "h" } },
  allowPositionals: true,
});

if (values.help) {
  console.log(USAGE);
} else {
  if (positionals.length !== 1) throw new Error(`create-version: ${USAGE}`);
  const version = createReleaseVersion(root, positionals[0], values.notes ?? []);
  console.log(`Versión ${version} creada. Preparando el artefacto validado…`);
  try {
    execFileSync(process.execPath, [join(root, "scripts", "prepare-release.js")], { cwd: root, stdio: "inherit" });
  } catch (error) {
    throw new Error(`create-version: ${version} metadata is ready, but preparation failed; fix the reported issue and run pnpm release:prepare`, { cause: error });
  }
}
