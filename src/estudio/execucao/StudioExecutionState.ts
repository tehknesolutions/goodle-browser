export type StudioExecutionState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "success"; artifactId: string }
  | { status: "error"; message: string };

export type StudioExecutionAction =
  | { type: "started" }
  | { type: "succeeded"; artifactId: string }
  | { type: "failed"; message: string }
  | { type: "reset" };

export const initialStudioExecutionState: StudioExecutionState = { status: "idle" };

export function reduceStudioExecutionState(_state: StudioExecutionState, action: StudioExecutionAction): StudioExecutionState {
  switch (action.type) {
    case "started": return { status: "running" };
    case "succeeded": return { status: "success", artifactId: action.artifactId };
    case "failed": return { status: "error", message: action.message };
    case "reset": return initialStudioExecutionState;
  }
}
