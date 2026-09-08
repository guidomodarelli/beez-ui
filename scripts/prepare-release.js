/** @file Prepares a checked, content-addressed release without publishing or changing Git. */
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import console from "node:console";
import { ownedPath } from "./owned-path.js";
import { validatePackageContents, validateReleaseMetadata } from "./release-checks.js";

/** Keeps all generated release paths under their owning repository. */
const root = fileURLToPath(new URL("../", import.meta.url));
const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
validateReleaseMetadata(metadata, readFileSync(join(root, "CHANGELOG.md"), "utf8"));
for (const command of ["pnpm install --frozen-lockfile", "pnpm check", "pnpm exec playwright test"]) {
  execSync(command, { cwd: root, stdio: "inherit" });
}
const releases = ownedPath(root, join(root, "releases"));
mkdirSync(releases, { recursive: true });
const staging = mkdtempSync(join(releases, "prepare-"));
try {
  // The only interpolation is an owned, generated alphanumeric directory name.
  execSync(`pnpm --ignore-scripts pack --pack-destination releases/${basename(staging)}`, { cwd: root, stdio: "inherit" });
  const archive = readdirSync(staging).find(file => file.endsWith(".tgz"));
  if (!archive) throw new Error("release: pnpm pack did not produce an archive");
  const archivePath = join(staging, archive);
  const entries = execFileSync("tar", ["-tf", archivePath], { encoding: "utf8" }).trim().split(/\r?\n/u);
  validatePackageContents(metadata, entries);
  const packed = JSON.parse(execFileSync("tar", ["-xOf", archivePath, "package/package.json"], { encoding: "utf8" }));
  if (packed.name !== metadata.name || packed.version !== metadata.version) throw new Error("release: packed metadata differs from the checked manifest");
  const digest = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
  const destination = ownedPath(root, join(releases, `${metadata.version}-${digest}`));
  if (!existsSync(destination)) renameSync(staging, destination);
  else if (createHash("sha256").update(readFileSync(join(destination, archive))).digest("hex") !== digest) throw new Error("release: existing artifact checksum does not match");
  console.log(`Prepared ${join(destination, archive)}\nSHA256 ${digest}\nNo commit, tag, or publication was performed.`);
} finally {
  if (existsSync(staging)) rmSync(ownedPath(root, staging), { recursive: true, force: true });
}
