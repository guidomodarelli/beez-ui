/** @module release-checks Validates metadata and the public package artifact contract. */

/** Stable and prerelease semantic versions, without a tag prefix. */
const RELEASE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

/**
 * Requires release notes matching the manifest while preserving Spanish copy.
 * @param {{version: string}} metadata - Package release metadata.
 * @param {string} changelog - UTF-8 release notes.
 * @returns {void} Completes when release metadata is consistent.
 * @throws {Error} When the version or release notes are invalid.
 */
export function validateReleaseMetadata(metadata, changelog) {
  if (!RELEASE_VERSION.test(metadata.version)) throw new Error("release: package.version must be a semantic version");
  const first = /^## (\S+)[^\n]*\n([\s\S]*?)(?=^## |$(?![\s\S]))/mu.exec(changelog);
  if (!first || first[1] !== metadata.version) throw new Error(`release: first changelog version must be ${metadata.version}`);
  if (!/^\s*- \S/mu.test(first[2])) throw new Error("release: current changelog entry must describe at least one change");
}

/**
 * Collects public file targets from conditional exports.
 * @param {unknown} value - Export target or conditional export map.
 * @returns {string[]} Public relative paths.
 */
function exportTargets(value) {
  if (typeof value === "string") return [value.replace(/^\.\//u, "")];
  return value && typeof value === "object" ? Object.values(value).flatMap(exportTargets) : [];
}

/**
 * Requires every public entrypoint and excludes private source and credentials.
 * @param {{files: string[], exports: unknown}} metadata - Public package manifest.
 * @param {string[]} entries - Archive entry names.
 * @returns {void} Completes when package content matches its contract.
 * @throws {Error} When an entry is private, unsafe or missing.
 */
export function validatePackageContents(metadata, entries) {
  const paths = entries.map(entry => {
    if (!entry.startsWith("package/") || entry.includes("\\") || entry.split("/").includes("..")) throw new Error(`release: invalid archive path ${entry}`);
    return entry.slice("package/".length).replace(/\/$/u, "");
  }).filter(Boolean);
  const allowed = [...metadata.files, "package.json"];
  for (const path of paths) {
    if (path.split("/").some(part => part.startsWith(".") || ["node_modules", "releases", "tests", "scripts", "src"].includes(part)) || !allowed.some(root => path === root || path.startsWith(`${root}/`))) {
      throw new Error(`release: unexpected packaged file ${path}`);
    }
  }
  for (const required of ["package.json", "README.md", "LICENSE.md", "CHANGELOG.md", ...exportTargets(metadata.exports)]) {
    if (!paths.includes(required)) throw new Error(`release: missing packaged file ${required}`);
  }
}
