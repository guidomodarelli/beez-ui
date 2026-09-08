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
const HISTORY = "# Cambios\n\n## 0.4.0 - 2026-09-08\n\n- Versión anterior.\n";
let directory: string;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "beez-version-"));
  writeFileSync(join(directory, "package.json"), JSON.stringify(METADATA));
  writeFileSync(join(directory, "CHANGELOG.md"), HISTORY);
});

afterEach(() => rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true }));

describe("release version creation", () => {
  it.each([["patch", "0.4.1"], ["minor", "0.5.0"], ["major", "1.0.0"], ["0.6.0", "0.6.0"]])("should create %s with matching notes", (target, expected) => {
    const version = createReleaseVersion(directory, target, ["Mejora de estilos.", "  Conserva $& y caracteres españoles.\nOtra línea.  "], new Date("2026-09-09T00:00:00Z"));
    const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    const changelog = readFileSync(join(directory, "CHANGELOG.md"), "utf8");
    expect(version).toBe(expected);
    expect(metadata).toEqual({ ...METADATA, version: expected });
    expect(changelog).toContain(`## ${expected} - 2026-09-09`);
    expect(changelog).toContain("- Conserva $& y caracteres españoles. Otra línea.");
    expect(changelog).toContain("## 0.4.0 - 2026-09-08\n\n- Versión anterior.");
    expect(() => validateReleaseMetadata(metadata, changelog)).not.toThrow();
  });

  it.each(["0.4.0", "0.3.0", "latest", "invalid", "0.5.0-beta.1"])("should reject %s without changing release files", (target) => {
    expect(() => createReleaseVersion(directory, target, ["Cambios"])).toThrow(/create-version/);
    expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8"))).toEqual(METADATA);
    expect(readFileSync(join(directory, "CHANGELOG.md"), "utf8")).toBe(HISTORY);
  });

  it.each([{ label: "undefined", notes: undefined }, { label: "empty array", notes: [] }])("should create a valid version when notes are omitted: $label", ({ notes }) => {
    expect(createReleaseVersion(directory, "patch", notes)).toBe("0.4.1");
    const metadata = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    const changelog = readFileSync(join(directory, "CHANGELOG.md"), "utf8");
    expect(metadata.version).toBe("0.4.1");
    expect(changelog).toContain("- Actualiza el paquete a la versión 0.4.1.");
    expect(changelog).toContain("- Versión anterior.");
    expect(() => validateReleaseMetadata(metadata, changelog)).not.toThrow();
  });

  it.each([{ notes: [""] }, { notes: ["   "] }])("should reject explicitly empty release notes: $notes", ({ notes }) => {
    expect(() => createReleaseVersion(directory, "patch", notes)).toThrow(/notes/);
    expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8"))).toEqual(METADATA);
  });
});
