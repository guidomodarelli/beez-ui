/**
 * @file `pnpm create-version`: diagnoses the repository, shows what is still missing
 * and publishes beez-ui from `main` in one command.
 *
 * A new release takes its notes from the CHANGELOG `[Unreleased]` block (Codex
 * fills it when empty), asks for the version (or takes `--bump` or
 * `--set-version`) and runs the validated release
 * workflow (`createAndPublishRelease`): metadata, full checks,
 * checksum-addressed tarball, metadata commit and push, and `npm publish`.
 * An interrupted release resumes only the missing stages with the same
 * building blocks (`commitRelease`, `prepareRelease`, `git push`,
 * `publish-release.js`). Running the command again always resumes from the
 * first missing stage.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { CHANGE_TYPES, UNRELEASED_HEADING, readUnreleased } from "./changelog.js";
import { CODEX_NOT_FOUND_EXIT_CODE, buildChangelogPrompt, runCodex } from "./changelog-ai.js";
import {
  MAIN_BRANCH,
  RELEASE_MODE,
  RELEASE_STEP,
  RELEASE_USAGE,
  buildReleasePlan,
  listNextVersions,
  normalizeReleaseOptions,
  resolveRequestedVersion,
  suggestReleaseType,
} from "./release-plan.js";
import { collectReleaseState, createGitReader, findPreparedArchive, lookupNpm, runInherited } from "./release-state.js";
import {
  BOX_TONE,
  ICON,
  confirm,
  formatDuration,
  measureActiveMs,
  paint,
  print,
  renderBanner,
  renderBox,
  renderRow,
  renderStepHeader,
  select,
  startSpinner,
} from "./terminal-ui.js";

/** Anchors every operation to this repository, whatever the caller's directory. */
const root = fileURLToPath(new URL("../", import.meta.url));
/** Maximum commits or notes listed in a box. */
const MAX_LISTED_ITEMS = 12;
/** Length of abbreviated commit ids. */
const SHORT_SHA_LENGTH = 7;
/** Converts file modification times (ms) to Git commit timestamps (s). */
const MILLISECONDS_PER_SECOND = 1000;
/** Exit code of a blocked or failed release. */
const FAILURE_EXIT_CODE = 1;

/** Step failure with a Spanish next action. */
class ReleaseStepError extends Error {
  /**
   * @param {string} message - What failed.
   * @param {string} hint - What to do next.
   * @param {unknown} [cause] - Original error.
   */
  constructor(message, hint, cause) {
    super(message, { cause });
    this.hint = hint;
  }
}

/** Deliberate cancellation; ends the run without an error box. */
class ReleaseCancelledError extends Error {}

/**
 * Lists items inside a box, summarizing the overflow.
 * @param {string} title - Box title.
 * @param {string[]} items - Lines.
 * @param {string} tone - Border tone.
 * @returns {string} Box.
 */
function renderList(title, items, tone = BOX_TONE.accent) {
  const lines = items.slice(0, MAX_LISTED_ITEMS).map((item) => `${ICON.bullet} ${item}`);
  if (items.length > MAX_LISTED_ITEMS) lines.push(paint("gray", `… y ${items.length - MAX_LISTED_ITEMS} más`));
  return renderBox({ title, lines, tone });
}

/**
 * Renders the diagnosis row of the CHANGELOG `[Unreleased]` block.
 *
 * @param {{ exists: boolean, entryCount: number, unknownSections: string[] }} changelog - Unreleased state.
 * @returns {string} Row.
 */
function renderChangelogRow(changelog) {
  if (changelog.unknownSections.length > 0) {
    return renderRow(ICON.failure, "CHANGELOG", paint("red", `secciones no válidas: ${changelog.unknownSections.join(", ")}`));
  }

  if (changelog.entryCount === 0) {
    return renderRow(ICON.warning, "CHANGELOG", paint("yellow", "[Unreleased] vacío: lo completa Codex al versionar"));
  }

  return renderRow(ICON.success, "CHANGELOG", `${changelog.entryCount} entrada(s) en [Unreleased]`);
}

