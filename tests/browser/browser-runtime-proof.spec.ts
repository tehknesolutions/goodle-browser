import { expect, test } from "@playwright/test";

test("M43 mounts React in DOM and boots a real Phaser canvas", async ({ page }) => {
  await page.goto("/browser-proof.html");

  await page.waitForFunction(() => {
    return Boolean(window.__GOODLE_BROWSER_PROOF__);
  });

  const proof = await page.evaluate(() => window.__GOODLE_BROWSER_PROOF__);

  expect(proof).toEqual({
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
});
