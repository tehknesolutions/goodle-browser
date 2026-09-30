export type GoodleConnectionTone = "knowledge" | "action" | "manifestation";

export interface GoodleConnectionProps {
  tone?: GoodleConnectionTone;
  dashed?: boolean;
  label?: string;
}

export function GoodleConnection({ tone = "knowledge", dashed = false, label }: GoodleConnectionProps) {
  return (
    <div className={`goodle-connection goodle-connection--${tone} ${dashed ? "is-dashed" : ""}`.trim()} aria-label={label ?? "Conexão Goodle"}>
      {label && <span className="goodle-connection__label">{label}</span>}
    </div>
  );
}
