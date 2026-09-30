import type { TargetExecutorRegistry } from "../TargetExecutionRouter";
import { createRuntimeExecutorRegistry } from "./RuntimeExecutorRegistry";
import { react19Executor } from "./ReactExecutor";
import { phaser3Executor } from "./PhaserExecutor";

export const GOODLE_RUNTIME_EXECUTORS_V1: TargetExecutorRegistry =
  createRuntimeExecutorRegistry([
    {
      key: "react@19",
      adapter: "react",
      version: "19",
      executor: react19Executor,
    },
    {
      key: "phaser@3",
      adapter: "phaser",
      version: "3",
      executor: phaser3Executor,
    },
  ]);
