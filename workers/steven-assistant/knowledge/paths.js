import { lstat, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export function isPathInside(parent, candidate) {
  const path = relative(resolve(parent), resolve(candidate));
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

export async function resolveExternalKnowledgeRoot(knowledgeRoot, repositoryRoot) {
  if (typeof knowledgeRoot !== "string" || !knowledgeRoot.trim()) {
    throw new Error("A knowledge source directory is required.");
  }
  if (typeof repositoryRoot !== "string" || !repositoryRoot.trim()) {
    throw new Error("A website repository directory is required.");
  }

  const repository = await realpath(repositoryRoot);
  const requestedRoot = resolve(knowledgeRoot);
  if (isPathInside(repository, requestedRoot)) {
    throw new Error("Knowledge must live outside the website repository.");
  }

  let rootInfo;
  try {
    rootInfo = await lstat(requestedRoot);
  } catch {
    throw new Error("The knowledge source directory does not exist or cannot be read.");
  }
  if (rootInfo.isSymbolicLink()) throw new Error("The knowledge source directory must not be a symlink.");
  if (!rootInfo.isDirectory()) throw new Error("The knowledge source directory must be a directory.");

  const sourceRoot = await realpath(requestedRoot);
  if (isPathInside(repository, sourceRoot)) {
    throw new Error("Knowledge must live outside the website repository.");
  }
  return sourceRoot;
}
