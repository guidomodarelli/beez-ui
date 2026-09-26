/**
 * @module release-plan Pure planning for `pnpm release`.
 *
 * Turns the snapshot read by `release-state.js` into the steps still missing
 * to publish beez-ui from `main`, or into blockers that explain what to fix.
 * Two situations are recognized:
 *
 * - a new release: commits exist after the last version change, so a version
 *   is chosen and `create-version` runs the whole validated flow;
 * - an interrupted release: `package.json` holds a version npm does not have
 *   yet, so only the missing stages run (prepare, commit and push the
 *   metadata, push the release commit, publish the prepared artifact).
 *
 * Every decision comes from the current state, so running the command again
 * after a failure resumes from the first missing stage.
 */
import semver from "semver";

/** Branch that receives releases. */
export const MAIN_BRANCH = "main";

/** Metadata files owned by the version-creation step. */
export const RELEASE_METADATA_FILES = ["package.json", "CHANGELOG.md"];

/** Stable semver increments offered when creating a version. */
export const RELEASE_TYPE = { patch: "patch", minor: "minor", major: "major" };

/** Stable identifiers of every step the orchestrator can run. */
export const RELEASE_STEP = {
  syncMain: "sync-main",
  createVersion: "create-version",
  prepareArtifact: "prepare-artifact",
  commitAndPushMetadata: "commit-and-push-metadata",
  pushReleaseCommit: "push-release-commit",
  publishArtifact: "publish-artifact",
};

/** Kinds of plans shown to the user. */
export const RELEASE_MODE = { newRelease: "new-release", resume: "resume", upToDate: "up-to-date", blocked: "blocked" };

/** Conventional commit header: `type(scope)!: subject`. */
const CONVENTIONAL_HEADER = /^(?<type>[a-z]+)(?:\([^)]*\))?(?<breaking>!)?:\s/iu;
/** Footer that marks a breaking change. */
const BREAKING_CHANGE_FOOTER = /^BREAKING[ -]CHANGE:/mu;
/** Imperative verbs used by non-conventional feature subjects. */
const FEATURE_SUBJECT = /^(add|agrega|implement|implementa|introduce|support|enable|habilita|create|crea|allow|permite)\b/iu;
/** Release commits created by `create-version` or by hand. */
const RELEASE_COMMIT_SUBJECT = /^(chore\(release\):|update version to )/iu;

/**
 * @typedef {{ sha?: string, subject: string, body?: string }} ReleaseCommit
 * @typedef {{ status: "ok" | "unreachable", latest: string | null, workingTreeVersionPublished: boolean, reason: string | null }} NpmSnapshot
 * @typedef {{
 *   currentBranch: string | null,
 *   upstream: { remote: string, mergeRef: string, ref: string } | null,
 *   workingTreeChanges: string[],
 *   changedPaths: string[],
 *   versions: { workingTree: string, head: string | null, upstream: string | null },
 *   npm: NpmSnapshot,
 *   sync: { aheadCommits: ReleaseCommit[], behindCount: number },
 *   unreleasedCommits: ReleaseCommit[],
 *   preparedArchive: string | null,
 * }} ReleaseState
 * @typedef {{ id: string, title: string, detail?: string }} ReleasePlanStep
 * @typedef {{ title: string, details: string[] }} ReleaseBlocker
 * @typedef {{ mode: string, steps: ReleasePlanStep[], blockers: ReleaseBlocker[], warnings: string[] }} ReleasePlan
 */

/**
 * Lists the only versions allowed after the current one, so no version is skipped.
 * @param {string} currentVersion - Current stable version.
 * @returns {{ releaseType: string, version: string }[]} Next patch, minor and major.
 */
export function listNextVersions(currentVersion) {
  return Object.values(RELEASE_TYPE).map((releaseType) => ({
    releaseType,
    version: /** @type {string} */ (semver.inc(currentVersion, /** @type {import("semver").ReleaseType} */ (releaseType))),
  }));
}

/**
 * Resolves the version requested through `--bump` or `--set-version`.
 * @param {string} currentVersion - Current stable version.
 * @param {{ bump?: string | null, setVersion?: string | null }} request - Parsed options.
 * @returns {{ releaseType: string, version: string } | null} Requested version, or `null` to ask.
 * @throws {Error} With a Spanish message when the version is invalid, not greater or skips versions.
 */
