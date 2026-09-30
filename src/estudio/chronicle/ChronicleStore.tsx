import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { Chronicle } from "../../nucleo/lineage/Chronicle";

export type ChronicleSelection = {
  artifact_id: string;
  chronicle: Chronicle;
};

type ChronicleStoreValue = {
  selection?: ChronicleSelection;
  selectChronicle: (selection: ChronicleSelection) => void;
  clearChronicle: () => void;
};

const ChronicleStore = createContext<ChronicleStoreValue | undefined>(undefined);

export function ChronicleProvider({ children }: PropsWithChildren) {
  const [selection, setSelection] = useState<ChronicleSelection>();
  const value = useMemo<ChronicleStoreValue>(() => ({
    selection,
    selectChronicle: setSelection,
    clearChronicle: () => setSelection(undefined),
  }), [selection]);
  return <ChronicleStore.Provider value={value}>{children}</ChronicleStore.Provider>;
}

export function useChronicleStore(): ChronicleStoreValue {
  const value = useContext(ChronicleStore);
  if (!value) throw new Error("useChronicleStore must be used inside ChronicleProvider");
  return value;
}
