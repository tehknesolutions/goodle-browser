import type { HTMLAttributes, PropsWithChildren } from "react";

type SurfaceTone = "default" | "raised" | "sunken";

export interface GoodleSurfaceProps extends HTMLAttributes<HTMLElement> {
  tone?: SurfaceTone;
}

export function GoodleSurface({ tone = "default", className = "", children, ...props }: PropsWithChildren<GoodleSurfaceProps>) {
  return (
    <section className={`goodle-surface goodle-surface--${tone} ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