export function resolveRequestedVersion(currentVersion, { bump, setVersion }) {
  const nextVersions = listNextVersions(currentVersion);
  if (bump) return nextVersions.find((candidate) => candidate.releaseType === bump) ?? null;
  if (!setVersion) return null;
  if (!semver.valid(setVersion) || semver.prerelease(setVersion)) {
    throw new Error(`--set-version espera una versión estable X.Y.Z y recibió "${setVersion}".`);
  }
  const match = nextVersions.find((candidate) => candidate.version === setVersion);
  if (!match) {
    const allowed = nextVersions.map((candidate) => candidate.version).join(", ");
    throw new Error(`--set-version ${setVersion} no es válida después de ${currentVersion}: tiene que ser mayor y no saltear versiones. Opciones: ${allowed}.`);
  }
  return match;
}

/** Usage printed by `pnpm release --help`. */
export const RELEASE_USAGE = [
  "Uso: pnpm release [opciones]",
  "",
  "  --bump patch|minor|major   Elige el tipo de versión sin preguntar.",
  "  --set-version X.Y.Z        Fija la versión exacta (solo el siguiente patch, minor o major).",
  '  --notes "Texto"            Nota del CHANGELOG; se puede repetir. Sin notas, se pregunta.',
  "  --dry-run                  Diagnostica y muestra el plan sin cambiar nada.",
  "  --help                     Muestra esta ayuda.",
].join("\n");

/**
 * Validates the parsed command-line options.
 * @param {{ bump?: string, "set-version"?: string, notes?: string[], "dry-run"?: boolean, help?: boolean }} values - `util.parseArgs` values.
 * @returns {{ bump: string | null, setVersion: string | null, notes: string[], dryRun: boolean, help: boolean }} Options.
 * @throws {Error} With a Spanish message when an option is invalid.
 */
export function normalizeReleaseOptions(values) {
  const bump = values.bump ?? null;
  const setVersion = values["set-version"]?.replace(/^v/u, "") ?? null;
  const notes = values.notes ?? [];
  if (bump && !Object.values(RELEASE_TYPE).includes(bump)) {
    throw new Error(`--bump espera ${Object.values(RELEASE_TYPE).join("|")} y recibió "${bump}".`);
  }
  if (bump && setVersion) throw new Error("Usá --bump o --set-version, no los dos a la vez.");
  if (notes.some((note) => !note.trim())) throw new Error("--notes no puede estar vacío.");
  return { bump, setVersion, notes, dryRun: Boolean(values["dry-run"]), help: Boolean(values.help) };
}

/**
 * Returns whether a commit only records a release.
 * @param {string} subject - Commit subject.
 * @returns {boolean} `true` for release commits.
 */
export function isReleaseCommitSubject(subject) {
  return RELEASE_COMMIT_SUBJECT.test(subject.trim());
}

/**
 * Suggests the semver increment for the commits that will ship.
 * @param {ReleaseCommit[]} commits - Commits since the last release.
 * @returns {{ releaseType: string, reason: string }} Suggestion with a Spanish reason.
 */
export function suggestReleaseType(commits) {
  let hasFeature = false;
  for (const commit of commits.filter((candidate) => !isReleaseCommitSubject(candidate.subject))) {
    const header = CONVENTIONAL_HEADER.exec(commit.subject);
    if (header?.groups?.breaking || BREAKING_CHANGE_FOOTER.test(commit.body ?? "")) {
      return { releaseType: RELEASE_TYPE.major, reason: "hay cambios incompatibles (breaking change)" };
    }
    hasFeature ||= header ? header.groups?.type.toLowerCase() === "feat" : FEATURE_SUBJECT.test(commit.subject);
  }
  return hasFeature
    ? { releaseType: RELEASE_TYPE.minor, reason: "hay funcionalidades nuevas" }
    : { releaseType: RELEASE_TYPE.patch, reason: "solo hay arreglos y mantenimiento" };
}

/**
 * Builds CHANGELOG notes from commit subjects, dropping conventional prefixes and release commits.
 * @param {ReleaseCommit[]} commits - Commits since the last release, newest first.
 * @returns {string[]} Notes, oldest first, with the first letter capitalized.
 */
export function buildNotesFromCommits(commits) {
  return commits
    .filter((commit) => !isReleaseCommitSubject(commit.subject))
    .map((commit) => commit.subject.replace(CONVENTIONAL_HEADER, "").trim())
    .filter(Boolean)
    .map((note) => `${note[0].toUpperCase()}${note.slice(1)}`)
    .reverse();
}

/**
 * Adds the blockers shared by every plan.
 * @param {ReleaseState} state - Snapshot.
 * @param {ReleaseBlocker[]} blockers - Collected blockers.
 * @returns {void}
 */
