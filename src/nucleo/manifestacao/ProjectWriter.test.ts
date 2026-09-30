import { describe, expect, it } from "vitest";
import type { GoodleIRNode } from "../ir/GoodleIR";
import { materializeExecutionArtifact } from "./ArtifactMaterializer";
import { createManifestationTarget } from "./ManifestationGraph";
import { planProjectWrite, writeMaterializedProject } from "./ProjectWriter";
import { executeManifestationTarget } from "./TargetExecutionRouter";
import { GOODLE_RUNTIME_EXECUTORS_V1 } from "./executores";

const source: GoodleIRNode = {
  id: "ir-project-writer",
  semantica: "estrutura.interface",
  familia: "estrutura",
};

function createTree() {
  const target = createManifestationTarget(source, "web", "react", "19");
  const execution = executeManifestationTarget(
    target,
    source,
    GOODLE_RUNTIME_EXECUTORS_V1,
  );
  return materializeExecutionArtifact(execution);
}

function memorySink(initial: Record<string, string> = {}) {
  const files = new Map(Object.entries(initial));
  return {
    files,
    exists: (path: string) => files.has(path),
    write: (path: string, content: string) => {
      files.set(path, content);
    },
  };
}

describe("M12 Project Writer", () => {
  it("builds a dry-run plan without mutating the workspace", () => {
    const tree = createTree();
    const sink = memorySink();

    const result = writeMaterializedProject({ tree }, sink);

    expect(result.mode).toBe("DRY_RUN");
    expect(result.written).toHaveLength(3);
    expect(sink.files.size).toBe(0);
    expect(result.plan.every((entry) => entry.action === "CREATE")).toBe(true);
  });

  it("applies the complete materialized tree", () => {
    const tree = createTree();
    const sink = memorySink();

    const result = writeMaterializedProject({ tree, mode: "APPLY" }, sink);

    expect(result.written).toHaveLength(3);
    expect(sink.files.has(".goodle/generated/manifest.json")).toBe(true);
    expect(sink.files.has(".goodle/generated/provenance.json")).toBe(true);
    expect(sink.files.has(".goodle/generated/src/generated/GoodleArtifact.tsx")).toBe(true);
  });

  it("denies overwrite by default", () => {
    const tree = createTree();
    const existing = ".goodle/generated/manifest.json";
    const sink = memorySink({ [existing]: "KEEP" });

    const result = writeMaterializedProject({ tree, mode: "APPLY" }, sink);

    expect(result.skipped).toContain(existing);
    expect(sink.files.get(existing)).toBe("KEEP");
  });

  it("allows overwrite only when explicitly requested", () => {
    const tree = createTree();
    const existing = ".goodle/generated/manifest.json";
    const sink = memorySink({ [existing]: "OLD" });

    const result = writeMaterializedProject(
      { tree, mode: "APPLY", overwrite: "ALLOW" },
      sink,
    );

    expect(result.plan.find((entry) => entry.path === existing)?.action).toBe("OVERWRITE");
    expect(sink.files.get(existing)).not.toBe("OLD");
  });

  it("rejects unsafe paths before writing", () => {
    const tree = createTree();
    const unsafe = {
      ...tree,
      files: [
        ...tree.files,
        {
          path: "../escape.ts",
          content: "unsafe",
          media_type: "text/typescript" as const,
          provenance_refs: [source.id],
        },
      ],
    };

    expect(() => planProjectWrite({ tree: unsafe }, memorySink())).toThrow(
      "UNSAFE_PROJECT_PATH: ../escape.ts",
    );
  });
});