/**
 * Renders the diagnosis panel.
 * @param {Awaited<ReturnType<typeof collectReleaseState>>} state - Snapshot.
 * @returns {string} Box.
 */
function renderDiagnosis(state) {
  const isOnMain = state.currentBranch === MAIN_BRANCH;
  const { aheadCommits, behindCount } = state.sync;
  const syncParts = [];
  if (behindCount > 0) syncParts.push(paint("yellow", `${behindCount} atrás`));
  if (aheadCommits.length > 0) syncParts.push(paint("yellow", `${aheadCommits.length} adelante`));
  const { npm, versions } = state;
  const npmValue = npm.status !== "ok"
    ? paint("red", "no respondió")
    : `latest ${paint("cyan", npm.latest ?? "—")}${npm.workingTreeVersionPublished ? "" : paint("yellow", ` · ${versions.workingTree} sin publicar`)}`;
  const rows = [
    renderRow(isOnMain ? ICON.success : ICON.failure, "Rama", isOnMain ? MAIN_BRANCH : paint("red", state.currentBranch ?? "HEAD desacoplado")),
    renderRow(state.upstream ? ICON.success : ICON.failure, "Upstream", state.upstream?.ref ?? paint("red", "sin configurar")),
    renderRow(
      state.workingTreeChanges.length === 0 ? ICON.success : ICON.warning,
      "Working tree",
      state.workingTreeChanges.length === 0 ? "limpio" : paint("yellow", `${state.workingTreeChanges.length} cambio(s) sin commitear`),
    ),
    renderRow(syncParts.length > 0 ? ICON.warning : ICON.success, `${MAIN_BRANCH} ↔ origin`, syncParts.join(", ") || "al día"),
    renderRow(ICON.info, "Versión local", `${paint("cyan", versions.workingTree)}${versions.head && versions.head !== versions.workingTree ? paint("yellow", ` (HEAD tiene ${versions.head})`) : ""}`),
    renderRow(npm.status === "ok" ? (npm.workingTreeVersionPublished ? ICON.success : ICON.warning) : ICON.failure, "npm", npmValue),
    renderRow(
      state.unreleasedCommits.length > 0 ? ICON.warning : ICON.success,
      "Sin publicar",
      state.unreleasedCommits.length > 0
        ? paint("yellow", `${state.unreleasedCommits.length} commit(s) desde ${state.lastReleaseSha?.slice(0, SHORT_SHA_LENGTH) ?? "el inicio"}`)
        : "nada nuevo desde el último cambio de versión",
    ),
    renderChangelogRow(state.changelog),
    renderRow(state.preparedArchive ? ICON.info : ICON.pending, "Artefacto", state.preparedArchive ?? paint("gray", `ninguno preparado para ${versions.workingTree}`)),
  ];
  return renderBox({ title: "Diagnóstico", lines: rows, tone: BOX_TONE.info });
}

/**
 * Renders the plan or its blockers.
 * @param {import("./release-plan.js").ReleasePlan} plan - Plan.
 * @returns {string} Box.
 */
function renderPlan(plan) {
  if (plan.blockers.length > 0) {
    const lines = plan.blockers.flatMap((blocker, index) => [
      ...(index > 0 ? [""] : []),
      `${ICON.failure} ${paint("bold", blocker.title)}`,
      ...blocker.details.map((detail) => `   ${paint("gray", "→")} ${detail}`),
    ]);
    return renderBox({ title: "No se puede publicar todavía", lines, tone: BOX_TONE.danger });
  }
  const title = plan.mode === RELEASE_MODE.resume ? "Plan · retomar el release pendiente" : "Plan";
  const lines = plan.steps.flatMap((step, index) => [
    `${paint(["bold", "magenta"], `${index + 1}.`)} ${paint("bold", step.title)}`,
    ...(step.detail ? [`   ${paint("gray", step.detail)}`] : []),
  ]);
  for (const warning of plan.warnings) lines.push("", `${ICON.warning} ${paint("yellow", warning)}`);
  return renderBox({ title, lines, tone: BOX_TONE.accent });
}

