/** Verifies release metadata and archive contracts using public input fixtures. */
import { describe, expect, it } from "vitest";
import { validatePackageContents, validateReleaseMetadata } from "../scripts/release-checks.js";

const PACKAGE = {
  name: "beez-ui",
  version: "0.1.1",
  license: "MIT",
  files: ["dist", "styles.css", "theme.css", "fonts.css", "assets", "README.md", "LICENSE.md", "CHANGELOG.md"],
  exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" }, "./styles.css": "./styles.css" },
};
const ENTRIES = ["package.json", "README.md", "LICENSE.md", "CHANGELOG.md", "dist/index.js", "dist/index.d.ts", "styles.css"].map(file => `package/${file}`);

describe("release contracts", () => {
  it("should accept matching release notes in Spanish", () => {
    expect(() => validateReleaseMetadata(PACKAGE, "# Cambios\n\n## 0.1.1 - 2026-09-08\n\n- Publicación con tipos.\n")).not.toThrow();
  });

  it("should skip the [Unreleased] block and accept bracketed release headings", () => {
    const changelog = "# Cambios\n\n## [Unreleased]\n\n### Added\n\n- Próximo cambio.\n\n## [0.1.1] - 2026-09-08\n\n### Fixed\n\n- Publicación con tipos.\n";
    expect(() => validateReleaseMetadata(PACKAGE, changelog)).not.toThrow();
    expect(() => validateReleaseMetadata(PACKAGE, "## [Unreleased]\n\n- Próximo.\n\n## [0.1.0] - 2026-09-01\n\n- Anterior.\n")).toThrow(/0\.1\.1/);
  });

  it("should reject missing notes, mismatched versions and malformed versions", () => {
    expect(() => validateReleaseMetadata(PACKAGE, "## 0.1.0\n- Anterior\n")).toThrow(/changelog/i);
    expect(() => validateReleaseMetadata(PACKAGE, "## 0.1.1\n")).toThrow(/change/i);
    expect(() => validateReleaseMetadata({ ...PACKAGE, version: "01.1.0" }, "")).toThrow(/version/i);
  });

  it("should require the compiled public entrypoints", () => {
    expect(() => validatePackageContents(PACKAGE, ENTRIES)).not.toThrow();
    expect(() => validatePackageContents(PACKAGE, ENTRIES.filter(file => !file.endsWith("index.d.ts")))).toThrow(/missing/i);
  });

  it.each(["package/.env", "package/.npmrc", "package/src/index.ts", "package/tests/test.ts", "package/dist/../../secret", "outside/index.js"])("should reject unintended package content: %s", entry => {
    expect(() => validatePackageContents(PACKAGE, [...ENTRIES, entry])).toThrow(/release:/);
  });
});
