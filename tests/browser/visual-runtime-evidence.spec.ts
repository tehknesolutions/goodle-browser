import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  createBrowserRuntimeEvidenceProof,
  verifyBrowserRuntimeEvidenceProof,
  type BrowserRuntimeObservationV1,
} from "../../src/nucleo/lineage/BrowserRuntimeProof";
import {
  createVisualRuntimeEvidence,
  verifyVisualRuntimeEvidence,
} from "../../src/nucleo/lineage/VisualRuntimeEvidence";

test("M44 captures visual browser evidence and binds it to the browser runtime proof", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("/browser-proof.html");

  await page.waitForFunction(() => {
    return Boolean(
      (window as Window & {
        __GOODLE_BROWSER_PROOF__?: BrowserRuntimeObservationV1;
      }).__GOODLE_BROWSER_PROOF__,
    );
  });

  const observation = await page.evaluate(() => {
    return (
      window as Window & {
        __GOODLE_BROWSER_PROOF__?: BrowserRuntimeObservationV1;
      }
    ).__GOODLE_BROWSER_PROOF__;
  });

  expect(observation).toBeDefined();

  const browserProof = createBrowserRuntimeEvidenceProof({
    observation: observation!,
    closed_loop: {
      proof_id: "closed-loop-m44",
      closed_loop_hash: "closed-loop-hash-m44",
      bundle_id: "bundle-m44",
      execution_id: "execution-m44",
    },
  });

  expect(
    verifyBrowserRuntimeEvidenceProof(browserProof, observation!),
  ).toBe(true);

  const screenshot = await page.screenshot({
    fullPage: true,
    type: "png",
  });
  const screenshotHash = createHash("sha256")
    .update(screenshot)
    .digest("hex");

  await testInfo.attach("goodle-browser-runtime.png", {
    body: screenshot,
    contentType: "image/png",
  });

  const visualEvidence = createVisualRuntimeEvidence({
    browser_proof: browserProof,
    screenshot_sha256: screenshotHash,
    screenshot_bytes: screenshot.byteLength,
    viewport: { width: 800, height: 600 },
  });

  expect(visualEvidence).toMatchObject({
    schema: "goodle.visual-runtime-evidence.v1",
    browser_runtime_proof_id: browserProof.proof_id,
    browser_runtime_proof_hash: browserProof.proof_hash,
    screenshot_sha256: screenshotHash,
    screenshot_bytes: screenshot.byteLength,
    mime_type: "image/png",
    viewport: { width: 800, height: 600 },
  });

  expect(
    verifyVisualRuntimeEvidence({
      evidence: visualEvidence,
      browser_proof: browserProof,
      screenshot_sha256: screenshotHash,
      screenshot_bytes: screenshot.byteLength,
    }),
  ).toBe(true);
});
