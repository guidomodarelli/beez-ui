// @vitest-environment node
/** Covers the pure decisions of `pnpm create-version`: flags, allowed versions, suggestions and plans. */
import { describe, expect, it } from "vitest";
import {
  RELEASE_MODE,
  RELEASE_STEP,
  buildNotesFromCommits,
  buildReleasePlan,
  listNextVersions,
  normalizeReleaseOptions,
  resolveRequestedVersion,
  suggestReleaseType,
  type ReleaseState,
} from "../scripts/release-plan.js";

/** Builds a clean `main` snapshot whose version is already on npm. */
function createState(overrides: Partial<ReleaseState> = {}): ReleaseState {
  return {
    currentBranch: "main",
    upstream: { remote: "origin", mergeRef: "refs/heads/main", ref: "origin/main" },
    workingTreeChanges: [],
    changedPaths: [],
    versions: { workingTree: "0.6.0", head: "0.6.0", upstream: "0.6.0" },
    npm: { status: "ok", latest: "0.6.0", workingTreeVersionPublished: true, reason: null },
    sync: { aheadCommits: [], behindCount: 0 },
    unreleasedCommits: [{ subject: "feat: agrega glide slots" }],
    preparedArchive: null,
    ...overrides,
  };
}

/** Builds a snapshot whose `package.json` holds a version npm does not have yet. */
function createResumeState(overrides: Partial<ReleaseState> = {}): ReleaseState {
  return createState({
    versions: { workingTree: "0.7.0", head: "0.7.0", upstream: "0.7.0" },
    npm: { status: "ok", latest: "0.6.0", workingTreeVersionPublished: false, reason: null },
    unreleasedCommits: [],
    ...overrides,
  });
}

/** Returns only the planned step identifiers. */
function stepIds(state: ReleaseState) {
  return buildReleasePlan(state).steps.map((step) => step.id);
}

describe("versions and options", () => {
  it("should offer only the next patch, minor and major versions", () => {
    expect(listNextVersions("0.6.0").map((candidate) => candidate.version)).toEqual(["0.6.1", "0.7.0", "1.0.0"]);
  });

  it("should reject versions that are not greater or skip a patch, minor or major", () => {
    expect(resolveRequestedVersion("0.6.0", { setVersion: "0.7.0" })).toEqual({ releaseType: "minor", version: "0.7.0" });
    for (const skipped of ["0.6.2", "0.8.0", "2.0.0", "0.6.0", "0.5.9"]) {
      expect(() => resolveRequestedVersion("0.6.0", { setVersion: skipped })).toThrow(/Opciones: 0\.6\.1, 0\.7\.0, 1\.0\.0/u);
    }
    expect(() => resolveRequestedVersion("0.6.0", { setVersion: "0.7.0-beta.1" })).toThrow(/versión estable/u);
    expect(resolveRequestedVersion("0.6.0", { bump: "patch" })?.version).toBe("0.6.1");
    expect(resolveRequestedVersion("0.6.0", {})).toBeNull();
  });

  it("should validate the command-line options", () => {
    expect(normalizeReleaseOptions({ "set-version": "v0.7.0", notes: ["Agrega glide"], "dry-run": true })).toEqual({
      bump: null,
      setVersion: "0.7.0",
      notes: ["Agrega glide"],
      dryRun: true,
      help: false,
    });
    expect(() => normalizeReleaseOptions({ bump: "huge" })).toThrow(/--bump espera/u);
    expect(() => normalizeReleaseOptions({ bump: "patch", "set-version": "0.6.1" })).toThrow(/no los dos/u);
    expect(() => normalizeReleaseOptions({ notes: [" "] })).toThrow(/--notes/u);
  });

  it("should suggest the increment from conventional and legacy subjects", () => {
    expect(suggestReleaseType([{ subject: "fix: corrige salidas interrumpidas" }]).releaseType).toBe("patch");
    expect(suggestReleaseType([{ subject: "add glide slots and surface animations" }]).releaseType).toBe("minor");
    expect(suggestReleaseType([{ subject: "feat!: elimina el provider legado" }]).releaseType).toBe("major");
    expect(suggestReleaseType([{ subject: "chore(release): prepara la versión 0.6.0" }]).releaseType).toBe("patch");
  });

  it("should turn commit subjects into CHANGELOG notes, oldest first", () => {
    expect(
      buildNotesFromCommits([
        { subject: "fix: corrige salidas interrumpidas" },
        { subject: "chore(release): prepara la versión 0.6.0" },
        { subject: "add glide slots" },
      ]),
    ).toEqual(["Add glide slots", "Corrige salidas interrumpidas"]);
  });
});

