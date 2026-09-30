import {describe,expect,it} from "vitest";
import {parseWorldIntentProfile} from "./WorldIntentProfile";
describe("WorldIntentProfile",()=>{it("extracts world modifiers from natural language",()=>{const p=parseWorldIntentProfile("Crie um mundo enorme de floresta, difícil, com muitos inimigos");expect(p.theme).toBe("forest");expect(p.scale).toBe("huge");expect(p.difficulty).toBe("hard");expect(p.density).toBe("high")});it("uses neutral defaults",()=>{expect(parseWorldIntentProfile("Crie um jogo")).toEqual({theme:"default",scale:"medium",difficulty:"normal",density:"normal"})})});
