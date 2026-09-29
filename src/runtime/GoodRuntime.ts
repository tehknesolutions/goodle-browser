import type { GoodProjeto } from "../nucleo/modelo/GoodProjeto";

export interface ContextoGoodRuntime {
  raiz: HTMLElement;
  projeto: GoodProjeto;
}

export interface ManifestadorGoodle {
  suporta(projeto: GoodProjeto): boolean;
  montar(contexto: ContextoGoodRuntime): void;
}

/** Fachada única: React e Phaser são fundamentos internos, não escolhas do criador. */
export class GoodRuntime {
  constructor(private readonly manifestadores: ManifestadorGoodle[] = []) {}

  iniciar(contexto: ContextoGoodRuntime): void {
    const manifestador = this.manifestadores.find((item) => item.suporta(contexto.projeto));
    if (!manifestador) {
      throw new Error("Nenhuma estratégia de manifestação Goodle atende este projeto.");
    }
    manifestador.montar(contexto);
  }
}