describe("release plan", () => {
  it("should create a new version when main has unreleased commits", () => {
    const plan = buildReleasePlan(createState());
    expect(plan.mode).toBe(RELEASE_MODE.newRelease);
    expect(plan.steps.map((step) => step.id)).toEqual([RELEASE_STEP.createVersion]);
  });

  it("should update main before creating the version and warn about local commits pushed with it", () => {
    expect(stepIds(createState({ sync: { aheadCommits: [], behindCount: 2 } }))).toEqual([RELEASE_STEP.syncMain, RELEASE_STEP.createVersion]);
    expect(buildReleasePlan(createState({ sync: { aheadCommits: [{ subject: "fix: local" }], behindCount: 0 } })).warnings).toHaveLength(1);
  });

  it("should report that everything is published", () => {
    const plan = buildReleasePlan(createState({ unreleasedCommits: [] }));
    expect(plan.mode).toBe(RELEASE_MODE.upToDate);
    expect(plan.steps).toEqual([]);
  });

  it("should resume uncommitted release metadata by committing it first, then preparing, pushing and publishing", () => {
    const state = createResumeState({
      versions: { workingTree: "0.7.0", head: "0.6.0", upstream: "0.6.0" },
      workingTreeChanges: [" M package.json", " M CHANGELOG.md"],
      changedPaths: ["package.json", "CHANGELOG.md"],
    });
    const plan = buildReleasePlan(state);
    expect(plan.mode).toBe(RELEASE_MODE.resume);
    expect(plan.steps.map((step) => step.id)).toEqual([
      RELEASE_STEP.commitMetadata,
      RELEASE_STEP.prepareArtifact,
      RELEASE_STEP.pushReleaseCommit,
      RELEASE_STEP.publishArtifact,
    ]);
  });

  it("should resume a local release commit by pushing it before publishing", () => {
    const state = createResumeState({ versions: { workingTree: "0.7.0", head: "0.7.0", upstream: "0.6.0" } });
    expect(stepIds(state)).toEqual([RELEASE_STEP.prepareArtifact, RELEASE_STEP.pushReleaseCommit, RELEASE_STEP.publishArtifact]);
  });

  it("should only prepare and publish a pushed version missing on npm", () => {
    expect(stepIds(createResumeState())).toEqual([RELEASE_STEP.prepareArtifact, RELEASE_STEP.publishArtifact]);
  });

  it("should block uncommitted source changes even while resuming", () => {
    const plan = buildReleasePlan(
      createResumeState({
        versions: { workingTree: "0.7.0", head: "0.6.0", upstream: "0.6.0" },
        workingTreeChanges: [" M package.json", " M src/button.tsx"],
        changedPaths: ["package.json", "src/button.tsx"],
      }),
    );
    expect(plan.steps).toEqual([]);
    expect(plan.blockers[0].title).toContain("sin commitear");
  });

  it("should block other branches, a missing upstream, npm failures and divergence", () => {
    const plan = buildReleasePlan(
      createState({
        currentBranch: "feature/glide",
        upstream: null,
        npm: { status: "unreachable", latest: null, workingTreeVersionPublished: false, reason: "ENOTFOUND" },
        sync: { aheadCommits: [{ subject: "a" }], behindCount: 1 },
      }),
    );
    expect(plan.blockers.map((blocker) => blocker.title)).toEqual([
      expect.stringContaining("solo desde main"),
      expect.stringContaining("upstream"),
      "No se pudo consultar npm",
      expect.stringContaining("divergió"),
    ]);
  });

  it("should block a local version lower than the one already on npm", () => {
    const plan = buildReleasePlan(createResumeState({ npm: { status: "ok", latest: "0.8.0", workingTreeVersionPublished: false, reason: null } }));
    expect(plan.blockers[0].title).toContain("npm ya publicó 0.8.0");
  });
});
