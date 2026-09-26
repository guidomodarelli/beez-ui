/**
 * @module npm-auth Supplies npm registry credentials only for the publish command.
 *
 * pnpm 12 ignores environment references in repository-controlled `.npmrc`
 * credentials and warns on every command, so the repository keeps no `.npmrc`.
 * Publishing instead writes a temporary user config outside the repository
 * that holds only the `${NPM_TOKEN}` reference (npm expands it from the
 * environment; the token itself never reaches the disk or the command line)
 * and always removes it afterwards.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Registry credential line; npm expands `${NPM_TOKEN}` from the environment. */
export const NPM_AUTH_CONFIG = "//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n";

/**
 * Runs a publish operation with a temporary npm user config that references `NPM_TOKEN`.
 * @template T
 * @param {(userConfigPath: string) => T} operation - Receives the config path for `npm --userconfig`.
 * @param {string} [parentDirectory] - Where the temporary directory is created; defaults to the OS temp directory.
 * @returns {T} The operation result.
 * @throws {Error} Rethrows operation failures after removing the temporary config.
 */
export function withNpmAuthConfig(operation, parentDirectory = tmpdir()) {
  const directory = mkdtempSync(join(parentDirectory, "beez-ui-npm-auth-"));
  const userConfigPath = join(directory, "npmrc");
  try {
    writeFileSync(userConfigPath, NPM_AUTH_CONFIG, { mode: 0o600 });
    return operation(userConfigPath);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
