import type { PropsWithChildren } from "react";

export interface GoodleCanvasProps {
  grid?: boolean;
}

export function GoodleCanvas({ grid = true, children }: PropsWithChildren<GoodleCanvasProps>) {
  return (
    <section className={`goodle-canvas ${grid ? "has-grid" : ""}`.trim()} aria-label="Canvas Goodle">
      {children}
    </section>
  );
}