/**
 * Runs Git with visible output and fails the step on error.
 * @param {string[]} args - Git arguments.
 * @param {string} message - Spanish failure.
 * @param {string} hint - Spanish next action.
 * @returns {Promise<void>}
 */
async function runGitStep(args, message, hint) {
  const exitCode = await runInherited("git", args, { cwd: root });
  if (exitCode !== 0) throw new ReleaseStepError(`${message} (git ${args[0]} salió con código ${exitCode}).`, hint);
}

/**
 * Confirms that npm serves the published version.
 * @param {ReleaseContext} context - Release context.
 * @param {string} version - Published version.
 * @returns {Promise<void>}
 */
async function verifyPublished(context, version) {
  const npm = await lookupNpm(context.state.packageName, version, root);
  if (!npm.workingTreeVersionPublished) {
    print(`${ICON.warning} ${paint("yellow", `npm todavía no muestra ${version}; puede tardar unos segundos en propagarse.`)}`);
  }
  context.publishedVersion = version;
}

/**
 * @typedef {{
 *   state: Awaited<ReturnType<typeof collectReleaseState>>,
 *   options: ReturnType<typeof normalizeReleaseOptions>,
 *   archive: string | null,
 *   publishedVersion: string | null,
 * }} ReleaseContext
 */

/**
 * Chooses the version: flag or arrow-key prompt with a suggestion.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<string>} Next version.
 */
async function chooseVersion(context) {
  // Re-read the manifest: syncing main may have brought a newer version.
  const current = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const requested = resolveRequestedVersion(current, context.options);
  if (requested) {
    print(`${ICON.info} Versión elegida por flag: ${paint(["bold", "cyan"], requested.version)} (${requested.releaseType})`);
    return requested.version;
  }
  const suggestion = suggestReleaseType(context.state.unreleasedCommits);
  const candidates = listNextVersions(current);
  return select({
    message: `¿Qué versión publicamos? (actual ${current})`,
    options: candidates.map((candidate) => ({
      label: `${candidate.releaseType.padEnd(5)}  ${current} → ${candidate.version}`,
      hint: candidate.releaseType === suggestion.releaseType ? `${ICON.star} sugerida: ${suggestion.reason}` : undefined,
      value: candidate.version,
    })),
    defaultIndex: candidates.findIndex((candidate) => candidate.releaseType === suggestion.releaseType),
  });
}

/**
 * Reads the `[Unreleased]` block of the working-tree CHANGELOG.md.
 * @returns {ReturnType<typeof readUnreleased>} Unreleased state.
 */
function readWorkingUnreleased() {
  return readUnreleased(readFileSync(join(root, "CHANGELOG.md"), "utf8"));
}

/**
 * Asks Codex to fill an empty `[Unreleased]` block from the unreleased commits and shows the result.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 * @throws {ReleaseStepError} When Codex is missing, fails or leaves the block empty.
 */
async function generateChangelogStep(context) {
  const prompt = buildChangelogPrompt(context.state.unreleasedCommits, "quien consume el paquete beez-ui");
  print(paint("gray", "Codex está escribiendo el CHANGELOG a partir de los commits sin publicar…"));
  const exitCode = await runCodex(root, prompt);
  const unreleased = readWorkingUnreleased();
  if (exitCode !== 0 || unreleased.entryCount === 0 || unreleased.unknownSections.length > 0) {
    const reason = exitCode === CODEX_NOT_FOUND_EXIT_CODE ? "no se encontró la CLI de Codex" : exitCode !== 0 ? `Codex terminó con código ${exitCode}` : "el bloque sigue vacío o con secciones no válidas";
    throw new ReleaseStepError(
      `No se pudo completar ${UNRELEASED_HEADING} del CHANGELOG: ${reason}.`,
      `Completalo (con la IA o a mano) usando ${CHANGE_TYPES.map((type) => `### ${type}`).join(", ")} y volvé a correr pnpm create-version.`,
    );
  }
  print(renderBox({ title: `CHANGELOG · ${UNRELEASED_HEADING} (generado por Codex)`, lines: unreleased.body.split("\n"), tone: BOX_TONE.info }));
}

