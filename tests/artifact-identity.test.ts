import { describe, expect, it } from 'vitest'
import { computeArtifactIdentity } from '../scripts/lib/artifact-identity.mjs'

describe('M75 reproducible artifact identity', () => {
  const files = [
    { path: 'assets/app.js', content: 'console.log("goodle")' },
    { path: 'index.html', content: '<main>Goodle</main>' },
  ]

  it('produces the same identity for equivalent inputs regardless of file order', () => {
    const a = computeArtifactIdentity({ files })
    const b = computeArtifactIdentity({ files: [...files].reverse() })
    expect(a).toBe(b)
  })

  it('ignores volatile metadata that does not belong to artifact content', () => {
    const a = computeArtifactIdentity({ files, metadata: { generatedAt: '2026-09-30T10:00:00Z' } })
    const b = computeArtifactIdentity({ files, metadata: { generatedAt: '2026-10-01T10:00:00Z' } })
    expect(a).toBe(b)
  })

  it('changes identity when artifact content changes', () => {
    const a = computeArtifactIdentity({ files })
    const b = computeArtifactIdentity({
      files: files.map((file) => file.path === 'index.html' ? { ...file, content: '<main>Tampered</main>' } : file),
    })
    expect(a).not.toBe(b)
  })

  it('includes normalized paths in the identity', () => {
    const a = computeArtifactIdentity({ files })
    const b = computeArtifactIdentity({ files: files.map((file) => file.path === 'index.html' ? { ...file, path: 'pages/index.html' } : file) })
    expect(a).not.toBe(b)
  })

  it('returns an explicit SHA-256 identity', () => {
    expect(computeArtifactIdentity({ files })).toMatch(/^sha256:[a-f0-9]{64}$/)
  })
})
