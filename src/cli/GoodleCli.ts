import { GOODLE_HELP, parseGoodleCommand } from "./CommandProtocol";

export type GoodleCliResult = { exitCode: number; stdout: string; stderr: string };

export function runGoodleCli(argv: string[]): GoodleCliResult {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h" || argv[0] === "help") {
    return { exitCode: 0, stdout: GOODLE_HELP, stderr: "" };
  }

  const command = parseGoodleCommand(argv.join(" "));
  if (command.kind === "unknown") {
    return { exitCode: 1, stdout: "", stderr: `UNKNOWN_COMMAND: ${command.args[0] ?? ""}\n${GOODLE_HELP}` };
  }

  if (command.kind === "compile") {
    if (!command.args[0]) return { exitCode: 1, stdout: "", stderr: "COMPILE_INTENT_REQUIRED" };
    return { exitCode: 0, stdout: `compile: ${command.args[0]}\n`, stderr: "" };
  }

  return { exitCode: 0, stdout: `${command.kind}: ${command.args[0] ?? ""}\n`, stderr: "" };
}
