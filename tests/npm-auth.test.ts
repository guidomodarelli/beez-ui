// @vitest-environment node
/** Verifies that publish credentials live only in a temporary, token-free npm config. */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { NPM_AUTH_CONFIG, withNpmAuthConfig } from "../scripts/npm-auth.js";
import { ownedPath } from "../scripts/owned-path.js";

let parent: string;

beforeEach(() => {
  parent = mkdtempSync(join(tmpdir(), "beez-npm-auth-test-"));
});

afterEach(() => rmSync(ownedPath(tmpdir(), parent), { recursive: true, force: true }));

it("should expose a config that references NPM_TOKEN without storing the token and remove it afterwards", () => {
  let observedPath = "";
  const result = withNpmAuthConfig((userConfigPath) => {
    observedPath = userConfigPath;
    expect(readFileSync(userConfigPath, "utf8")).toBe(NPM_AUTH_CONFIG);
    expect(readFileSync(userConfigPath, "utf8")).toContain("${NPM_TOKEN}");
    return "published";
  }, parent);

  expect(result).toBe("published");
  expect(existsSync(observedPath)).toBe(false);
});

it("should remove the temporary config when publishing fails", () => {
  let observedPath = "";
  expect(() =>
    withNpmAuthConfig((userConfigPath) => {
      observedPath = userConfigPath;
      throw new Error("npm publish failed");
    }, parent),
  ).toThrow("npm publish failed");
  expect(existsSync(observedPath)).toBe(false);
});
