/**
 * @module release-state Reads the snapshot planned by `release-plan.js`: branch
 * and upstream, uncommitted changes, `main` versus its upstream, the version in
 * the working tree, `HEAD` and upstream, the commits since the last version
 * change, the npm registry state and an already prepared artifact.
 *
 * Every reader is read-only; the only network operations are `git fetch` and
 * `npm view`.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Separates fields and records in `git log --format` output. */
const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";
/** Porcelain status prefix width (`XY `) before each path. */
const STATUS_PREFIX_LENGTH = 3;
/** npm reports a missing version or package with this code. */
const NPM_NOT_FOUND = /E404|404 Not Found|is not in this registry/u;
/** Package names and versions accepted in the `npm view` command line. */
const SAFE_VERSION = /^[0-9A-Za-z.+-]+$/u;
const SAFE_PACKAGE_NAME = /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/u;

/**
 * Runs `npm view <spec> version`. npm is a `.cmd` shim on Windows, so it runs
 * through the shell as one command line built only from validated values.
 * @param {string} spec - Validated `name` or `name@version`.
 * @param {string} root - Directory with the project `.npmrc`.
 * @returns {Promise<{ status: number, stdout: string, stderr: string }>} Result.
 */
function npmViewVersion(spec, root) {
  return runCaptured(`npm view ${spec} version`, [], { cwd: root, shell: true });
}

/**
 * Runs a command and captures its output; leading whitespace is kept because
 * `git status --porcelain` encodes the file state in the first columns.
 * @param {string} command - Executable, or a full command line when `shell` is set.
 * @param {string[]} args - Fixed arguments (empty with `shell`).
 * @param {{ cwd?: string, shell?: boolean }} [options] - Spawn options.
 * @returns {Promise<{ status: number, stdout: string, stderr: string }>} Result; never rejects.
 */
export function runCaptured(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, shell: options.shell, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => resolve({ status: 1, stdout, stderr: error.message }));
    child.on("close", (status) => resolve({ status: status ?? 1, stdout: stdout.trimEnd(), stderr: stderr.trim() }));
  });
}

/**
 * Runs a command with inherited stdio so progress and npm authentication stay interactive.
 * @param {string} command - Executable.
 * @param {string[]} args - Fixed arguments.
 * @param {{ cwd?: string }} [options] - Spawn options.
 * @returns {Promise<number>} Exit code; never rejects.
 */
export function runInherited(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: "inherit" });
    child.on("error", () => resolve(1));
    child.on("close", (status) => resolve(status ?? 1));
  });
}

/**
 * Creates Git readers bound to a repository.
 * @param {string} root - Repository directory.
 * @returns {{ git: (args: string[]) => Promise<string>, tryGit: (args: string[]) => Promise<string | null> }} Readers.
 */
export function createGitReader(root) {
  const tryGit = async (/** @type {string[]} */ args) => {
    const result = await runCaptured("git", args, { cwd: root });
    return result.status === 0 ? result.stdout : null;
  };
  const git = async (/** @type {string[]} */ args) => {
    const result = await runCaptured("git", args, { cwd: root });
    if (result.status !== 0) throw new Error(`release-state: git ${args.join(" ")} failed: ${result.stderr}`);
    return result.stdout;
  };
  return { git, tryGit };
}

/**
 * Lists the commits of a revision range, newest first.
 * @param {ReturnType<typeof createGitReader>} reader - Git reader.
 * @param {string[]} revisions - Revisions or ranges passed to `git log`.
 * @returns {Promise<{ sha: string, subject: string, body: string }[]>} Commits.
 */
export async function listCommits(reader, revisions) {
  const output = await reader.tryGit(["log", `--format=%H${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%b${RECORD_SEPARATOR}`, ...revisions]);
  return (output ?? "").split(RECORD_SEPARATOR).map((record) => record.trim()).filter(Boolean).map((record) => {
    const [sha = "", subject = "", body = ""] = record.split(FIELD_SEPARATOR);
    return { sha, subject, body: body.trim() };
  });
}

/**
 * Reads `package.json` version at a revision.
 * @param {ReturnType<typeof createGitReader>} reader - Git reader.
 * @param {string} revision - Revision.
 * @returns {Promise<string | null>} Version, or `null` when unreadable.
 */
