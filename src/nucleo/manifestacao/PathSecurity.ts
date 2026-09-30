const WINDOWS_DRIVE = /^[A-Za-z]:[\\/]/;
const UNC_PATH = /^(?:\\\\|\/\/)/;

export function normalizeSafeRelativePath(path: string): string {
  if (!path || path.includes("\0")) {
    throw new Error(`UNSAFE_PROJECT_PATH: ${path}`);
  }

  const normalized = path.replace(/\\/g, "/");

  if (
    normalized.startsWith("/") ||
    WINDOWS_DRIVE.test(path) ||
    UNC_PATH.test(path)
  ) {
    throw new Error(`UNSAFE_PROJECT_PATH: ${path}`);
  }

  const segments = normalized.split("/");
  if (
    segments.some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new Error(`UNSAFE_PROJECT_PATH: ${path}`);
  }

  return normalized;
}

export function normalizeSafeWorkspaceRoot(root: string): string {
  if (!root) return "";

  return normalizeSafeRelativePath(
    root.replace(/[\\/]+$/, ""),
  );
}

export function joinSafeWorkspacePath(
  root: string,
  relativePath: string,
): string {
  const cleanRoot = normalizeSafeWorkspaceRoot(root);
  const cleanRelative = normalizeSafeRelativePath(relativePath);

  return cleanRoot
    ? `${cleanRoot}/${cleanRelative}`
    : cleanRelative;
}

export function isSafeWorkspacePath(path: string): boolean {
  try {
    normalizeSafeRelativePath(path);
    return true;
  } catch {
    return false;
  }
}
