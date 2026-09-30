import type { PropsWithChildren } from "react";

export function GoodleInspector({ title = "Inspector", children }: PropsWithChildren<{ title?: string }>) {
  return (
    <aside className="goodle-inspector">
      <header className="goodle-inspector__header">{title}</header>
      <div className="goodle-inspector__body">{children}</div>
    </aside>
  );
}
