/**
 * @file `pnpm release`: diagnoses the repository, shows what is still missing
 * and publishes beez-ui from `main` in one command.
 *
 * A new release asks for the version and the CHANGELOG notes (or takes
 * `--bump`, `--set-version` and `--notes`) and delegates to
 * `create-version.js`, which keeps its validated flow: metadata, full checks,
 * checksum-addressed tarball, metadata commit and push, and `npm publish`.
 * An interrupted release resumes only the missing stages with the same
 * building blocks (`prepareRelease`, `commitAndPushRelease`,
 * `publish-release.js`). Running the command again always resumes from the
 * first missing stage.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import {
  MAIN_BRANCH,
  RELEASE_MODE,
  RELEASE_STEP,
  RELEASE_USAGE,
  buildNotesFromCommits,
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
  input,
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
/** Answers of the notes prompt. */
const NOTES_SOURCE = { commits: "commits", write: "write", basic: "basic" };
/** Answers of the prepared-artifact prompt. */
const ARTIFACT_CHOICE = { reuse: "reuse", prepare: "prepare" };
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
 *   gitState: ReturnType<import("./release-git.js").prepareReleaseGit> | null,
 *   expectedMetadata: Record<string, string> | null,
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
      hint: candidate.releaseType === suggestion.releaseType ? `★ sugerida: ${suggestion.reason}` : undefined,
      value: candidate.version,
    })),
    defaultIndex: candidates.findIndex((candidate) => candidate.releaseType === suggestion.releaseType),
  });
}

/**
 * Chooses the CHANGELOG notes: flags, commit subjects, typed lines or the basic entry.
 * @param {ReleaseContext} context - Release context.
 * @param {string} version - Next version.
 * @returns {Promise<string[]>} Notes; empty means the basic entry of `create-version`.
 */
