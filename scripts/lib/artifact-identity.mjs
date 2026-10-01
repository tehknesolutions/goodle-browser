import { createHash } from 'node:crypto'

function normalizeFiles(files) {
  return [...files]
    .map(({ path, content }) => ({ path, content }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function computeArtifactIdentity({ files }) {
  const canonical = JSON.stringify(normalizeFiles(files))
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`
}