export async function readVersionAt(reader, revision) {
  const manifest = await reader.tryGit(["show", `${revision}:package.json`]);
  try {
    return manifest ? JSON.parse(manifest).version ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Finds an artifact already prepared by `release:prepare` for a version.
 * @param {string} root - Repository directory.
 * @param {string} name - Package name.
 * @param {string} version - Package version.
 * @returns {string | null} Repository-relative archive path, newest directory first.
 */
export function findPreparedArchive(root, name, version) {
  const releases = join(root, "releases");
  if (!existsSync(releases)) return null;
  const directory = readdirSync(releases).filter((entry) => entry.startsWith(`${version}-`)).sort().at(-1);
  const archive = directory ? `releases/${directory}/${name}-${version}.tgz` : null;
  return archive && existsSync(join(root, archive)) ? archive : null;
}

/**
 * Reads the registry state of the package with the official npm client.
 * @param {string} name - Package name.
 * @param {string} version - Working tree version.
 * @param {string} root - Directory with the project `.npmrc`.
 * @returns {Promise<import("./release-plan.js").NpmSnapshot>} Registry snapshot.
 */
export async function lookupNpm(name, version, root) {
  if (!SAFE_VERSION.test(version) || !SAFE_PACKAGE_NAME.test(name)) {
    return { status: "unreachable", latest: null, workingTreeVersionPublished: false, reason: `nombre o versión inválidos: ${name}@${version}` };
  }
  const latest = await npmViewVersion(name, root);
  if (latest.status !== 0 && !NPM_NOT_FOUND.test(latest.stderr)) {
    return { status: "unreachable", latest: null, workingTreeVersionPublished: false, reason: latest.stderr.split("\n")[0] || "npm view falló" };
  }
  const exact = await npmViewVersion(`${name}@${version}`, root);
  if (exact.status !== 0 && !NPM_NOT_FOUND.test(exact.stderr)) {
    return { status: "unreachable", latest: null, workingTreeVersionPublished: false, reason: exact.stderr.split("\n")[0] || "npm view falló" };
  }
  return {
    status: "ok",
    latest: latest.status === 0 && latest.stdout ? latest.stdout : null,
    workingTreeVersionPublished: exact.status === 0 && exact.stdout.trim() === version,
    reason: null,
  };
}

/**
 * Reads the complete release snapshot.
 * @param {{ root: string, onProgress?: (label: string) => void, npmLookup?: typeof lookupNpm }} options - Inputs; `npmLookup` selects the registry adapter.
 * @returns {Promise<import("./release-plan.js").ReleaseState & { packageName: string, lastReleaseSha: string | null }>} Snapshot.
 */
export async function collectReleaseState({ root, onProgress = () => {}, npmLookup = lookupNpm }) {
  const reader = createGitReader(root);
  const currentBranch = await reader.tryGit(["symbolic-ref", "--quiet", "--short", "HEAD"]);
  const remote = currentBranch ? await reader.tryGit(["config", "--get", `branch.${currentBranch}.remote`]) : null;
  const mergeRef = currentBranch ? await reader.tryGit(["config", "--get", `branch.${currentBranch}.merge`]) : null;

  if (remote) {
    onProgress(`Sincronizando con ${remote} (fetch)`);
    await reader.git(["fetch", remote, "--prune", "--quiet"]);
  }
  const upstreamRef = remote && mergeRef ? await reader.tryGit(["rev-parse", "--abbrev-ref", "@{upstream}"]) : null;
  const upstream = upstreamRef && remote && mergeRef ? { remote, mergeRef, ref: upstreamRef } : null;

  onProgress("Leyendo el estado de Git");
  const status = await reader.git(["status", "--porcelain", "--untracked-files=all"]);
  const workingTreeChanges = status.split("\n").map((line) => line.trimEnd()).filter(Boolean);
  const changedPaths = workingTreeChanges.map((line) => line.slice(STATUS_PREFIX_LENGTH).replace(/^"|"$/gu, ""));
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const aheadCommits = upstream ? await listCommits(reader, [`${upstream.ref}..HEAD`]) : [];
  const behindCount = upstream ? Number(await reader.tryGit(["rev-list", "--count", `HEAD..${upstream.ref}`]) ?? 0) : 0;
  const tip = upstream && behindCount > 0 ? upstream.ref : "HEAD";
  // The last release is the last commit that changed the manifest version.
  const lastReleaseSha = await reader.tryGit(["log", "-1", "--format=%H", "-G", '"version":', tip, "--", "package.json"]);
  const unreleasedCommits = await listCommits(reader, lastReleaseSha ? [`${lastReleaseSha}..${tip}`] : [tip]);

  onProgress("Consultando npm");
  const npm = await npmLookup(manifest.name, manifest.version, root);

  return {
    packageName: manifest.name,
    currentBranch,
    upstream,
    workingTreeChanges,
    changedPaths,
    versions: {
      workingTree: manifest.version,
      head: await readVersionAt(reader, "HEAD"),
      upstream: upstream ? await readVersionAt(reader, upstream.ref) : null,
    },
    npm,
    sync: { aheadCommits, behindCount },
    lastReleaseSha: lastReleaseSha || null,
    unreleasedCommits,
    preparedArchive: findPreparedArchive(root, manifest.name, manifest.version),
  };
}
