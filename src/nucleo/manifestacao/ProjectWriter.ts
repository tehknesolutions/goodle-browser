import type { MaterializedArtifactTree, MaterializedFile } from "./ArtifactMaterializer";

export type WorkspaceWriteMode = "DRY_RUN" | "APPLY";
export type OverwritePolicy = "DENY" | "ALLOW";

export type WorkspaceFileSink = {
  exists(path: string): boolean;
  write(path: string, content: string): void;
};

export type ProjectWriteRequest = {
  tree: MaterializedArtifactTree;
  mode?: WorkspaceWriteMode;
  overwrite?: OverwritePolicy;
};

export type ProjectWriteEntry = {
  path: string;
  action: "CREATE" | "OVERWRITE" | "SKIP";
  media_type: MaterializedFile["media_type"];
  provenance_refs: string[];
};

export type ProjectWriteResult = {
  mode: WorkspaceWriteMode;
  root: string;
  entry: string;
  written: string[];
  skipped: string[];
  plan: ProjectWriteEntry[];
};

function normalizeRelativePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const segments = normalized.split("/");

  if (
    !normalized ||
    segments.some((segment) => segment === ".." || segment === "." || segment === "")
  ) {
    throw new Error(`UNSAFE_PROJECT_PATH: ${path}`);
  }

  return normalized;
}

function joinRoot(root: string, relativePath: string): string {
  const cleanRoot = root.replace(/\\/g, "/").replace(/\/+$/, "");
  const cleanRelative = normalizeRelativePath(relativePath);
  return cleanRoot ? `${cleanRoot}/${cleanRelative}` : cleanRelative;
}

export function planProjectWrite(
  request: ProjectWriteRequest,
  sink: Pick<WorkspaceFileSink, "exists">,
): ProjectWriteEntry[] {
  const overwrite = request.overwrite ?? "DENY";

  return request.tree.files.map((file) => {
    const path = joinRoot(request.tree.root, file.path);
    const exists = sink.exists(path);

    return {
      path,
      action: exists ? (overwrite === "ALLOW" ? "OVERWRITE" : "SKIP") : "CREATE",
      media_type: file.media_type,
      provenance_refs: [...file.provenance_refs],
    };
  });
}

export function writeMaterializedProject(
  request: ProjectWriteRequest,
  sink: WorkspaceFileSink,
): ProjectWriteResult {
  const mode = request.mode ?? "DRY_RUN";
  const plan = planProjectWrite(request, sink);
  const byPath = new Map(
    request.tree.files.map((file) => [joinRoot(request.tree.root, file.path), file]),
  );

  const written: string[] = [];
  const skipped: string[] = [];

  for (const entry of plan) {
    if (entry.action === "SKIP") {
      skipped.push(entry.path);
      continue;
    }

    if (mode === "APPLY") {
      const file = byPath.get(entry.path);
      if (!file) throw new Error(`MATERIALIZED_FILE_NOT_FOUND: ${entry.path}`);
      sink.write(entry.path, file.content);
    }

    written.push(entry.path);
  }

  return {
    mode,
    root: request.tree.root,
    entry: request.tree.entry,
    written,
    skipped,
    plan,
  };
}
