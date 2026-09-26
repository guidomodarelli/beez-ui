// @vitest-environment node
/** Verifies version creation through the actual release metadata files. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createReleaseVersion } from "../scripts/release-version.js";
import { validateReleaseMetadata } from "../scripts/release-checks.js";
import { ownedPath } from "../scripts/owned-path.js";

const METADATA = { name: "beez-ui", version: "0.4.0", scripts: { build: "node scripts/build.js" } };
const UNRELEASED = "## [Unreleased]\n\n### Added\n\n- Agrega el filtro por importe.\n\n### Fixed\n\n- Conserva $& y caracteres españoles.\n\n";
const HISTORY = `# Cambios\n\n${UNRELEASED}## 0.4.0 - 2026-09-08\n\n- Versión anterior.\n`;
let directory: string;

/** Reads the fixture release files. */
function readFiles() {
  return {
    metadata: JSON.parse(readFileSync(join(directory, "package.json"), "utf8")),
    changelog: readFileSync(join(directory, "CHANGELOG.md"), "utf8"),
  };
}

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "beez-version-"));
  writeFileSync(join(directory, "package.json"), JSON.stringify(METADATA));
  writeFileSync(join(directory, "CHANGELOG.md"), HISTORY);
});

afterEach(() => rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true }));

describe("release version creation", () => {
  it.each([["patch", "0.4.1"], ["minor", "0.5.0"], ["major", "1.0.0"], ["0.6.0", "0.6.0"]])("should release the [Unreleased] block as %s", (target, expected) => {
    const version = createReleaseVersion(directory, target, new Date("2026-09-09T00:00:00Z"));
    const { metadata, changelog } = readFiles();
    expect(version).toBe(expected);
    expect(metadata).toEqual({ ...METADATA, version: expected });
    expect(changelog).toBe(
      `# Cambios\n\n## [Unreleased]\n\n## [${expected}] - 2026-09-09\n\n### Added\n\n- Agrega el filtro por importe.\n\n### Fixed\n\n- Conserva $& y caracteres españoles.\n\n## 0.4.0 - 2026-09-08\n\n- Versión anterior.\n`,
    );
    expect(() => validateReleaseMetadata(metadata, changelog)).not.toThrow();
  });

  it.each(["0.4.0", "0.3.0", "latest", "invalid", "0.5.0-beta.1"])("should reject %s without changing release files", (target) => {
    expect(() => createReleaseVersion(directory, target)).toThrow(/create-version/);
    expect(readFiles()).toEqual({ metadata: METADATA, changelog: HISTORY });
  });

  it("should refuse to release without changes in [Unreleased]", () => {
    const empty = "# Cambios\n\n## [Unreleased]\n\n### Added\n\n## 0.4.0 - 2026-09-08\n\n- Versión anterior.\n";
    writeFileSync(join(directory, "CHANGELOG.md"), empty);
    expect(() => createReleaseVersion(directory, "patch")).toThrow(/no changes to release/);
    expect(readFiles()).toEqual({ metadata: METADATA, changelog: empty });
  });

  it("should reject sections outside the Keep a Changelog change types", () => {
    writeFileSync(join(directory, "CHANGELOG.md"), HISTORY.replace("### Fixed", "### Mejoras"));
    expect(() => createReleaseVersion(directory, "patch")).toThrow(/unknown sections \(Mejoras\)/);
    expect(readFiles().metadata).toEqual(METADATA);
  });

  it("should require an [Unreleased] block", () => {
    writeFileSync(join(directory, "CHANGELOG.md"), "# Cambios\n\n## 0.4.0 - 2026-09-08\n\n- Versión anterior.\n");
    expect(() => createReleaseVersion(directory, "patch")).toThrow(/\[Unreleased\]/);
  });
});
