/** @file Emits clean ESM JavaScript, declarations and browser-ready shared CSS. */
import { execFileSync } from "node:child_process";
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { parseArgs } from "node:util";
import { ownedPath } from "./owned-path.js";
import { compileReactSources } from "./compile-react.js";

/** Exposes an explicit comparison mode; normal builds and releases always enable React Compiler. */
const { values } = parseArgs({ options: { "no-react-compiler": { type: "boolean", default: false } } });

/** Anchors generated output to the repository containing this script. */
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const compiler = require("@typescript/native/package.json");
const compilerRoot = dirname(require.resolve("@typescript/native/package.json"));
const output = ownedPath(root, join(root, "dist"));
/**
 * Builds happen in a per-process staging directory and only replace `dist` once complete, so
 * processes reading `dist` meanwhile (Storybook, browser tests, another build) never see it
 * missing or half written, and a failed build leaves the previous output intact.
 */
const staging = ownedPath(root, join(root, `.dist-build-${process.pid}`));
/** CSS entry whose class scan points at the staged JavaScript instead of `dist`. */
const stagingStylesEntry = ownedPath(root, join(root, `.dist-build-${process.pid}.css`));
const STYLES_SOURCE = "styles.source.css";
const DIST_SOURCE_DIRECTIVE = '@source "./dist/**/*.js";';

/**
 * Lists the files below a directory as paths relative to it.
 * @param {string} directory - Directory to walk.
 * @returns {Set<string>} Relative file paths.
 */
function listFiles(directory) {
  return new Set(
    readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(directory, join(entry.parentPath, entry.name))),
  );
}

/**
 * Makes `target` match `source` by overwriting files in place and then removing stale ones,
 * without ever deleting or renaming `target` itself (Windows refuses to rename watched folders).
 * @param {string} source - Complete staged output.
 * @param {string} target - Published output directory.
 * @returns {void}
 */
function publishDirectory(source, target) {
  cpSync(source, target, { recursive: true, force: true });
  const publishedFiles = listFiles(source);
  for (const file of listFiles(target)) {
    if (!publishedFiles.has(file)) rmSync(ownedPath(target, join(target, file)), { force: true });
  }
}

try {
  rmSync(staging, { recursive: true, force: true });
  execFileSync(
    process.execPath,
    [join(compilerRoot, compiler.bin.tsc), "--project", "tsconfig.build.json", "--outDir", staging],
    { cwd: root, stdio: "inherit" },
  );
  compileReactSources(root, staging, !values["no-react-compiler"]);

  /** Compiles only the library's emitted classes, independently of consumer source detection. */
  const stylesSource = readFileSync(join(root, STYLES_SOURCE), "utf8");
  if (!stylesSource.includes(DIST_SOURCE_DIRECTIVE)) {
    throw new Error(`build: ${STYLES_SOURCE} must scan the library output with ${DIST_SOURCE_DIRECTIVE}`);
  }
  writeFileSync(
    stagingStylesEntry,
    stylesSource.replace(DIST_SOURCE_DIRECTIVE, `@source "./${relative(root, staging)}/**/*.js";`),
  );
  const cssCompilerRoot = dirname(require.resolve("@tailwindcss/cli/package.json"));
  const cssCompiler = require("@tailwindcss/cli/package.json");
  execFileSync(
    process.execPath,
    [join(cssCompilerRoot, cssCompiler.bin.tailwindcss), "--input", stagingStylesEntry, "--output", join(staging, "styles.css"), "--minify"],
    { cwd: root, stdio: "inherit" },
  );

  publishDirectory(staging, output);
} finally {
  rmSync(staging, { recursive: true, force: true });
  rmSync(stagingStylesEntry, { force: true });
}
