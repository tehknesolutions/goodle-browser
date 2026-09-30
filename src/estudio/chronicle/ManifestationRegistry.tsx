import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { ArtifactBundle } from "../../nucleo/artefatos/ArtifactContract";
import type { Chronicle } from "../../nucleo/lineage/Chronicle";
import { useChronicleStore } from "./ChronicleStore";

export type StudioManifestation = {
  artifact: ArtifactBundle;
  chronicle: Chronicle;
};

type ManifestationRegistryValue = {
  manifestations: StudioManifestation[];
  registerManifestation: (manifestation: StudioManifestation) => void;
  selectManifestation: (artifactId: string) => void;
};

const ManifestationRegistry = createContext<ManifestationRegistryValue | undefined>(undefined);

export function ManifestationRegistryProvider({ children }: PropsWithChildren) {
  const [manifestations, setManifestations] = useState<StudioManifestation[]>([]);
  const { selectChronicle } = useChronicleStore();
  const value = useMemo<ManifestationRegistryValue>(() => ({
    manifestations,
    registerManifestation: (manifestation) => setManifestations((current) => {
      const withoutPrevious = current.filter((item) => item.artifact.artifact.artifact_id !== manifestation.artifact.artifact.artifact_id);
      return [...withoutPrevious, manifestation];
    }),
    selectManifestation: (artifactId) => {
      const found = manifestations.find((item) => item.artifact.artifact.artifact_id === artifactId);
      if (found) selectChronicle({ artifact_id: artifactId, chronicle: found.chronicle });
    },
  }), [manifestations, selectChronicle]);
  return <ManifestationRegistry.Provider value={value}>{children}</ManifestationRegistry.Provider>;
}

export function useManifestationRegistry(): ManifestationRegistryValue {
  const value = useContext(ManifestationRegistry);
  if (!value) throw new Error("useManifestationRegistry must be used inside ManifestationRegistryProvider");
  return value;
}
