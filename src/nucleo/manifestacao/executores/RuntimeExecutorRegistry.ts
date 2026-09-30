import type { TargetExecutor, TargetExecutorRegistry } from "../TargetExecutionRouter";

export type RuntimeExecutorDefinition = {
  key: string;
  adapter: string;
  version: string;
  executor: TargetExecutor;
};

export function createRuntimeExecutorRegistry(
  definitions: readonly RuntimeExecutorDefinition[],
): TargetExecutorRegistry {
  const registry: Record<string, TargetExecutor> = {};

  for (const definition of definitions) {
    if (registry[definition.key]) {
      throw new Error(`DUPLICATE_EXECUTOR: ${definition.key}`);
    }

    const expectedKey = `${definition.adapter}@${definition.version}`;
    if (definition.key !== expectedKey) {
      throw new Error(`INVALID_EXECUTOR_KEY: ${definition.key} != ${expectedKey}`);
    }

    registry[definition.key] = definition.executor;
  }

  return Object.freeze(registry);
}