/**
 * Fast-forwards `main` to its upstream.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function syncMainStep(context) {
  const upstream = /** @type {NonNullable<ReleaseContext["state"]["upstream"]>} */ (context.state.upstream);
  await runGitStep(["merge", "--ff-only", "--quiet", upstream.ref], `No se pudo actualizar ${MAIN_BRANCH} en fast-forward`, `Revisá git status y git log ${upstream.ref}.`);
  print(`${ICON.success} ${MAIN_BRANCH} quedó igual a ${upstream.ref}.`);
}

/**
 * Asks the version, then runs the whole `create-version` flow with the `[Unreleased]` changes.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function createVersionStep(context) {
  print(renderList(`Qué se publica (${context.state.unreleasedCommits.length} commit(s))`, context.state.unreleasedCommits.map((commit) => commit.subject)));
  const version = await chooseVersion(context);
  print(renderBox({ title: `CHANGELOG · ${UNRELEASED_HEADING} → [${version}]`, lines: readWorkingUnreleased().body.split("\n"), tone: BOX_TONE.info }));
  const proceed = await confirm(`¿Publicar beez-ui@${version}? Commitea package.json y CHANGELOG.md, valida todo (varios minutos), pushea a ${MAIN_BRANCH} y publica en npm.`);
  if (!proceed) {
    print(`${ICON.warning} ${paint("yellow", "Release cancelado. No se tocó nada.")}`);
    throw new ReleaseCancelledError();
  }
  const { prepareReleaseGit, commitRelease, pushRelease } = await import("./release-git.js");
  const { createAndPublishRelease } = await import("./release-workflow.js");
  const { prepareRelease } = await import("./prepare-release.js");
  try {
    // Capture the checkout before the version changes so concurrent edits are detected.
    const gitState = prepareReleaseGit(root);
    createAndPublishRelease(root, version, {
      commit: (releasedVersion, metadata) => {
        const commit = commitRelease(root, gitState, releasedVersion, metadata);
        print(`${ICON.success} Commit local de ${releasedVersion} con package.json y CHANGELOG.md.`);
        return commit;
      },
      prepare: prepareRelease,
      push: (commit) => pushRelease(root, gitState, commit),
      /** Publishes the exact checked artifact, preserving interactive npm authentication. */
      publish: (archive) => execFileSync(process.execPath, [join(root, "scripts", "publish-release.js"), archive], { cwd: root, stdio: "inherit" }),
    });
  } catch (error) {
    throw new ReleaseStepError(
      `No se pudo completar ${version}: ${error instanceof Error ? error.message : String(error)}`,
      `Corregí el error y corré pnpm create-version: detecta que ${version} no está en npm y retoma solo lo que falte (sin volver a subir la versión).`,
      error,
    );
  }
  await verifyPublished(context, version);
}

