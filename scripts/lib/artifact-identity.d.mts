export interface ArtifactIdentityFile {
  path: string
  content: string
}

export interface ArtifactIdentityInput {
  files: ArtifactIdentityFile[]
  metadata?: Record<string, unknown>
}

export declare function computeArtifactIdentity(input: ArtifactIdentityInput): string
