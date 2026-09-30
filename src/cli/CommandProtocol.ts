export const GOODLE_COMMANDS = [
  "help",
  "compile",
  "inspect",
  "map",
  "execute",
  "artifact",
  "chronicle",
] as const;

export type GoodleCommandKind = (typeof GOODLE_COMMANDS)[number] | "unknown";

export type GoodleCommand = {
  kind: GoodleCommandKind;
  args: string[];
};

export function parseGoodleCommand(input: string): GoodleCommand {
  const source = input.trim();
  if (!source) return { kind: "help", args: [] };

  const separator = source.indexOf(" ");
  const rawKind = separator === -1 ? source : source.slice(0, separator);
  const remainder = separator === -1 ? "" : source.slice(separator + 1).trim();

  if (!GOODLE_COMMANDS.includes(rawKind as (typeof GOODLE_COMMANDS)[number])) {
    return { kind: "unknown", args: [source] };
  }

  return {
    kind: rawKind as (typeof GOODLE_COMMANDS)[number],
    args: remainder ? [remainder] : [],
  };
}

export const GOODLE_HELP = `Goodle CLI\n\nCommands:\n  help                         Mostra esta ajuda\n  compile <intent|OldRewrite>  Compila uma intenção\n  inspect <ref>                Inspeciona uma representação\n  map <ref>                    Consulta o mapping governado\n  execute <ref>                Prepara/executa pela fronteira HNK-VERSE\n  artifact <ref>               Consulta artefato manifestado\n  chronicle <ref>              Exibe lineage/Chronicle\n`;
