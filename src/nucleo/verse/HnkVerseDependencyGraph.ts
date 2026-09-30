import type { HnkVersePlan, VerseOperation, VerseRelation } from "./HnkVerseAdapter";

export type VerseDependency = {
  operation_id: string;
  depends_on: string[];
};

export type VerseDependencyGraph = {
  schema: "goodle-hnk-verse-dependencies/v0.1";
  dependencies: VerseDependency[];
};

const structuralRelations = new Set<VerseRelation["relation"]>(["contains", "defines"]);

export function buildVerseDependencyGraph(plan: HnkVersePlan): VerseDependencyGraph {
  const dependencies = new Map<string, Set<string>>();
  for (const operation of plan.operations) dependencies.set(operation.operation_id, new Set());

  for (const relation of plan.relations) {
    if (structuralRelations.has(relation.relation)) {
      dependencies.get(relation.target_operation)?.add(relation.source_operation);
    }
    if (relation.relation === "triggers") {
      dependencies.get(relation.target_operation)?.add(relation.source_operation);
    }
  }

  return {
    schema: "goodle-hnk-verse-dependencies/v0.1",
    dependencies: [...dependencies.entries()].map(([operation_id, refs]) => ({
      operation_id,
      depends_on: [...refs].sort(),
    })),
  };
}

export function orderVerseOperationsByDependencies(plan: HnkVersePlan): VerseOperation[] {
  const graph = buildVerseDependencyGraph(plan);
  const byId = new Map(plan.operations.map((operation) => [operation.operation_id, operation]));
  const pending = new Map(graph.dependencies.map((item) => [item.operation_id, new Set(item.depends_on)]));
  const ordered: VerseOperation[] = [];

  while (pending.size > 0) {
    const ready = [...pending.entries()]
      .filter(([, deps]) => deps.size === 0)
      .map(([id]) => id)
      .sort();
    if (ready.length === 0) throw new Error("CYCLE: HNK-VERSE dependency graph contains a cycle");
    for (const id of ready) {
      const operation = byId.get(id);
      if (operation) ordered.push(operation);
      pending.delete(id);
      for (const deps of pending.values()) deps.delete(id);
    }
  }
  return ordered;
}
