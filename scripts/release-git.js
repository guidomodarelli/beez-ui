/** @module release-git Commits only release metadata and pushes to the configured upstream. */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Files owned by the version-creation step. Other index entries remain untouched. */
const RELEASE_FILES = ["package.json", "CHANGELOG.md"];

/**
 * Reads Git state without shell interpolation.
 * @param {string} root - Repository directory.
 * @param {string[]} args - Git arguments.
 * @returns {string} Trimmed command output.
 */
function readGit(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/**
 * Captures the exact metadata to detect concurrent edits during validation.
 * @param {string} root - Repository directory.
 * @returns {Record<string, string>} Release file contents.
 */
export function readReleaseMetadata(root) {
  return Object.fromEntries(RELEASE_FILES.map((file) => [file, readFileSync(join(root, file), "utf8")]));
}

/**
 * Requires an attached branch with an existing upstream before changing a version.
 * @param {string} root - Repository directory.
 * @returns {{head: string, branch: string, remote: string, mergeRef: string}} Original checkout and push destination.
 * @throws {Error} When Git state or the upstream is not configured.
 */
export function prepareReleaseGit(root) {
  let branch;
  try {
    branch = readGit(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  } catch (error) {
    throw new Error("create-version: an attached Git branch is required before creating a release", { cause: error });
  }
  try {
    const remote = readGit(root, ["config", "--get", `branch.${branch}.remote`]);
    const mergeRef = readGit(root, ["config", "--get", `branch.${branch}.merge`]);
    if (!remote || !mergeRef.startsWith("refs/heads/")) throw new Error("Invalid upstream configuration");
    readGit(root, ["check-ref-format", mergeRef]);
    readGit(root, ["rev-parse", "--verify", "@{upstream}"]);
    readGit(root, ["ls-files", "--error-unmatch", "--", ...RELEASE_FILES]);
    return { head: readGit(root, ["rev-parse", "HEAD"]), branch, remote, mergeRef };
  } catch (error) {
    throw new Error("create-version: configure a Git upstream and track package.json and CHANGELOG.md before creating a release", { cause: error });
  }
}

/**
 * Commits the validated metadata without including other staged files, then pushes without force.
 * @param {string} root - Repository directory.
 * @param {ReturnType<typeof prepareReleaseGit>} state - Checkout captured before version creation.
 * @param {string} version - Validated release version.
 * @param {Record<string, string>} expected - Metadata captured immediately after version creation.
 * @returns {string} Commit pushed to the upstream branch.
 * @throws {Error} When concurrent changes, commit hooks or the push prevent completion.
 */
export function commitAndPushRelease(root, state, version, expected) {
  let current;
  try {
    current = prepareReleaseGit(root);
  } catch (error) {
    throw new Error("create-version: Git checkout or upstream changed during release validation; inspect the prepared release before continuing", { cause: error });
  }
  if (current.head !== state.head || current.branch !== state.branch || current.remote !== state.remote || current.mergeRef !== state.mergeRef) {
    throw new Error("create-version: Git checkout or upstream changed during release validation; inspect the prepared release before continuing");
  }
  const actual = readReleaseMetadata(root);
  if (RELEASE_FILES.some((file) => actual[file] !== expected[file]) || JSON.parse(actual["package.json"]).version !== version) {
    throw new Error("create-version: release metadata changed during validation; inspect the prepared release before continuing");
  }
  execFileSync("git", ["commit", "--only", "-m", `chore(release): prepara la versión ${version}`, "-m", "Actualiza package.json y CHANGELOG.md con la versión validada y sus notas de release.", "--", ...RELEASE_FILES], { cwd: root, stdio: "inherit" });
  const commit = readGit(root, ["rev-parse", "HEAD"]);
  const changedFiles = readGit(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]).split(/\r?\n/u);
  if (readGit(root, ["rev-parse", `${commit}^`]) !== state.head || changedFiles.some((file) => !RELEASE_FILES.includes(file))) {
    throw new Error("create-version: the release commit contains unexpected changes; inspect Git hooks and the local commit before pushing");
  }
  for (const file of RELEASE_FILES) {
    const committed = execFileSync("git", ["show", `${commit}:${file}`], { cwd: root, encoding: "utf8" });
    if (committed.replaceAll("\r\n", "\n") !== expected[file].replaceAll("\r\n", "\n")) {
      throw new Error("create-version: a Git hook changed the validated metadata; inspect the local commit before pushing");
    }
  }
  execFileSync("git", ["push", "--no-follow-tags", "--", state.remote, `${commit}:${state.mergeRef}`], { cwd: root, stdio: "inherit" });
  return commit;
}
