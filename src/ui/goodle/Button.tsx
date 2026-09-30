import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import type { GoodleSemanticTone } from "./SemanticIcon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface GoodleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  semantic?: GoodleSemanticTone;
}

export function GoodleButton({ variant = "secondary", semantic, children, className = "", ...props }: PropsWithChildren<GoodleButtonProps>) {
  const semanticClass = semantic ? ` goodle-button--semantic-${semantic}` : "";
  return (
    <button className={`goodle-button goodle-button--${variant}${semanticClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
