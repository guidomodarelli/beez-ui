/**
 * @module release-hooks `prepare` hook of `beez-rp create-version` for beez-ui.
 *
 * The shared command bumps the version (commit `X.Y.Z` + tag `vX.Y.Z`) and
 * then calls `prepareReleaseArtifact` on that commit: it reuses the tarball
 * already prepared for the version when it is newer than the last code change,
 * or runs `pnpm release:prepare` (full validation + checksum-addressed tarball)
 * and locates the tarball it just produced. Publishing that exact tarball,
 * with its checksum and contents verified again, is done by the engine
 * (`publish: "npm"` + `artifact` in `beez-rp.config.js`).
 *
 * The hook receives every helper through the engine context, so this module
 * never imports `beez-rp`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Directory where `release:prepare` stores `<version>-<sha256>/<name>-<version>.tgz`. */
const RELEASES_DIRECTORY = "releases";
/** Release metadata written by the version commit; changing them does not invalidate a tarball. */
const RELEASE_METADATA_FILES = ["package.json", "CHANGELOG.md"];
/** Validates, builds and packs the current version into `releases/`. */
const PREPARE_COMMAND = "pnpm release:prepare";
/** Converts file modification times (ms) to Git commit timestamps (s). */
const MILLISECONDS_PER_SECOND = 1000;
/** Prepared directory name: exact version plus the SHA-256 of its tarball. */
const PREPARED_DIRECTORY_SUFFIX = /^-[0-9a-f]{64}$/u;

/**
 * @typedef {{
 *   repositoryRoot: string,
 *   version: string | null,
 *   git: { tryGit: (gitArguments: string[]) => Promise<string | null> },
 *   run: (commandLine: string) => Promise<number>,
 *   print: (text?: string) => void,
 *   fail: (message: string, hint: string) => never,
 * }} ReleaseHookContext
 *   Subset of the `beez-rp/create-version` `HookContext` these hooks use.
 */

/**
 * Finds the newest tarball `release:prepare` produced for a version.
 * @param {string} repositoryRoot - Repository root.
 * @param {string} packageName - Unscoped package name, used in the tarball file name.
 * @param {string} version - Released version.
 * @returns {string | null} Archive path relative to the root, with `/` separators, or `null` when none exists.
 */
export function findPreparedArchive(repositoryRoot, packageName, version) {
  const releasesPath = join(repositoryRoot, RELEASES_DIRECTORY);
  if (!existsSync(releasesPath)) return null;
  const archiveName = `${packageName}-${version}.tgz`;
  const candidates = readdirSync(releasesPath)
    .filter((directory) => directory.startsWith(version) && PREPARED_DIRECTORY_SUFFIX.test(directory.slice(version.length)))
    .map((directory) => join(releasesPath, directory, archiveName))
    .filter((archivePath) => existsSync(archivePath))
    .map((archivePath) => ({ archivePath, modifiedAt: statSync(archivePath).mtimeMs }))
    .sort((left, right) => right.modifiedAt - left.modifiedAt);
  const newest = candidates[0];
  if (!newest) return null;
  return relative(repositoryRoot, newest.archivePath).replaceAll("\\", "/");
}

/**
 * Reads the package name from the manifest of the repository.
 * @param {string} repositoryRoot - Repository root.
 * @returns {string} Package name.
 */
function readPackageName(repositoryRoot) {
  return JSON.parse(readFileSync(join(repositoryRoot, "package.json"), "utf8")).name;
}

/**
 * Returns the version the engine is releasing, failing the step when it is unknown.
 * @param {ReleaseHookContext} context - Hook context.
 * @returns {string} Version.
 */
function requireVersion(context) {
  if (!context.version) {
    return context.fail("release-hooks: no se recibió la versión a publicar.", "Revisá package.json y volvé a correr pnpm create-version.");
  }
  return context.version;
}

/**
 * Tells whether a prepared tarball is newer than the last commit that changed code.
 * The version commit only touches release metadata, so it never invalidates a tarball.
 * @param {ReleaseHookContext} context - Hook context.
 * @param {string} archive - Archive path relative to the root.
 * @returns {Promise<boolean>} Whether the tarball can be reused.
 */
async function isPreparedArchiveCurrent(context, archive) {
  const lastCodeChange = await context.git.tryGit([
    "log",
    "-1",
    "--format=%ct",
    "--",
    ".",
    ...RELEASE_METADATA_FILES.map((file) => `:(exclude)${file}`),
  ]);
  const archiveModifiedAt = statSync(join(context.repositoryRoot, archive)).mtimeMs / MILLISECONDS_PER_SECOND;
  return archiveModifiedAt > Number(lastCodeChange ?? 0);
}

/**
 * `prepare` hook: reuses a current tarball of the version or prepares a new one.
 * @param {ReleaseHookContext} context - Hook context.
 * @returns {Promise<void>}
 */
export async function prepareReleaseArtifact(context) {
  const version = requireVersion(context);
  const packageName = readPackageName(context.repositoryRoot);
  const existing = findPreparedArchive(context.repositoryRoot, packageName, version);

  if (existing && (await isPreparedArchiveCurrent(context, existing))) {
    context.print(`Se reusa ${existing}: es posterior al último cambio de código (la publicación vuelve a verificar checksum y contenido).`);
    return;
  }

  if (existing) context.print(`El artefacto ${existing} es anterior al último cambio de código: se prepara de nuevo.`);

  const exitCode = await context.run(PREPARE_COMMAND);
  if (exitCode !== 0) {
    context.fail(
      `${PREPARE_COMMAND} falló con código ${exitCode} al preparar ${packageName}@${version}.`,
      "El commit y el tag quedaron en local: corregí el error y corré pnpm create-version, que retoma desde la preparación.",
    );
  }

  const prepared = findPreparedArchive(context.repositoryRoot, packageName, version);
  if (!prepared) {
    context.fail(
      `${PREPARE_COMMAND} terminó sin dejar ${RELEASES_DIRECTORY}/${version}-<sha256>/${packageName}-${version}.tgz.`,
      "Revisá la salida de release:prepare y corré pnpm create-version, que retoma desde la preparación.",
    );
  }

  context.print(`Artefacto listo: ${prepared}`);
}
