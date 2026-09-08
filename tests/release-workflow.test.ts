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

it("should publish exactly the prepared artifact after creating the version", () => {
  const archive = join(directory, "releases", "checked", "beez-ui-0.4.1.tgz");
  // Preparation and publication are the workflow's own external-operation boundaries.
  const prepare = vi.fn(() => {
    expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version).toBe("0.4.1");
    return archive;
  });
  const publish = vi.fn();
  expect(createAndPublishRelease(directory, "patch", [], { prepare, commitAndPush: vi.fn(), publish })).toEqual({ version: "0.4.1", archive });
  expect(prepare).toHaveBeenCalledTimes(1);
  expect(publish).toHaveBeenCalledExactlyOnceWith(archive);
});

it("should stop before publishing if preparation fails", () => {
  const failure = new Error("Browser checks failed");
  const publish = vi.fn();
  expect(() => createAndPublishRelease(directory, "patch", [], { prepare: () => { throw failure; }, commitAndPush: vi.fn(), publish })).toThrow(/release:prepare/);
  expect(publish).not.toHaveBeenCalled();
  expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version).toBe("0.4.1");
});

it("should retain the prepared version and give a publication retry command", () => {
  const failure = new Error("Authentication required");
  const archive = join(directory, "releases", "checked", "beez-ui-0.4.1.tgz");
  const publish = vi.fn(() => { throw failure; });
  expect(() => createAndPublishRelease(directory, "patch", [], { prepare: () => archive, commitAndPush: vi.fn(), publish })).toThrow(/release:publish/);
  expect(publish).toHaveBeenCalledTimes(1);
  expect(JSON.parse(readFileSync(join(directory, "package.json"), "utf8")).version).toBe("0.4.1");
});

it("should reject invalid versions before preparing or publishing", () => {
  const prepare = vi.fn();
  const publish = vi.fn();
  expect(() => createAndPublishRelease(directory, "invalid", [], { prepare, commitAndPush: vi.fn(), publish })).toThrow(/create-version/);
  expect(prepare).not.toHaveBeenCalled();
  expect(publish).not.toHaveBeenCalled();
});

it("should not publish if the release commit or push fails", () => {
  const publish = vi.fn();
  const failure = new Error("Push rejected");
  expect(() => createAndPublishRelease(directory, "patch", [], {
    prepare: () => "releases/prepared.tgz",
    commitAndPush: () => { throw failure; },
    publish,
  })).toThrow(/Git commit or push failed/);
  expect(publish).not.toHaveBeenCalled();
});

it("should commit and push after preparation and before publication", () => {
  const stages: string[] = [];
  createAndPublishRelease(directory, "patch", [], {
    prepare: () => { stages.push("prepare"); return "releases/prepared.tgz"; },
    commitAndPush: (version, metadata) => {
      expect(version).toBe("0.4.1");
      expect(JSON.parse(metadata["package.json"]).version).toBe(version);
      stages.push("git");
    },
    publish: () => { stages.push("publish"); },
  });
  expect(stages).toEqual(["prepare", "git", "publish"]);
});