/**
 * Prepares (or reuses) the checked artifact of the pending version.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function prepareArtifactStep(context) {
  const { versions, packageName } = context.state;
  const existing = findPreparedArchive(root, packageName, versions.workingTree);
  // Reuse an artifact only when it is newer than the last code change; release metadata commits do not count.
  const lastCodeChange = await createGitReader(root).tryGit(["log", "-1", "--format=%ct", "--", ".", ":(exclude)package.json", ":(exclude)CHANGELOG.md"]);
  if (existing && statSync(join(root, existing)).mtimeMs / MILLISECONDS_PER_SECOND > Number(lastCodeChange ?? 0)) {
    context.archive = existing;
    print(`${ICON.success} Se reusa ${existing}: es posterior al último cambio de código (release:publish vuelve a verificar checksum y contenido).`);
    return;
  }
  if (existing) print(`${ICON.info} El artefacto ${existing} es anterior al último cambio de código: se prepara de nuevo.`);
  const { prepareRelease } = await import("./prepare-release.js");
  try {
    context.archive = prepareRelease();
  } catch (error) {
    throw new ReleaseStepError(`La preparación de ${versions.workingTree} falló.`, "Corregí el error de arriba y corré pnpm create-version: retoma desde la preparación.", error);
  }
}

/**
 * Commits the release metadata left uncommitted by an interrupted release, before any validation.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function commitMetadataStep(context) {
  const { prepareReleaseGit, readReleaseMetadata, commitRelease } = await import("./release-git.js");
  const version = context.state.versions.workingTree;
  try {
    commitRelease(root, prepareReleaseGit(root), version, readReleaseMetadata(root));
  } catch (error) {
    throw new ReleaseStepError(
      `No se pudo commitear la metadata de ${version}: ${error instanceof Error ? error.message : String(error)}`,
      "Resolvé el estado de Git y corré pnpm create-version: retoma desde el commit.",
      error,
    );
  }
  print(`${ICON.success} Commit local de ${version} con package.json y CHANGELOG.md.`);
}

/**
 * Pushes a release commit that exists only locally, without force or tags.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function pushReleaseCommitStep(context) {
  const upstream = /** @type {NonNullable<ReleaseContext["state"]["upstream"]>} */ (context.state.upstream);
  await runGitStep(
    ["push", "--no-follow-tags", "--", upstream.remote, `HEAD:${upstream.mergeRef}`],
    "El push del commit de release falló",
    "Resolvé el problema (¿main avanzó en origin?) y corré pnpm create-version.",
  );
}

/**
 * Publishes the prepared artifact after a last confirmation.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function publishArtifactStep(context) {
  const version = context.state.versions.workingTree;
  const archive = /** @type {string} */ (context.archive);
  // The resume confirmation at the start already covers publishing; no second prompt here.
  print(`${ICON.info} Publicando ${archive} como beez-ui@${version} (latest).`);
  const exitCode = await runInherited(process.execPath, [join(root, "scripts", "publish-release.js"), archive], { cwd: root });
  if (exitCode !== 0) {
    throw new ReleaseStepError(`npm publish terminó con código ${exitCode}.`, `Comprobá en npm si ${version} llegó; si no, corré pnpm create-version para reintentar solo la publicación.`);
  }
  await verifyPublished(context, version);
}

/** Executors of each plan step. */
const STEP_EXECUTORS = {
  [RELEASE_STEP.syncMain]: syncMainStep,
  [RELEASE_STEP.generateChangelog]: generateChangelogStep,
  [RELEASE_STEP.createVersion]: createVersionStep,
  [RELEASE_STEP.prepareArtifact]: prepareArtifactStep,
  [RELEASE_STEP.commitMetadata]: commitMetadataStep,
  [RELEASE_STEP.pushReleaseCommit]: pushReleaseCommitStep,
  [RELEASE_STEP.publishArtifact]: publishArtifactStep,
};

/**
 * Runs the release command.
 * @returns {Promise<number>} Exit code.
 */
