import type { HTMLAttributes, PropsWithChildren } from "react";

export function GoodlePanel({ children, className = "", ...props }: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return <section className={`goodle-panel ${className}`.trim()} {...props}>{children}</section>;
}