async function chooseNotes(context, version) {
  if (context.options.notes.length > 0) return context.options.notes;
  const commitNotes = buildNotesFromCommits(context.state.unreleasedCommits);
  const source = await select({
    message: "¿Qué notas va a tener el CHANGELOG?",
    options: [
      ...(commitNotes.length > 0 ? [{ label: `Usar los commits (${commitNotes.length})`, hint: "sin prefijos convencionales", value: NOTES_SOURCE.commits }] : []),
      { label: "Escribirlas ahora", hint: "una por línea, Enter vacío para terminar", value: NOTES_SOURCE.write },
      { label: "Nota básica", hint: `"Actualiza el paquete a la versión ${version}."`, value: NOTES_SOURCE.basic },
    ],
  });
  if (source === NOTES_SOURCE.commits) return commitNotes;
  if (source === NOTES_SOURCE.basic) return [];
  const notes = [];
  for (;;) {
    const note = await input(`Nota ${notes.length + 1}:`);
    if (!note) break;
    notes.push(note);
  }
  return notes;
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
 * Asks version and notes, then runs the whole `create-version` flow.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function createVersionStep(context) {
  print(renderList(`Qué se publica (${context.state.unreleasedCommits.length} commit(s))`, context.state.unreleasedCommits.map((commit) => commit.subject)));
  const version = await chooseVersion(context);
  const notes = await chooseNotes(context, version);
  print(renderList(`CHANGELOG · ${version}`, notes.length > 0 ? notes : [`Actualiza el paquete a la versión ${version}.`], BOX_TONE.info));
  const proceed = await confirm(`¿Publicar beez-ui@${version}? Valida todo (varios minutos), commitea, pushea a ${MAIN_BRANCH} y publica en npm.`);
  if (!proceed) {
    print(`${ICON.warning} ${paint("yellow", "Release cancelado. No se tocó nada.")}`);
    throw new ReleaseCancelledError();
  }
  const noteArguments = notes.flatMap((note) => ["--notes", note]);
  const exitCode = await runInherited(process.execPath, [join(root, "scripts", "create-version.js"), version, ...noteArguments], { cwd: root });
  if (exitCode !== 0) {
    throw new ReleaseStepError(
      `create-version terminó con código ${exitCode}.`,
      `Corregí el error de arriba y corré pnpm release: detecta que ${version} no está en npm y retoma solo lo que falte (sin volver a subir la versión).`,
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
  const { prepareReleaseGit, readReleaseMetadata } = await import("./release-git.js");
  // Capture the checkout before validations so commitAndPushRelease detects concurrent edits.
  context.gitState = prepareReleaseGit(root);
  context.expectedMetadata = readReleaseMetadata(root);
  const existing = findPreparedArchive(root, packageName, versions.workingTree);
  if (existing) {
    const choice = await select({
      message: `Ya hay un artefacto preparado para ${versions.workingTree}. ¿Qué hacemos?`,
      options: [
        { label: "Reusarlo", hint: "release:publish vuelve a verificar checksum y contenido", value: ARTIFACT_CHOICE.reuse },
        { label: "Preparar de nuevo", hint: "corre todas las validaciones otra vez", value: ARTIFACT_CHOICE.prepare },
      ],
    });
    if (choice === ARTIFACT_CHOICE.reuse) {
      context.archive = existing;
      print(`${ICON.success} Se reusa ${existing}.`);
      return;
    }
  }
  const { prepareRelease } = await import("./prepare-release.js");
  try {
    context.archive = prepareRelease();
  } catch (error) {
    throw new ReleaseStepError(`La preparación de ${versions.workingTree} falló.`, "Corregí el error de arriba y corré pnpm release: retoma desde la preparación.", error);
  }
}

/**
 * Commits and pushes the release metadata left uncommitted.
 * @param {ReleaseContext} context - Release context.
 * @returns {Promise<void>}
 */
async function commitAndPushMetadataStep(context) {
  const { commitAndPushRelease } = await import("./release-git.js");
  const version = context.state.versions.workingTree;
  try {
    commitAndPushRelease(root, /** @type {NonNullable<ReleaseContext["gitState"]>} */ (context.gitState), version, /** @type {Record<string, string>} */ (context.expectedMetadata));
  } catch (error) {
    throw new ReleaseStepError(
      `No se pudo commitear o pushear la metadata de ${version}: ${error instanceof Error ? error.message : String(error)}`,
      "Resolvé el estado de Git y corré pnpm release: si el commit quedó en local, solo lo pushea.",
      error,
    );
  }
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
    "Resolvé el problema (¿main avanzó en origin?) y corré pnpm release.",
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
  if (!(await confirm(`¿Publicar ${archive} como beez-ui@${version} (latest) en npm?`))) {
    print(`${ICON.warning} ${paint("yellow", "Publicación cancelada. Corré pnpm release cuando quieras publicarla.")}`);
    throw new ReleaseCancelledError();
  }
  const exitCode = await runInherited(process.execPath, [join(root, "scripts", "publish-release.js"), archive], { cwd: root });
  if (exitCode !== 0) {
    throw new ReleaseStepError(`npm publish terminó con código ${exitCode}.`, `Comprobá en npm si ${version} llegó; si no, corré pnpm release para reintentar solo la publicación.`);
  }
  await verifyPublished(context, version);
}

/** Executors of each plan step. */
const STEP_EXECUTORS = {
  [RELEASE_STEP.syncMain]: syncMainStep,
  [RELEASE_STEP.createVersion]: createVersionStep,
  [RELEASE_STEP.prepareArtifact]: prepareArtifactStep,
  [RELEASE_STEP.commitAndPushMetadata]: commitAndPushMetadataStep,
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
        notes: { type: "string", multiple: true, short: "n" },
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

  print(renderBanner({ projectName: "beez-ui", version: await (async () => {
    const reader = createGitReader(root);
    const manifest = await reader.tryGit(["show", "HEAD:package.json"]);
    return manifest ? JSON.parse(manifest).version : null;
  })() }));

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
  if (plan.blockers.length > 0) return FAILURE_EXIT_CODE;

  if (plan.mode === RELEASE_MODE.newRelease) {
    try {
      resolveRequestedVersion(state.versions.workingTree, options);
    } catch (error) {
      print(`${ICON.failure} ${paint("red", error instanceof Error ? error.message : String(error))}`);
      return FAILURE_EXIT_CODE;
    }
  } else if (options.bump || options.setVersion || options.notes.length > 0) {
    print(`${ICON.warning} ${paint("yellow", `Se ignoran --bump, --set-version y --notes: se retoma ${state.versions.workingTree}, que ya tiene versión y notas.`)}`);
  }

  if (options.dryRun) {
    print(`${ICON.info} ${paint("cyan", "--dry-run: no se cambió nada. Corré pnpm release para ejecutar el plan.")}`);
    return 0;
  }
  if (plan.mode === RELEASE_MODE.resume && !(await confirm("¿Retomamos el release pendiente?"))) {
    print(`${ICON.warning} ${paint("yellow", "Release cancelado. No se tocó nada.")}`);
    return 0;
  }

  /** @type {ReleaseContext} */
  const context = { state, options, archive: null, gitState: null, expectedMetadata: null, publishedVersion: null };
  for (const [index, step] of plan.steps.entries()) {
    print(renderStepHeader(index + 1, plan.steps.length, step.title));
    try {
      await STEP_EXECUTORS[step.id](context);
    } catch (error) {
      if (error instanceof ReleaseCancelledError) return 0;
      const lines = [`${ICON.failure} ${error instanceof Error ? error.message : String(error)}`];
      if (error instanceof ReleaseStepError) lines.push("", `${paint("bold", "Qué hacer:")} ${error.hint}`);
      lines.push("", paint("gray", "pnpm release retoma desde el primer paso que falte."));
      print(renderBox({ title: `Falló el paso ${index + 1}: ${step.title}`, lines, tone: BOX_TONE.danger }));
      return FAILURE_EXIT_CODE;
    }
  }

  const version = context.publishedVersion;
  print("");
  print(renderBox({
    title: version ? `▲ beez-ui@${version} publicado` : "Listo",
    lines: version
      ? [
          `${ICON.success} ${paint("bold", "npm")}        https://www.npmjs.com/package/beez-ui/v/${version}`,
          `${ICON.success} ${paint("bold", "Git")}        commit de release en ${MAIN_BRANCH}`,
          `${ICON.info} ${paint("bold", "Consumidores")} pnpm add beez-ui@^${version}`,
          "",
          paint("gray", `Tiempo total: ${formatDuration(Date.now() - startedAt)}`),
        ]
      : [`${ICON.success} Plan completado en ${formatDuration(Date.now() - startedAt)}.`],
    tone: BOX_TONE.success,
  }));
  return 0;
}

main().then((exitCode) => {
  process.exitCode = exitCode;
});
