import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface GoodleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function GoodleButton({ variant = "secondary", children, className = "", ...props }: PropsWithChildren<GoodleButtonProps>) {
  return (
    <button className={`goodle-button goodle-button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
