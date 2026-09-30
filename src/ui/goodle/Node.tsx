import type { PropsWithChildren } from "react";

export type GoodleNodeTone = "knowledge" | "action" | "manifestation" | "intention";

export interface GoodleNodeProps {
  title: string;
  type?: string;
  tone?: GoodleNodeTone;
  selected?: boolean;
  children?: React.ReactNode;
}

export function GoodleNode({ title, type, tone = "knowledge", selected = false, children }: GoodleNodeProps) {
  return (
    <article className={`goodle-node goodle-node--${tone} ${selected ? "is-selected" : ""}`.trim()}>
      <header className="goodle-node__header">
        <span className="goodle-node__indicator" aria-hidden="true" />
        <div>
          <strong>{title}</strong>
          {type && <small>{type}</small>}
        </div>
      </header>
      {children && <div className="goodle-node__body">{children}</div>}
      <span className="goodle-node__port goodle-node__port--in" aria-hidden="true" />
      <span className="goodle-node__port goodle-node__port--out" aria-hidden="true" />
    </article>
  );
}
