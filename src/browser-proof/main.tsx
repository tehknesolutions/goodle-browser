import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Phaser from "phaser";

type BrowserProof = {
  schema: "goodle.browser-runtime-proof.v1";
  react: {
    mounted: boolean;
    text: string;
    runtime: "react@19";
  };
  phaser: {
    booted: boolean;
    canvas_present: boolean;
    scene_key: string;
    width: number;
    height: number;
    runtime: "phaser@3";
  };
};

declare global {
  interface Window {
    __GOODLE_BROWSER_PROOF__?: BrowserProof;
  }
}

function ReactProof() {
  return (
    <article
      data-goodle-browser-proof="react"
      data-runtime="react@19"
      data-mounted="true"
    >
      Goodle React Browser Runtime Proof
    </article>
  );
}

const reactHost = document.getElementById("goodle-react-proof");
if (!reactHost) throw new Error("GOODLE_REACT_PROOF_HOST_MISSING");

createRoot(reactHost).render(
  <StrictMode>
    <ReactProof />
  </StrictMode>,
);

const sceneKey = "GoodleBrowserProofScene";

class GoodleBrowserProofScene extends Phaser.Scene {
  constructor() {
    super(sceneKey);
  }

  create() {
    this.registry.set("goodle.browser.proof", true);
    this.registry.set("goodle.runtime", "phaser@3");
    this.add.text(12, 12, "Goodle Phaser Browser Runtime Proof");
  }
}

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  width: 320,
  height: 180,
  parent: "goodle-phaser-root",
  backgroundColor: "#111111",
  scene: [GoodleBrowserProofScene],
  banner: false,
});

function publishProof() {
  const reactNode = document.querySelector<HTMLElement>(
    '[data-goodle-browser-proof="react"]',
  );
  const canvas = document.querySelector<HTMLCanvasElement>(
    "#goodle-phaser-root canvas",
  );
  const scene = game.scene.getScene(sceneKey);

  if (!reactNode || !canvas || !scene?.sys?.isActive()) {
    window.requestAnimationFrame(publishProof);
    return;
  }

  window.__GOODLE_BROWSER_PROOF__ = {
    schema: "goodle.browser-runtime-proof.v1",
    react: {
      mounted: reactNode.dataset.mounted === "true",
      text: reactNode.textContent ?? "",
      runtime: "react@19",
    },
    phaser: {
      booted: scene.registry.get("goodle.browser.proof") === true,
      canvas_present: true,
      scene_key: sceneKey,
      width: canvas.width,
      height: canvas.height,
      runtime: "phaser@3",
    },
  };
}

window.requestAnimationFrame(publishProof);
