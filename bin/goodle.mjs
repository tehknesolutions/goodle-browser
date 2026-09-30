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
  certify <report.json>        Certifica um goodle.build-report.v1

Build:
  goodle build --graph <file> --kind <kind> --adapter <adapter> --version <version>
               [--dry-run|--apply] [--overwrite] [--root <dir>]

Certification:
  goodle certify <report.json>
`;

if (args.length === 0 || ["--help", "-h", "help"].includes(args[0])) {
  console.log(help);
  process.exit(0);
}

const command = args[0];

function runTsEntry(relativeEntry, forwardedArgs, errorPrefix) {
  const entry = fileURLToPath(new URL(relativeEntry, import.meta.url));
  const child = spawnSync(
    process.execPath,
    ["--import", "tsx", entry, ...forwardedArgs],
    { stdio: "inherit" },
  );

  if (child.error) {
    console.error(`${errorPrefix}: ${child.error.message}`);
    process.exit(1);
  }

  process.exit(child.status ?? 1);
}

if (command === "build") {
  runTsEntry("../src/cli/goodle-build.ts", args.slice(1), "BUILD_RUNTIME_ERROR");
}

if (command === "certify") {
  runTsEntry("../src/cli/goodle-certify.ts", args.slice(1), "CERTIFY_RUNTIME_ERROR");
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
