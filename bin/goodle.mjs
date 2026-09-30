#!/usr/bin/env node

const args = process.argv.slice(2);

const help = `Goodle CLI\n\nCommands:\n  help                         Mostra esta ajuda\n  compile <intent|OldRewrite>  Compila uma intenção\n  inspect <ref>                Inspeciona uma representação\n  map <ref>                    Consulta o mapping governado\n  execute <ref>                Prepara/executa pela fronteira HNK-VERSE\n  artifact <ref>               Consulta artefato manifestado\n  chronicle <ref>              Exibe lineage/Chronicle\n`;

if (args.length === 0 || ["--help", "-h", "help"].includes(args[0])) {
  console.log(help);
  process.exit(0);
}

const command = args[0];
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
