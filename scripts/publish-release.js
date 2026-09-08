/** @file Publishes an explicitly selected, checksum-verified archive using environment credentials. */
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { ownedPath } from "./owned-path.js";
import { validatePackageContents, validateReleaseMetadata } from "./release-checks.js";

/** Restricts publication to artifacts prepared in this repository. */
const root = fileURLToPath(new URL("../", import.meta.url));
const requested = process.argv[2];
if (!requested || process.argv.length !== 3) throw new Error("release: use pnpm release:publish releases/<version>-<sha256>/beez-ui-<version>.tgz");
const archivePath = ownedPath(root, resolve(root, requested));
const relativeArchive = relative(root, archivePath).replaceAll("\\", "/");
// Only this verified path enters the shell command; credentials never enter command text.
if (!/^releases\/[0-9A-Za-z.+-]+\/beez-ui-[0-9A-Za-z.+-]+\.tgz$/u.test(relativeArchive)) throw new Error("release: archive must be inside a prepared releases directory");
const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
validateReleaseMetadata(metadata, readFileSync(join(root, "CHANGELOG.md"), "utf8"));
const digest = createHash("sha256").update(readFileSync(archivePath)).digest("hex");
if (basename(dirname(archivePath)) !== `${metadata.version}-${digest}`) throw new Error("release: artifact checksum or version differs from the prepared directory");
const entries = execFileSync("tar", ["-tf", archivePath], { encoding: "utf8" }).trim().split(/\r?\n/u);
validatePackageContents(metadata, entries);
const packed = JSON.parse(execFileSync("tar", ["-xOf", archivePath, "package/package.json"], { encoding: "utf8" }));
if (packed.name !== metadata.name || packed.version !== metadata.version) throw new Error("release: packed metadata does not match the current release");
if (!process.env.NPM_TOKEN && existsSync(join(root, ".env"))) process.loadEnvFile(join(root, ".env"));
if (!process.env.NPM_TOKEN) throw new Error("release: provide NPM_TOKEN through the environment or the ignored .env file");
execSync(`pnpm publish ${relativeArchive} --access public`, { cwd: root, env: process.env, stdio: "inherit" });
