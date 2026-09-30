export type GoodleSemanticTone = "intention" | "knowledge" | "action" | "manifestation";

export function GoodleSemanticIcon({ tone, label }: { tone: GoodleSemanticTone; label?: string }) {
  return <span className={`goodle-semantic-icon goodle-semantic-icon--${tone}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}><i /></span>;
}