async function main() {
  const startedAt = Date.now();
  let options;
  try {
    const { values } = parseArgs({
      options: {
        bump: { type: "string" },
        "set-version": { type: "string" },
        "dry-run": { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    });
    options = normalizeReleaseOptions(values);
  } catch (error) {
    print(`${ICON.failure} ${paint("red", error instanceof Error ? error.message : String(error))}`);
    print(RELEASE_USAGE);
    return FAILURE_EXIT_CODE;
  }
  if (options.help) {
    print(RELEASE_USAGE);
    return 0;
  }

  const headManifest = await createGitReader(root).tryGit(["show", "HEAD:package.json"]);
  const headVersion = headManifest ? JSON.parse(headManifest).version : null;
  print(renderBanner({ projectName: "beez-ui", publishedLabel: headVersion ? `v${headVersion} en npm` : null }));

  const spinner = startSpinner("Diagnosticando el repositorio");
  let state;
  try {
    state = await collectReleaseState({ root, onProgress: (label) => spinner.update(label) });
    spinner.succeed("Diagnóstico completo");
  } catch (error) {
    spinner.fail("No se pudo diagnosticar el repositorio");
    print(paint("red", error instanceof Error ? error.message : String(error)));
    return FAILURE_EXIT_CODE;
  }

  print(renderDiagnosis(state));
  const plan = buildReleasePlan(state);
  if (plan.mode === RELEASE_MODE.newRelease) {
    print(renderList("Commits sin publicar", state.unreleasedCommits.map((commit) => commit.subject)));
  }
  if (plan.mode === RELEASE_MODE.upToDate) {
    print(renderBox({ title: "Todo al día", lines: [`${ICON.success} beez-ui@${state.versions.workingTree} ya está en npm y no hay commits nuevos.`], tone: BOX_TONE.success }));
    return 0;
  }
  print(renderPlan(plan));
  // A blocker is an expected outcome already explained in the box, not a
  // command failure: exiting 0 keeps pnpm from appending ELIFECYCLE noise.
  if (plan.blockers.length > 0) return 0;

  if (plan.mode === RELEASE_MODE.newRelease) {
    try {
      resolveRequestedVersion(state.versions.workingTree, options);
    } catch (error) {
      print(`${ICON.failure} ${paint("red", error instanceof Error ? error.message : String(error))}`);
      return FAILURE_EXIT_CODE;
    }
  } else if (options.bump || options.setVersion) {
    print(`${ICON.warning} ${paint("yellow", `Se ignoran --bump y --set-version: se retoma ${state.versions.workingTree}, que ya tiene versión y CHANGELOG.`)}`);
  }

  if (options.dryRun) {
    print(`${ICON.info} ${paint("cyan", "--dry-run: no se cambió nada. Corré pnpm create-version para ejecutar el plan.")}`);
    return 0;
  }
  if (plan.mode === RELEASE_MODE.resume && !(await confirm("¿Retomamos el release pendiente?"))) {
    print(`${ICON.warning} ${paint("yellow", "Release cancelado. No se tocó nada.")}`);
    return 0;
  }

  /** @type {ReleaseContext} */
  const context = { state, options, archive: null, publishedVersion: null };
  for (const [index, step] of plan.steps.entries()) {
    print(renderStepHeader(index + 1, plan.steps.length, step.title));
    try {
      await STEP_EXECUTORS[step.id](context);
    } catch (error) {
      if (error instanceof ReleaseCancelledError) return 0;
      const lines = [`${ICON.failure} ${error instanceof Error ? error.message : String(error)}`];
      if (error instanceof ReleaseStepError) lines.push("", `${paint("bold", "Qué hacer:")} ${error.hint}`);
      lines.push("", paint("gray", "pnpm create-version retoma desde el primer paso que falte."));
      print(renderBox({ title: `Falló el paso ${index + 1}: ${step.title}`, lines, tone: BOX_TONE.danger }));
      return FAILURE_EXIT_CODE;
    }
  }

  const version = context.publishedVersion;
  print("");
  print(renderBox({
    title: version ? `${ICON.rocket} beez-ui@${version} publicado` : "Listo",
    lines: version
      ? [
          `${ICON.success} ${paint("bold", "npm")}        https://www.npmjs.com/package/beez-ui/v/${version}`,
          `${ICON.success} ${paint("bold", "Git")}        commit de release en ${MAIN_BRANCH}`,
          `${ICON.info} ${paint("bold", "Consumidores")} pnpm add beez-ui@^${version}`,
          "",
          paint("gray", `Tiempo total: ${formatDuration(measureActiveMs(startedAt))} (sin contar la espera de tus respuestas)`),
        ]
      : [`${ICON.success} Plan completado en ${formatDuration(measureActiveMs(startedAt))} (sin contar la espera de tus respuestas).`],
    tone: BOX_TONE.success,
  }));
  return 0;
}

main().then((exitCode) => {
  process.exitCode = exitCode;
});
