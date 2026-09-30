#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);

const help = `Goodle CLI

Commands:
  help                         Mostra esta ajuda
  compile <intent|OldRewrite>  Compila uma intenção
  inspect <ref>                Inspeciona uma representação
  map <ref>                    Consulta o mapping governado
  execute <ref>                Prepara/executa pela fronteira HNK-VERSE
  artifact <ref>               Consulta artefato manifestado
  chronicle <ref>              Exibe lineage/Chronicle
  build                        Executa o pipeline Goodle end-to-end

Build:
  goodle build --graph <file> --kind <kind> --adapter <adapter> --version <version>
               [--dry-run|--apply] [--overwrite] [--root <dir>]
`;

if (args.length === 0 || ["--help", "-h", "help"].includes(args[0])) {
  console.log(help);
  process.exit(0);
}

const command = args[0];

if (command === "build") {
  const entry = fileURLToPath(new URL("../src/cli/goodle-build.ts", import.meta.url));
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", entry, ...args.slice(1)],
    { stdio: "inherit" },
  );

  if (child.error) {
    console.error(`BUILD_RUNTIME_ERROR: ${child.error.message}`);
    process.exit(1);
  }

  process.exit(child.status ?? 1);
}

const value = args.slice(1).join(" ");
const supported = new Set(["compile", "inspect", "map", "execute", "artifact", "chronicle"]);

if (!supported.has(command)) {
  console.error(`UNKNOWN_COMMAND: ${args.join(" ")}`);
  console.error(help);
  process.exit(1);
}

if (command === "compile" && !value) {
  console.error("COMPILE_INTENT_REQUIRED");
  process.exit(1);
}

console.log(`${command}: ${value}`);
