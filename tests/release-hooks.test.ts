// @vitest-environment node
/**
 * Verifies the `prepare` and `publish` hooks that `beez-rp create-version` calls
 * for beez-ui, against disposable Git repositories and real `releases/` folders.
 * The hook context is the engine's plain input contract: Git reads are real,
 * and `run` records the command line instead of launching the multi-minute
 * `release:prepare` or a real `npm publish`.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ownedPath } from "../scripts/owned-path.js";
import { findPreparedArchive, prepareReleaseArtifact, publishReleaseArtifact } from "../scripts/release-hooks.js";

/** Real Git processes need an integration timeout under parallel CI load. */
const GIT_TEST_TIMEOUT_MS = 30_000;
/** Version released by the fixtures. */
const VERSION = "0.9.0";
/** Checksum-shaped directory suffixes, as `release:prepare` names them. */
const OLDER_DIGEST = "a".repeat(64);
const NEWER_DIGEST = "b".repeat(64);
/** A modification time far before any fixture commit, in seconds. */
const STALE_TIMESTAMP_SECONDS = 1_000_000_000;

let repository: string;

/** Runs Git confined to the fixture repository. */
function git(...gitArguments: string[]) {
  return execFileSync("git", gitArguments, { cwd: repository, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Writes a prepared tarball the way `release:prepare` lays it out. */
function writeArchive(digest: string, version = VERSION) {
  const directory = join(repository, "releases", `${version}-${digest}`);
  mkdirSync(directory, { recursive: true });
  const archivePath = join(directory, `beez-ui-${version}.tgz`);
  writeFileSync(archivePath, "tarball");
  return { archivePath, relativePath: `releases/${version}-${digest}/beez-ui-${version}.tgz` };
}

/** Error thrown by the context `fail`, carrying the engine's next-action hint. */
class HookFailure extends Error {
  constructor(message: string, readonly hint: string) {
    super(message);
  }
}

/** Builds the hook context with real Git reads and recorded commands. */
function createContext({ exitCode = 0, onRun }: { exitCode?: number; onRun?: (commandLine: string) => void } = {}) {
  const commands: string[] = [];
  const printed: string[] = [];
  const context = {
    repositoryRoot: repository,
    version: VERSION as string | null,
    git: {
      tryGit: async (gitArguments: string[]) => {
        try {
          return git(...gitArguments);
        } catch {
          return null;
        }
      },
    },
    run: async (commandLine: string) => {
      commands.push(commandLine);
      onRun?.(commandLine);
      return exitCode;
    },
    print: (text = "") => {
      printed.push(text);
    },
    fail: (message: string, hint: string): never => {
      throw new HookFailure(message, hint);
    },
  };
  return { context, commands, printed };
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "beez-release-hooks-"));
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Release Test");
  git("config", "user.email", "release@example.invalid");
  git("config", "commit.gpgSign", "false");
  git("config", "core.autocrlf", "false");
  git("config", "core.hooksPath", join(repository, ".no-hooks"));
  writeFileSync(join(repository, "package.json"), `${JSON.stringify({ name: "beez-ui", version: VERSION })}\n`);
  writeFileSync(join(repository, "CHANGELOG.md"), `# Cambios\n\n## [Unreleased]\n\n## [${VERSION}] - 2026-09-26\n\n- Cambio.\n`);
  writeFileSync(join(repository, "index.js"), "export {};\n");
  git("add", ".");
  git("commit", "--quiet", "-m", VERSION);
}, GIT_TEST_TIMEOUT_MS);

afterEach(() => rmSync(ownedPath(tmpdir(), repository), { recursive: true, force: true }));

describe("findPreparedArchive", () => {
  it("should return the newest tarball of the exact version", () => {
    const older = writeArchive(OLDER_DIGEST);
    const newer = writeArchive(NEWER_DIGEST);
    utimesSync(older.archivePath, STALE_TIMESTAMP_SECONDS + 1, STALE_TIMESTAMP_SECONDS + 1);
    utimesSync(newer.archivePath, STALE_TIMESTAMP_SECONDS + 2, STALE_TIMESTAMP_SECONDS + 2);
    expect(findPreparedArchive(repository, "beez-ui", VERSION)).toBe(newer.relativePath);
  });

  it("should ignore other versions, unexpected directories and missing tarballs", () => {
    writeArchive(OLDER_DIGEST, "0.9.01");
    mkdirSync(join(repository, "releases", `${VERSION}-prepare-tmp`), { recursive: true });
    mkdirSync(join(repository, "releases", `${VERSION}-${NEWER_DIGEST}`), { recursive: true });
    expect(findPreparedArchive(repository, "beez-ui", VERSION)).toBeNull();
    rmSync(join(repository, "releases"), { recursive: true });
    expect(findPreparedArchive(repository, "beez-ui", VERSION)).toBeNull();
  });
});

