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

const aliases: AliasSemantico[] = [
  {
    idCanonico: "logica.condicao.se",
    termoPtBr: "se",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["se", "if"],
  },
  {
    idCanonico: "logica.condicao.senao",
    termoPtBr: "senão",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["senão", "senao", "else"],
  },
  {
    idCanonico: "comportamento.reacao.quando",
    termoPtBr: "quando",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["quando", "when"],
  },
  {
    idCanonico: "comportamento.evento",
    termoPtBr: "evento",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["evento"],
  },
  {
    idCanonico: "comportamento.acao",
    termoPtBr: "ação",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["ação", "acao"],
  },
  {
    idCanonico: "comportamento.emissao",
    termoPtBr: "emitir",
    origem: "goodle",
    equivalencia: "direta",
    aliases: ["emitir"],
  },
  {
    idCanonico: "comportamento.emissao",
    termoPtBr: "emitir",
    origem: "godot",
    equivalencia: "contextual",
    aliases: ["signal"],
    exigeOrigem: true,
  },
];

export function resolverTermoSemantico(
  termo: string,
  origem?: FamiliaOrigem,
): ResolucaoSemantica | undefined {
  const chave = normalizar(termo);

  const entrada = aliases.find((item) => {
    if (item.exigeOrigem && origem !== item.origem) return false;
    if (origem && item.origem !== "goodle" && item.origem !== origem) return false;
    return item.aliases.some((alias) => normalizar(alias) === chave);
  });

  if (!entrada) return undefined;

  return {
    idCanonico: entrada.idCanonico,
    termoPtBr: entrada.termoPtBr,
    origem: entrada.origem,
    equivalencia: entrada.equivalencia,
    termoOriginal: termo,
  };
}

export const DICIONARIO_SEMANTICO_V1 = aliases;
