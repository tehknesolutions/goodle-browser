import { describe, expect, it } from 'vitest'
import { computeArtifactIdentity } from './artifact-identity.mjs'
import {
  createIndependentQualityAttestation,
  verifyIndependentQualityAttestation,
} from './independent-quality-attestation.mjs'

const report = {
  schema: 'goodle.independent-quality-gate-report.v1',
  gate: 'M70',
  status: 'PASS',
  git: { commit_sha: 'abc123', tracked_dirty: false },
  runtime: { node: 'v22', npm: '10', platform: 'linux', arch: 'x64' },
  steps: [
    { command: 'npm test', exit_code: 0, signal: null, status: 'PASS' },
    { command: 'npm run check', exit_code: 0, signal: null, status: 'PASS' },
    { command: 'npm run build', exit_code: 0, signal: null, status: 'PASS' },
  ],
}

const artifactIdentity = computeArtifactIdentity({
  files: [{ path: 'index.html', content: '<main>Goodle</main>' }],
})

describe('M96 artifact identity binding', () => {
  it('binds the deterministic artifact identity into the attestation', () => {
    const attestation = createIndependentQualityAttestation({
      report,
      reportSha256: 'report-sha',
      expectedCommitSha: 'abc123',
      artifactIdentity,
      createdAt: '2026-10-01T00:00:00.000Z',
    })

    expect(attestation.artifact_identity).toBe(artifactIdentity)
  })

  it('rejects verification when the expected artifact identity differs', () => {
    const attestation = createIndependentQualityAttestation({
      report,
      reportSha256: 'report-sha',
      expectedCommitSha: 'abc123',
      artifactIdentity,
      createdAt: '2026-10-01T00:00:00.000Z',
    })

    const verification = verifyIndependentQualityAttestation({
      attestation,
      report,
      reportSha256: 'report-sha',
      expectedCommitSha: 'abc123',
      expectedArtifactIdentity: 'sha256:different',
    })

    expect(verification.valid).toBe(false)
    expect(verification.reasons).toContain('ATTESTATION_ARTIFACT_IDENTITY_MISMATCH')
  })
})