describe("prepareReleaseArtifact", () => {
  it("should reuse a tarball prepared after the last code change without preparing again", async () => {
    const { relativePath } = writeArchive(NEWER_DIGEST);
    const { context, commands, printed } = createContext();
    await prepareReleaseArtifact(context);
    expect(commands).toEqual([]);
    expect(printed.join("\n")).toContain(`Se reusa ${relativePath}`);
  }, GIT_TEST_TIMEOUT_MS);

  it("should prepare again when code changed after the tarball and locate the new one", async () => {
    const stale = writeArchive(OLDER_DIGEST);
    utimesSync(stale.archivePath, STALE_TIMESTAMP_SECONDS, STALE_TIMESTAMP_SECONDS);
    let fresh = "";
    const { context, commands, printed } = createContext({ onRun: () => (fresh = writeArchive(NEWER_DIGEST).relativePath) });
    await prepareReleaseArtifact(context);
    expect(commands).toEqual(["pnpm release:prepare"]);
    expect(printed.at(-1)).toBe(`Artefacto listo: ${fresh}`);
  }, GIT_TEST_TIMEOUT_MS);

  it("should not count the version commit as a code change", async () => {
    const { archivePath } = writeArchive(NEWER_DIGEST);
    const beforeVersionCommit = Number(git("log", "-1", "--format=%ct")) + 1;
    utimesSync(archivePath, beforeVersionCommit, beforeVersionCommit);
    writeFileSync(join(repository, "package.json"), `${JSON.stringify({ name: "beez-ui", version: VERSION, description: "metadata" })}\n`);
    execFileSync("git", ["commit", "--quiet", "-am", VERSION, "--date", `@${beforeVersionCommit + 10}`], { cwd: repository, env: { ...process.env, GIT_COMMITTER_DATE: `@${beforeVersionCommit + 10}` } });
    const { context, commands } = createContext();
    await prepareReleaseArtifact(context);
    expect(commands).toEqual([]);
  }, GIT_TEST_TIMEOUT_MS);

  it("should fail with a resume hint when release:prepare fails or leaves no tarball", async () => {
    const failing = createContext({ exitCode: 1 });
    await expect(prepareReleaseArtifact(failing.context)).rejects.toMatchObject({ message: expect.stringContaining("pnpm release:prepare falló con código 1"), hint: expect.stringContaining("pnpm create-version") });
    const silent = createContext();
    await expect(prepareReleaseArtifact(silent.context)).rejects.toThrow(/sin dejar releases\/0\.9\.0-<sha256>\/beez-ui-0\.9\.0\.tgz/u);
  }, GIT_TEST_TIMEOUT_MS);
});

describe("publishReleaseArtifact", () => {
  it("should publish the tarball prepared for the version", async () => {
    const { relativePath } = writeArchive(NEWER_DIGEST);
    const { context, commands } = createContext();
    await publishReleaseArtifact(context);
    expect(commands).toEqual([`pnpm release:publish ${relativePath}`]);
  });

  it("should fail without a prepared tarball and report a failed publication", async () => {
    const missing = createContext();
    await expect(publishReleaseArtifact(missing.context)).rejects.toThrow(/No hay un tarball preparado para beez-ui@0\.9\.0/u);
    expect(missing.commands).toEqual([]);
    writeArchive(NEWER_DIGEST);
    const rejected = createContext({ exitCode: 1 });
    await expect(publishReleaseArtifact(rejected.context)).rejects.toMatchObject({ hint: expect.stringContaining("reintentar solo la publicación") });
  });

  it("should fail when the engine gives no version", async () => {
    const { context, commands } = createContext();
    context.version = null;
    await expect(publishReleaseArtifact(context)).rejects.toThrow(/no se recibió la versión/u);
    expect(commands).toEqual([]);
  });
});
