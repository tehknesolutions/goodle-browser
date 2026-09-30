export type StudioExecutionSource = {
  oldRewrite: string;
  naturalIntent: string;
};

export function resolveStudioExecutionSource(source: StudioExecutionSource): string {
  const oldRewrite = source.oldRewrite.trim();
  if (!oldRewrite) throw new Error("OLDREWRITE_REQUIRED: compile a proposta antes de executar");
  return oldRewrite;
}
