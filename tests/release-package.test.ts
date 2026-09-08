// @vitest-environment node
/** Exercises the tarball as a real JavaScript and TypeScript consumer without Next.js. */
import { execFileSync, execSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { ownedPath } from "../scripts/owned-path.js";
import { validatePackageContents } from "../scripts/release-checks.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

it("should render and filter from the installed archive without Next or a TypeScript loader", () => {
  const packing = mkdtempSync(join(root, ".package-test-"));
  const consumer = mkdtempSync(join(tmpdir(), "beez-consumer-"));
  try {
    execSync(`pnpm --ignore-scripts pack --pack-destination ${basename(packing)}`, { cwd: root, stdio: "pipe" });
    const archive = readdirSync(packing).find(file => file.endsWith(".tgz"));
    expect(archive).toBeDefined();
    const archivePath = join(packing, archive!);
    const metadata = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const entries = execFileSync("tar", ["-tf", archivePath], { encoding: "utf8" }).trim().split(/\r?\n/u);
    validatePackageContents(metadata, entries);
    execFileSync("tar", ["-xf", archivePath, "-C", consumer]);
    const modules = join(consumer, "node_modules");
    mkdirSync(modules);
    symlinkSync(join(consumer, "package"), join(modules, "beez-ui"), "junction");
    const dependencies = new Set([
      ...Object.keys(metadata.dependencies),
      ...Object.keys(metadata.peerDependencies).filter(name => !metadata.peerDependenciesMeta?.[name]?.optional),
      "@types/react", "@types/react-dom",
    ]);
    for (const dependency of dependencies) {
      const link = join(modules, dependency);
      mkdirSync(dirname(link), { recursive: true });
      symlinkSync(realpathSync(join(root, "node_modules", dependency)), link, "junction");
    }
    writeFileSync(join(consumer, "package.json"), '{"type":"module"}');
    writeFileSync(join(consumer, "consumer.mjs"), `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, parseFilterQuery, parseYearMonthFilterInput } from "beez-ui";
assert.throws(() => createRequire(import.meta.url).resolve("next"));
const html = renderToStaticMarkup(createElement(Button, { disabled: true }, "Guardar"));
assert.match(html, /<button[^>]*disabled/);
assert.match(html, /Guardar<\\/button>/);
assert.equal(parseFilterQuery("luz", [{ key: "", kind: "text", label: "Texto" }]).descriptionFilter, "luz");
assert.equal(parseYearMonthFilterInput("09/2026"), 202609);
`);
    execFileSync(process.execPath, [join(consumer, "consumer.mjs")], { cwd: consumer, env: { ...process.env, NODE_PATH: "" }, stdio: "pipe" });
    writeFileSync(join(consumer, "consumer.ts"), `
import { Button, parseFilterQuery, type BeezUIComponents } from "beez-ui";
import type { ComponentProps } from "react";
const button: ComponentProps<typeof Button> = { variant: "outline", children: "Guardar" };
const components: BeezUIComponents = {};
const result: string = parseFilterQuery("luz", []).descriptionFilter;
void [button, components, result];
`);
    writeFileSync(join(consumer, "tsconfig.json"), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, skipLibCheck: true, module: "NodeNext", target: "ES2022", jsx: "react-jsx", types: [] }, files: ["consumer.ts"] }));
    const compilerRoot = dirname(require.resolve("@typescript/native/package.json"));
    execFileSync(process.execPath, [join(compilerRoot, require("@typescript/native/package.json").bin.tsc), "--project", consumer], { stdio: "pipe" });
  } finally {
    // Node removes owned junction entries without following their external targets.
    rmSync(ownedPath(root, packing), { recursive: true, force: true });
    rmSync(ownedPath(tmpdir(), consumer), { recursive: true, force: true });
  }
}, 60000);
