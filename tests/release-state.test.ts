// @vitest-environment node
/** Reads the release snapshot from disposable Git repositories with a real bare remote. */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ownedPath } from "../scripts/owned-path.js";
import { buildReleasePlan, RELEASE_MODE } from "../scripts/release-plan.js";
import { collectReleaseState, findPreparedArchive } from "../scripts/release-state.js";
import { stripVTControlCharacters } from "node:util";
import { renderBox, resolveNumberKey, visibleWidth } from "../scripts/terminal-ui.js";

/** Real Git processes need an integration timeout under parallel CI load. */
const GIT_TEST_TIMEOUT_MS = 30_000;

let directory: string;
let repository: string;
let remote: string;

/** Runs Git confined to a fixture repository. */
function git(cwd: string, ...args: string[]) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Configures an isolated identity without the user's hooks or signing. */
function configure(cwd: string) {
  git(cwd, "config", "user.name", "Release Test");
  git(cwd, "config", "user.email", "release@example.invalid");
  git(cwd, "config", "commit.gpgSign", "false");
  git(cwd, "config", "core.hooksPath", join(directory, "hooks"));
}

/** Writes the manifest with a version. */
function writeManifest(cwd: string, version: string) {
  writeFileSync(join(cwd, "package.json"), `${JSON.stringify({ name: "beez-ui", version }, null, 2)}\n`);
}

/** Reads the state with a registry double that publishes the given versions. */
function collect(publishedVersions: string[]) {
  return collectReleaseState({
    root: repository,
    npmLookup: async (_name, version) => ({
      status: "ok",
      latest: publishedVersions.at(-1) ?? null,
      workingTreeVersionPublished: publishedVersions.includes(version),
      reason: null,
    }),
  });
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "beez-release-state-"));
  repository = join(directory, "repository");
  remote = join(directory, "remote.git");
  mkdirSync(repository);
  mkdirSync(join(directory, "hooks"));
  git(directory, "init", "--quiet", "--bare", "--initial-branch=main", remote);
  git(repository, "init", "--quiet", "--initial-branch=main");
  configure(repository);
  writeManifest(repository, "0.6.0");
  writeFileSync(join(repository, "CHANGELOG.md"), "# Cambios\n\n## 0.6.0\n\n- Anterior.\n");
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "chore(release): prepara la versión 0.6.0");
  writeFileSync(join(repository, "glide.txt"), "glide");
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "feat: agrega glide slots");
  git(repository, "remote", "add", "origin", remote);
  git(repository, "push", "--quiet", "--set-upstream", "origin", "main");
}, GIT_TEST_TIMEOUT_MS);

afterEach(() => rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true }));

it("should list commits after the last version change as unreleased", async () => {
  const state = await collect(["0.6.0"]);
  expect(state.upstream).toEqual({ remote: "origin", mergeRef: "refs/heads/main", ref: "origin/main" });
  expect(state.unreleasedCommits.map((commit) => commit.subject)).toEqual(["feat: agrega glide slots"]);
  expect(state.versions).toEqual({ workingTree: "0.6.0", head: "0.6.0", upstream: "0.6.0" });
  expect(buildReleasePlan(state).mode).toBe(RELEASE_MODE.newRelease);
}, GIT_TEST_TIMEOUT_MS);

it("should keep porcelain paths intact and detect uncommitted release metadata", async () => {
  writeManifest(repository, "0.7.0");
  writeFileSync(join(repository, "CHANGELOG.md"), "# Cambios\n\n## 0.7.0\n\n- Glide.\n");
  const state = await collect(["0.6.0"]);
  expect(state.changedPaths.sort()).toEqual(["CHANGELOG.md", "package.json"]);
  expect(state.versions).toEqual({ workingTree: "0.7.0", head: "0.6.0", upstream: "0.6.0" });
  expect(buildReleasePlan(state).mode).toBe(RELEASE_MODE.resume);
}, GIT_TEST_TIMEOUT_MS);

it("should count commits another clone pushed", async () => {
  const other = join(directory, "other");
  git(directory, "clone", "--quiet", remote, other);
  configure(other);
  writeFileSync(join(other, "fix.txt"), "fix");
  git(other, "add", ".");
  git(other, "commit", "--quiet", "-m", "fix: corrige glide");
  git(other, "push", "--quiet");
  const state = await collect(["0.6.0"]);
  expect(state.sync.behindCount).toBe(1);
  expect(state.unreleasedCommits).toHaveLength(2);
}, GIT_TEST_TIMEOUT_MS);

it("should find an artifact prepared for the current version", () => {
  const prepared = join(repository, "releases", "0.6.0-abc");
  mkdirSync(prepared, { recursive: true });
  writeFileSync(join(prepared, "beez-ui-0.6.0.tgz"), "");
  expect(findPreparedArchive(repository, "beez-ui", "0.6.0")).toBe("releases/0.6.0-abc/beez-ui-0.6.0.tgz");
  expect(findPreparedArchive(repository, "beez-ui", "0.7.0")).toBeNull();
});

it("should wrap long box lines by words, never truncate them, and keep every line aligned", () => {
  const sentence = "Corregí el error y corré pnpm create-version: retoma solo lo que falte sin volver a subir la versión.";
  const box = renderBox({ title: "Plan", lines: ["corto", `→ ${sentence}`], width: 40 }).split("\n");
  const bodyText = box.slice(2, -1).map((line) => stripVTControlCharacters(line).slice(2, -2).trim()).join(" ");
  expect(new Set(box.map((line) => visibleWidth(line)))).toEqual(new Set([40]));
  expect(box.join("\n")).not.toContain("…");
  expect(bodyText).toBe(`→ ${sentence}`);
  expect(stripVTControlCharacters(box[3]).startsWith("│   ")).toBe(true);
});

it("should reopen colors on every wrapped line and split words wider than the box", () => {
  const box = renderBox({ lines: [`\x1b[31mhttps://example.test/${"x".repeat(60)}\x1b[39m`], width: 30 }).split("\n");
  expect(new Set(box.map((line) => visibleWidth(line)))).toEqual(new Set([30]));
  expect(box.slice(1, -1).every((line) => line.includes("\x1b[31m"))).toBe(true);
  expect(box.join("\n")).not.toContain("…");
});

it("should move a title that does not fit in the border inside the box", () => {
  const box = renderBox({ title: "Falló el paso 1: Crear y publicar la nueva versión", lines: ["detalle"], width: 30 });
  expect(stripVTControlCharacters(box.split("\n")[0])).toBe(`╭${"─".repeat(28)}╮`);
  expect(stripVTControlCharacters(box)).toContain("Falló el paso 1:");
});

describe("numbered prompt options", () => {
  it("should pick an option with its number key and ignore keys outside the listed options", () => {
    expect(resolveNumberKey("1", 3)).toBe(0);
    expect(resolveNumberKey("3", 3)).toBe(2);
    expect(resolveNumberKey("4", 3)).toBe(-1);
    expect(resolveNumberKey("0", 3)).toBe(-1);
    expect(resolveNumberKey("a", 3)).toBe(-1);
    expect(resolveNumberKey(undefined, 3)).toBe(-1);
  });
});
