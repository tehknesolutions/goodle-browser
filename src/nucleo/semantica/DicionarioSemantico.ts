export type NivelEquivalencia = "direta" | "aproximada" | "contextual" | "com_perda";

export type FamiliaOrigem =
  | "goodle"
  | "phaser"
  | "godot"
  | "byond"
  | "rpg-maker"
  | "typescript"
  | "react"
  | "backend";

export type ResolucaoSemantica = {
  idCanonico: string;
  termoPtBr: string;
  origem: FamiliaOrigem;
  equivalencia: NivelEquivalencia;
  termoOriginal: string;
};

type AliasSemantico = Omit<ResolucaoSemantica, "termoOriginal"> & {
  aliases: string[];
  exigeOrigem?: boolean;
};

const removerAcentos = (valor: string) =>
  valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizar = (valor: string) => removerAcentos(valor.trim().toLocaleLowerCase("pt-BR"));

const entrada = (
  idCanonico: string,
  termoPtBr: string,
  aliases: string[],
  origem: FamiliaOrigem = "goodle",
  equivalencia: NivelEquivalencia = "direta",
  exigeOrigem = false,
): AliasSemantico => ({ idCanonico, termoPtBr, aliases, origem, equivalencia, exigeOrigem });

const aliases: AliasSemantico[] = [
  // Goodle / OldRewrite — núcleo linguístico
  entrada("logica.condicao.se", "se", ["se", "if"]),
  entrada("logica.condicao.senao", "senão", ["senão", "senao", "else"]),
  entrada("comportamento.reacao.quando", "quando", ["quando", "when"]),
  entrada("comportamento.evento", "evento", ["evento"]),
  entrada("comportamento.acao", "ação", ["ação", "acao"]),
  entrada("comportamento.emissao", "emitir", ["emitir", "emit"]),
  entrada("estrutura.entidade", "entidade", ["entidade", "entity"]),
  entrada("estrutura.cena", "cena", ["cena"]),
  entrada("estrutura.mundo", "mundo", ["mundo"]),
  entrada("estrutura.mapa", "mapa", ["mapa"]),
  entrada("estrutura.area", "área", ["área", "area"]),
  entrada("estrutura.recurso", "recurso", ["recurso"]),
  entrada("dados.dado", "dado", ["dado"]),
  entrada("dados.estado", "estado", ["estado"]),
  entrada("mundo.personagem", "personagem", ["personagem"]),
  entrada("mundo.objeto", "objeto", ["objeto"]),
  entrada("mundo.terreno", "terreno", ["terreno"]),
  entrada("mundo.camera", "câmera", ["câmera", "camera"]),

  // Godot-like
  entrada("estrutura.entidade", "entidade", ["node"], "godot", "contextual", true),
  entrada("estrutura.cena", "cena", ["scene"], "godot", "aproximada", true),
  entrada("estrutura.recurso", "recurso", ["resource"], "godot", "direta", true),
  entrada("comportamento.emissao", "emitir", ["signal"], "godot", "contextual", true),

  // Phaser-like
  entrada("estrutura.entidade", "entidade", ["game object", "gameobject"], "phaser", "aproximada", true),
  entrada("estrutura.cena", "cena", ["scene"], "phaser", "aproximada", true),
  entrada("mundo.camera", "câmera", ["camera"], "phaser", "direta", true),

  // BYOND-like
  entrada("estrutura.entidade", "entidade", ["atom"], "byond", "aproximada", true),
  entrada("mundo.personagem", "personagem", ["mob"], "byond", "contextual", true),
  entrada("mundo.objeto", "objeto", ["obj"], "byond", "aproximada", true),
  entrada("mundo.terreno", "terreno", ["turf"], "byond", "contextual", true),
  entrada("estrutura.area", "área", ["area"], "byond", "aproximada", true),
  entrada("estrutura.mundo", "mundo", ["world"], "byond", "aproximada", true),
  entrada("comportamento.acao", "ação", ["proc"], "byond", "contextual", true),
  entrada("comportamento.acao.usuario", "ação do usuário", ["verb"], "byond", "contextual", true),

  // RPG Maker-like
  entrada("estrutura.mapa", "mapa", ["map"], "rpg-maker", "aproximada", true),
  entrada("comportamento.evento", "evento", ["event"], "rpg-maker", "contextual", true),
  entrada("dados.estado", "estado", ["switch"], "rpg-maker", "contextual", true),
  entrada("dados.dado", "dado", ["variable"], "rpg-maker", "aproximada", true),
];

export function resolverTermoSemantico(
  termo: string,
  origem?: FamiliaOrigem,
): ResolucaoSemantica | undefined {
  const chave = normalizar(termo);

  const candidatas = aliases.filter((item) =>
    item.aliases.some((alias) => normalizar(alias) === chave),
  );

  const encontrada = origem
    ? candidatas.find((item) => item.origem === origem) ??
      candidatas.find((item) => item.origem === "goodle" && !item.exigeOrigem)
    : candidatas.find((item) => item.origem === "goodle" && !item.exigeOrigem);

  if (!encontrada) return undefined;

  return {
    idCanonico: encontrada.idCanonico,
    termoPtBr: encontrada.termoPtBr,
    origem: encontrada.origem,
    equivalencia: encontrada.equivalencia,
    termoOriginal: termo,
  };
}

export const DICIONARIO_SEMANTICO_V1 = aliases;
