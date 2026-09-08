/** @module owned-path Restricts generated filesystem operations to this repository. */
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

/**
 * Verifies a generated target before deleting, moving or creating output.
 * @param {string} root - Owning repository directory.
 * @param {string} candidate - Generated path inside the repository.
 * @returns {string} Absolute verified target.
 * @throws {Error} When a path escapes its owner or points through a symlink.
 */
export function ownedPath(root, candidate) {
  const owner = realpathSync(root);
  const target = resolve(candidate);
  const relativeTarget = relative(owner, target);
  if (!relativeTarget || relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
    throw new Error("release: generated path must stay inside its repository");
  }
  let ancestor = target;
  while (ancestor !== owner) {
    const entry = lstatSync(ancestor, { throwIfNoEntry: false });
    if (entry?.isSymbolicLink()) throw new Error("release: generated paths must not contain symlinks");
    if (existsSync(ancestor)) {
      const actual = relative(owner, realpathSync(ancestor));
      if (actual.startsWith("..") || isAbsolute(actual)) throw new Error("release: resolved path escapes its repository");
    }
    ancestor = dirname(ancestor);
  }
  return target;
}
