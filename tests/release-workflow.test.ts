// @vitest-environment node
/** Verifies release ordering and failure boundaries without contacting the npm registry. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createAndPublishRelease } from "../scripts/release-workflow.js";
import { ownedPath } from "../scripts/owned-path.js";

let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "beez-workflow-"));
  writeFileSync(join(directory, "package.json"), JSON.stringify({ name: "beez-ui", version: "0.4.0" }));
  writeFileSync(join(directory, "CHANGELOG.md"), "# Cambios\n\n## 0.4.0\n\n- Anterior.\n");
});
afterEach(() => rmSync(ownedPath(tmpdir(), directory), { recursive: true, force: true }));

/** Git and npm are the workflow's own external-operation boundaries. */
function createOperations(overrides: Partial<Parameters<typeof createAndPublishRelease>[3]> = {}) {
  return {
    commit: vi.fn(() => "release-commit"),
    prepare: vi.fn(() => "releases/prepared.tgz"),
    push: vi.fn(),
    publish: vi.fn(),
    ...overrides,
  };
}

it("should publish exactly the prepared artifact after creating and committing the version", () => {
  const archive = join(directory, "releases", "checked", "beez-ui-0.4.1.tgz");
  const operations = createOperations({
    prepare: vi.fn(() => {
      expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version).toBe("0.4.1");
      return archive;
    }),
  });
  expect(createAndPublishRelease(directory, "patch", [], operations)).toEqual({ version: "0.4.1", commit: "release-commit", archive });
  expect(operations.push).toHaveBeenCalledExactlyOnceWith("release-commit");
  expect(operations.publish).toHaveBeenCalledExactlyOnceWith(archive);
});

it("should commit the metadata before the long validation, then push and publish", () => {
  const stages: string[] = [];
  createAndPublishRelease(directory, "patch", [], {
    commit: (version, metadata) => {
      expect(version).toBe("0.4.1");
      expect(JSON.parse(metadata["package.json"]).version).toBe(version);
      stages.push("commit");
      return "release-commit";
    },
    prepare: () => { stages.push("prepare"); return "releases/prepared.tgz"; },
    push: () => { stages.push("push"); },
    publish: () => { stages.push("publish"); },
  });
  expect(stages).toEqual(["commit", "prepare", "push", "publish"]);
});

it("should keep the local release commit and stop before pushing if preparation fails", () => {
  const operations = createOperations({ prepare: vi.fn(() => { throw new Error("Browser checks failed"); }) });
  expect(() => createAndPublishRelease(directory, "patch", [], operations)).toThrow(/committed locally.*pnpm create-version/u);
  expect(operations.commit).toHaveBeenCalledTimes(1);
  expect(operations.push).not.toHaveBeenCalled();
  expect(operations.publish).not.toHaveBeenCalled();
});

it("should not prepare, push or publish if the release commit fails", () => {
  const operations = createOperations({ commit: vi.fn(() => { throw new Error("Hook rejected"); }) });
  expect(() => createAndPublishRelease(directory, "patch", [], operations)).toThrow(/release commit failed/u);
  expect(operations.prepare).not.toHaveBeenCalled();
  expect(operations.push).not.toHaveBeenCalled();
  expect(operations.publish).not.toHaveBeenCalled();
  expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version).toBe("0.4.1");
});

it("should not publish if the push fails", () => {
  const operations = createOperations({ push: vi.fn(() => { throw new Error("Push rejected"); }) });
  expect(() => createAndPublishRelease(directory, "patch", [], operations)).toThrow(/Git push failed/u);
  expect(operations.publish).not.toHaveBeenCalled();
});

it("should explain how to resume when publication fails", () => {
  const operations = createOperations({ publish: vi.fn(() => { throw new Error("Authentication required"); }) });
  expect(() => createAndPublishRelease(directory, "patch", [], operations)).toThrow(/publication did not complete.*pnpm create-version/u);
  expect(operations.publish).toHaveBeenCalledTimes(1);
});

it("should reject invalid versions before committing, preparing or publishing", () => {
  const operations = createOperations();
  expect(() => createAndPublishRelease(directory, "invalid", [], operations)).toThrow(/create-version/u);
  expect(operations.commit).not.toHaveBeenCalled();
  expect(operations.prepare).not.toHaveBeenCalled();
  expect(operations.publish).not.toHaveBeenCalled();
});
