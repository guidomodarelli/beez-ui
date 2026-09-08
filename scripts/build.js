/** @file Emits clean ESM JavaScript and declarations with the TypeScript 7 compiler. */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { ownedPath } from "./owned-path.js";

/** Anchors generated output to the repository containing this script. */
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const compiler = require("@typescript/native/package.json");
const compilerRoot = dirname(require.resolve("@typescript/native/package.json"));
const output = ownedPath(root, join(root, "dist"));
rmSync(output, { recursive: true, force: true });
execFileSync(process.execPath, [join(compilerRoot, compiler.bin.tsc), "--project", "tsconfig.build.json"], { cwd: root, stdio: "inherit" });
