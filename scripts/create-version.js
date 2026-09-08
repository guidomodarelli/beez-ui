/** @file Creates, validates and publishes a version without creating Git commits or tags. */
import { execFileSync } from "node:child_process";
import console from "node:console";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { createAndPublishRelease } from "./release-workflow.js";
import { prepareRelease } from "./prepare-release.js";

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
  const release = createAndPublishRelease(root, positionals[0], values.notes ?? [], {
    prepare: prepareRelease,
    /** Publishes the exact checked artifact, preserving interactive npm authentication. */
    publish: (archive) => execFileSync(process.execPath, [join(root, "scripts", "publish-release.js"), archive], { cwd: root, stdio: "inherit" }),
  });
  console.log(`Versión ${release.version} publicada en npm.`);
}
