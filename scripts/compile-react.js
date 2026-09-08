/** @module compile-react Emits library JavaScript using the Rust React Compiler before TS/JSX lowering. */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import console from "node:console";
import { transformSync } from "oxc-transform-react";
import { parseSync } from "oxc-parser";
import { ownedPath } from "./owned-path.js";

/** Matches implementation sources while declaration inputs are excluded separately. */
const SOURCE_EXTENSION = /\.tsx?$/u;
/** Built-in runtime used by compiled React 19 components. */
const COMPILER_RUNTIME = "react/compiler-runtime";
/** Identifies modules that can use the client memo-cache runtime. */
const CLIENT_DIRECTIVE = "use client";

/**
 * Reads the actual directive prologue, including files with preceding comments.
 * @param {string} filename - Source filename used for TS/TSX parsing.
 * @param {string} source - Original module text.
 * @returns {boolean} Whether the module declares a client boundary.
 */
function hasClientDirective(filename, source) {
  const parsed = parseSync(filename, source);
  if (parsed.errors.length) throw new Error(`build: cannot classify React boundary for ${filename}: ${parsed.errors.map((error) => error.message).join("; ")}`);
  for (const statement of parsed.program.body) {
    if (statement.type !== "ExpressionStatement" || !statement.directive) break;
    if (statement.directive === CLIENT_DIRECTIVE) return true;
  }
  return false;
}

/**
 * Compiles original TypeScript/JSX while preserving ESM entrypoints and client directives.
 * @param {string} root - Owning repository directory.
 * @param {string} output - Generated output directory, already created by TypeScript.
 * @param {boolean} enabled - Whether to apply automatic memoization or emit an unoptimized comparison build.
 * @returns {void} Writes JavaScript alongside TypeScript's declarations.
 * @throws {Error} When a transform fails or compilation unexpectedly produces no optimized modules.
 */
export function compileReactSources(root, output, enabled) {
  const sourceRoot = join(root, "src");
  const sources = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && SOURCE_EXTENSION.test(entry.name) && !entry.name.endsWith(".d.ts"))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
  let optimizedModules = 0;
  for (const source of sources) {
    const filename = relative(root, source).replaceAll("\\", "/");
    const sourceText = readFileSync(source, "utf8");
    const result = transformSync(filename, sourceText, {
      sourceType: "module",
      jsx: { runtime: "automatic", development: false, refresh: false },
      // Server-compatible exports must not acquire client-only memo-cache hooks.
      reactCompiler: enabled && hasClientDirective(filename, sourceText) ? { target: "19", panicThreshold: "none" } : false,
    });
    if (result.fatal) throw new Error(`build: React transform failed for ${filename}: ${result.errors.map((error) => error.message).join("; ")}`);
    for (const diagnostic of result.errors) console.warn(`React Compiler ${filename}: ${diagnostic.message}`);
    if (result.code.includes(COMPILER_RUNTIME)) optimizedModules += 1;
    const destination = ownedPath(output, join(output, relative(sourceRoot, source).replace(SOURCE_EXTENSION, ".js")));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, result.code);
  }
  if (enabled && optimizedModules === 0) throw new Error("build: React Compiler did not optimize any module; check its configuration before releasing");
  console.log(`React Compiler (Oxc): ${enabled ? `${optimizedModules}/${sources.length} modules contain automatic memoization` : "disabled for comparison"}`);
}
