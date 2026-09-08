// @vitest-environment node
/** Exercises release commits and pushes against disposable local Git repositories. */
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { prepareReleaseGit, readReleaseMetadata, commitAndPushRelease } from "../scripts/release-git.js";
import { createReleaseVersion } from "../scripts/release-version.js";
import { ownedPath } from "../scripts/owned-path.js";

/** Real Git processes and hooks need an integration timeout under parallel CI load. */
const GIT_TEST_TIMEOUT_MS = 30_000;

let directory: string;
let repository: string;
let remote: string;

/** Runs actual Git operations confined to the fixture repository. */
function git(...args: string[]) {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "beez-git-"));
  repository = join(directory, "repository");
  remote = join(directory, "remote.git");
  mkdirSync(repository);
  mkdirSync(join(directory, "hooks"));
  git("init", "--bare", remote);
  git("init", "--initial-branch=main");
  git("config", "user.name", "Release Test");
  git("config", "user.email", "release@example.invalid");
  // Isolate fixture commits from the user's signing and hooks configuration.
  git("config", "commit.gpgSign", "false");
  git("config", "core.hooksPath", join(directory, "hooks"));
  writeFileSync(join(repository, "package.json"), JSON.stringify({ name: "beez-ui", version: "0.4.0" }));
  writeFileSync(join(repository, "CHANGELOG.md"), "# Cambios\n\n## 0.4.0\n\n- Anterior.\n");
  writeFileSync(join(repository, "other.txt"), "original");
  git("add", ".");
  git("commit", "-m", "Initial fixture");
  git("remote", "add", "origin", remote);
  git("push", "--set-upstream", "origin", "main");
}, GIT_TEST_TIMEOUT_MS);

afterEach(() => rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true }));

it("should commit and push only release metadata while preserving other staged changes", () => {
  writeFileSync(join(repository, "other.txt"), "pending user change");
  git("add", "other.txt");
  const state = prepareReleaseGit(repository);
  const version = createReleaseVersion(repository, "patch");
  const snapshot = readReleaseMetadata(repository);
  commitAndPushRelease(repository, state, version, snapshot);
  expect(git("show", "--format=", "--name-only", "HEAD").split(/\r?\n/u)).toEqual(["CHANGELOG.md", "package.json"]);
  expect(git("diff", "--cached", "--name-only")).toBe("other.txt");
  expect(git("--git-dir", remote, "rev-parse", "refs/heads/main")).toBe(git("rev-parse", "HEAD"));
}, GIT_TEST_TIMEOUT_MS);

it("should require an upstream before version files are changed", () => {
  git("branch", "--unset-upstream");
  expect(() => prepareReleaseGit(repository)).toThrow(/upstream/);
  expect(JSON.parse(readFileSync(join(repository, "package.json"), "utf8")).version).toBe("0.4.0");
}, GIT_TEST_TIMEOUT_MS);

it("should stop if metadata changes while validation is running", () => {
  const state = prepareReleaseGit(repository);
  const version = createReleaseVersion(repository, "patch");
  const snapshot = readReleaseMetadata(repository);
  writeFileSync(join(repository, "CHANGELOG.md"), "Concurrent edit");
  expect(() => commitAndPushRelease(repository, state, version, snapshot)).toThrow(/changed during/);
  expect(git("rev-parse", "HEAD")).toBe(state.head);
}, GIT_TEST_TIMEOUT_MS);

it("should stop if the checkout changes while validation is running", () => {
  const state = prepareReleaseGit(repository);
  const version = createReleaseVersion(repository, "patch");
  const snapshot = readReleaseMetadata(repository);
  git("switch", "-c", "another-branch");
  expect(() => commitAndPushRelease(repository, state, version, snapshot)).toThrow(/changed during/);
  expect(git("rev-parse", "HEAD")).toBe(state.head);
}, GIT_TEST_TIMEOUT_MS);

it("should preserve a competing remote commit instead of force pushing", () => {
  const state = prepareReleaseGit(repository);
  const version = createReleaseVersion(repository, "patch");
  const snapshot = readReleaseMetadata(repository);
  // Advance only the remote ref so the release push must be rejected as non-fast-forward.
  const tree = git("rev-parse", "HEAD^{tree}");
  const competing = git("commit-tree", tree, "-p", state.head, "-m", "Competing remote change");
  git("push", "origin", `${competing}:refs/heads/main`);
  expect(() => commitAndPushRelease(repository, state, version, snapshot)).toThrow();
  expect(git("--git-dir", remote, "rev-parse", "refs/heads/main")).toBe(competing);
}, GIT_TEST_TIMEOUT_MS);

it("should stop before pushing if a commit hook stages an unrelated file", () => {
  const state = prepareReleaseGit(repository);
  const version = createReleaseVersion(repository, "patch");
  const snapshot = readReleaseMetadata(repository);
  const hook = join(directory, "hooks", "pre-commit");
  writeFileSync(hook, '#!/bin/sh\nprintf "hook change" > other.txt\ngit add other.txt\n');
  chmodSync(hook, 0o755);
  expect(() => commitAndPushRelease(repository, state, version, snapshot)).toThrow(/unexpected changes/);
  expect(git("--git-dir", remote, "rev-parse", "refs/heads/main")).toBe(state.head);
}, GIT_TEST_TIMEOUT_MS);
