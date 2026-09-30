import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { SemanticGraph } from "../nucleo/grafo/SemanticGraph";
import {
  buildGoodleProject,
  createBuildReport,
  GOODLE_RUNTIME_EXECUTORS_V1,
  type WorkspaceFileSink,
} from "../nucleo/manifestacao";

type ParsedBuildArgs = {
  graphPath: string;
  kind: string;
  adapter: string;
  version: string;
  mode: "DRY_RUN" | "APPLY";
  overwrite: "DENY" | "ALLOW";
  root?: string;
};

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

export function parseBuildArgs(args: string[]): ParsedBuildArgs {
  const graphPath = valueAfter(args, "--graph");
  const kind = valueAfter(args, "--kind");
  const adapter = valueAfter(args, "--adapter");
  const version = valueAfter(args, "--version");
  const apply = args.includes("--apply");
  const dryRun = args.includes("--dry-run");

  if (!graphPath) throw new Error("BUILD_GRAPH_REQUIRED");
  if (!kind) throw new Error("BUILD_KIND_REQUIRED");
  if (!adapter) throw new Error("BUILD_ADAPTER_REQUIRED");
  if (!version) throw new Error("BUILD_VERSION_REQUIRED");
  if (apply && dryRun) throw new Error("BUILD_MODE_CONFLICT");

  return {
    graphPath,
    kind,
    adapter,
    version,
    mode: apply ? "APPLY" : "DRY_RUN",
    overwrite: args.includes("--overwrite") ? "ALLOW" : "DENY",
    root: valueAfter(args, "--root"),
  };
}

export function createNodeWorkspaceSink(): WorkspaceFileSink {
  return {
    exists: (path) => existsSync(path),
    write: (path, content) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, "utf8");
    },
  };
}

export function runBuildCommand(args: string[]) {
  const parsed = parseBuildArgs(args);
  const graph = JSON.parse(readFileSync(parsed.graphPath, "utf8")) as SemanticGraph;

  const result = buildGoodleProject({
    graph,
    target: {
      kind: parsed.kind as never,
      adapter: parsed.adapter,
      version: parsed.version,
    },
    sink: createNodeWorkspaceSink(),
    executors: GOODLE_RUNTIME_EXECUTORS_V1,
    mode: parsed.mode,
    overwrite: parsed.overwrite,
    root: parsed.root,
  });

  return createBuildReport(result);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const report = runBuildCommand(process.argv.slice(2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.status === "BLOCKED" ? 2 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
