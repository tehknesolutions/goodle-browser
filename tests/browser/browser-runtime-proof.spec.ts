import { expect, test } from "@playwright/test";
import {
  createBrowserRuntimeEvidenceProof,
  verifyBrowserRuntimeEvidenceProof,
  type BrowserRuntimeObservationV1,
} from "../../src/nucleo/lineage/BrowserRuntimeProof";

test("M43 mounts React in DOM, boots Phaser canvas, and binds browser evidence", async ({ page }) => {
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
  expect(observation).toEqual({
    schema: "goodle.browser-runtime-proof.v1",
    react: {
      mounted: true,
      text: "Goodle React Browser Runtime Proof",
      runtime: "react@19",
    },
    phaser: {
      booted: true,
      canvas_present: true,
      scene_key: "GoodleBrowserProofScene",
      width: 320,
      height: 180,
      runtime: "phaser@3",
    },
  });

  await expect(
    page.locator('[data-goodle-browser-proof="react"]'),
  ).toBeVisible();

  const canvas = page.locator("#goodle-phaser-root canvas");
  await expect(canvas).toHaveCount(1);

  const dimensions = await canvas.evaluate((element) => {
    const canvasElement = element as HTMLCanvasElement;
    return {
      width: canvasElement.width,
      height: canvasElement.height,
    };
  });

  expect(dimensions).toEqual({ width: 320, height: 180 });

  const browserProof = createBrowserRuntimeEvidenceProof({
    observation: observation!,
    closed_loop: {
      proof_id: "closed-loop-m43",
      closed_loop_hash: "closed-loop-hash-m43",
      bundle_id: "bundle-m43",
      execution_id: "execution-m43",
    },
  });

  expect(browserProof).toMatchObject({
    schema: "goodle.browser-runtime-evidence-proof.v1",
    closed_loop_proof_id: "closed-loop-m43",
    bundle_id: "bundle-m43",
    execution_id: "execution-m43",
    browser_engine: "chromium",
    react_dom_mounted: true,
    phaser_canvas_booted: true,
    phaser_scene_key: "GoodleBrowserProofScene",
    canvas_width: 320,
    canvas_height: 180,
  });

  expect(
    verifyBrowserRuntimeEvidenceProof(browserProof, observation!),
  ).toBe(true);
});
