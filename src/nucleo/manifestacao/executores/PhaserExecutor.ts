import type { TargetExecutor } from "../TargetExecutionRouter";

export type PhaserArtifact = {
  artifact_type: "phaser-scene";
  runtime: "phaser";
  runtime_version: "3";
  entry: string;
  source_ir: string;
  scene_key: string;
  module_source: string;
};

function safeSceneName(id: string): string {
  const pieces = id.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const joined = pieces.map((piece) => piece[0]?.toUpperCase() + piece.slice(1)).join("");
  const normalized = joined || "GoodleScene";
  return /^[0-9]/.test(normalized) ? `Goodle${normalized}` : normalized;
}

export const phaser3Executor: TargetExecutor = ({ source }) => {
  const sceneName = safeSceneName(source.id);

  return {
    artifact_type: "phaser-scene",
    runtime: "phaser",
    runtime_version: "3",
    entry: "src/generated/GoodleScene.ts",
    source_ir: source.id,
    scene_key: sceneName,
    module_source:
      `import Phaser from "phaser";\n\n` +
      `export class ${sceneName} extends Phaser.Scene {\n` +
      `  constructor() { super(${JSON.stringify(sceneName)}); }\n` +
      `  create() {\n` +
      `    this.registry.set("goodle.source_ir", ${JSON.stringify(source.id)});\n` +
      `    this.registry.set("goodle.semantic", ${JSON.stringify(source.semantica)});\n` +
      `    this.registry.set("goodle.family", ${JSON.stringify(source.familia)});\n` +
      `  }\n` +
      `}\n`,
  } satisfies PhaserArtifact;
};