function collectCommonBlockers(state, blockers) {
  if (!state.currentBranch) {
    blockers.push({ title: "HEAD está desacoplado (detached)", details: [`Hacé git switch ${MAIN_BRANCH} y volvé a correr pnpm release.`] });
    return;
  }
  if (state.currentBranch !== MAIN_BRANCH) {
    blockers.push({
      title: `Estás en ${state.currentBranch}: los releases salen solo desde ${MAIN_BRANCH}`,
      details: [`Integrá la rama en ${MAIN_BRANCH}, hacé git switch ${MAIN_BRANCH} y volvé a correr pnpm release.`],
    });
  }
  if (!state.upstream) {
    blockers.push({ title: "La rama no tiene upstream configurado", details: [`Configuralo con git branch --set-upstream-to=origin/${MAIN_BRANCH}.`] });
  }
  if (state.npm.status !== "ok") {
    blockers.push({ title: "No se pudo consultar npm", details: [state.npm.reason ?? "npm no respondió", "Revisá la conexión y volvé a correr pnpm release."] });
  }
  if (state.sync.aheadCommits.length > 0 && state.sync.behindCount > 0) {
    blockers.push({
      title: `${MAIN_BRANCH} divergió de origin (${state.sync.aheadCommits.length} adelante, ${state.sync.behindCount} atrás)`,
      details: [`Integrá los cambios con git pull --rebase y volvé a correr pnpm release.`],
    });
  }
}

/**
 * Decides the steps still missing to publish beez-ui.
 * @param {ReleaseState} state - Snapshot from `release-state.js`.
 * @returns {ReleasePlan} Ordered plan or blockers.
 */
export function buildReleasePlan(state) {
  /** @type {ReleasePlan} */
  const plan = { mode: RELEASE_MODE.blocked, steps: [], blockers: [], warnings: [] };
  collectCommonBlockers(state, plan.blockers);
  if (plan.blockers.length > 0) return plan;

  const { versions, npm } = state;
  const isResume = !npm.workingTreeVersionPublished;
  const onlyMetadataChanged = state.changedPaths.length > 0 && state.changedPaths.every((file) => RELEASE_METADATA_FILES.includes(file));
  const metadataUncommitted = versions.workingTree !== versions.head;

  if (isResume && npm.latest && !semver.gt(versions.workingTree, npm.latest)) {
    plan.blockers.push({
      title: `package.json tiene ${versions.workingTree} pero npm ya publicó ${npm.latest}`,
      details: ["Actualizá main (git pull) o corregí la versión de package.json."],
    });
  }
  const allowedChanges = isResume && metadataUncommitted && onlyMetadataChanged;
  if (state.workingTreeChanges.length > 0 && !allowedChanges) {
    plan.blockers.push({
      title: `Hay ${state.workingTreeChanges.length} archivo(s) sin commitear`,
      details: [...state.workingTreeChanges.slice(0, 5), "El tarball se arma desde el working tree: commitealos (o git stash) y volvé a correr pnpm release."],
    });
  }
  if (plan.blockers.length > 0) return plan;

  const version = versions.workingTree;
  if (state.sync.behindCount > 0) {
    plan.steps.push({ id: RELEASE_STEP.syncMain, title: `Actualizar ${MAIN_BRANCH} desde origin`, detail: `${state.sync.behindCount} commit(s) nuevos.` });
  }

  if (isResume) {
    plan.mode = RELEASE_MODE.resume;
    plan.steps.push({
      id: RELEASE_STEP.prepareArtifact,
      title: `Preparar el artefacto de ${version}`,
      detail: state.preparedArchive ? "Ya hay uno preparado: se ofrece reusarlo." : "Validaciones completas + tarball verificado.",
    });
    if (metadataUncommitted) {
      plan.steps.push({ id: RELEASE_STEP.commitAndPushMetadata, title: "Commitear y pushear package.json y CHANGELOG.md" });
    } else if (versions.upstream !== version) {
      plan.steps.push({ id: RELEASE_STEP.pushReleaseCommit, title: `Pushear el commit de ${version} a origin` });
    }
    plan.steps.push({ id: RELEASE_STEP.publishArtifact, title: `Publicar beez-ui@${version} en npm`, detail: "Pide confirmación; puede abrir la verificación 2FA de npm." });
    return plan;
  }

  if (state.unreleasedCommits.length === 0) {
    plan.mode = RELEASE_MODE.upToDate;
    return plan;
  }

  plan.mode = RELEASE_MODE.newRelease;
  if (state.sync.aheadCommits.length > 0) {
    plan.warnings.push(`${state.sync.aheadCommits.length} commit(s) locales de ${MAIN_BRANCH} se suben junto con el commit de release.`);
  }
  plan.steps.push({
    id: RELEASE_STEP.createVersion,
    title: "Crear y publicar la nueva versión",
    detail: "Elegís versión y notas; después create-version valida, empaqueta, commitea, pushea y publica.",
  });
  return plan;
}
