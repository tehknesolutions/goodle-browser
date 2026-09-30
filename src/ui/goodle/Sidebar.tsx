import type { PropsWithChildren } from "react";

export function GoodleSidebar({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <aside className={`goodle-sidebar ${className}`.trim()}>{children}</aside>;
}
