export type GoodleStatusTone = "idle" | "running" | "success" | "warning" | "error";

export interface GoodleStatusProps {
  label: string;
  tone?: GoodleStatusTone;
}

export function GoodleStatus({ label, tone = "idle" }: GoodleStatusProps) {
  return <span className={`goodle-status goodle-status--${tone}`.trim()}><i aria-hidden="true" />{label}</span>;
}
