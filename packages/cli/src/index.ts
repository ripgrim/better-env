import { example, pull, push } from "@/src/commands/example";
import { Command } from "commander";
import chalk from "chalk";
import { version } from "../package.json";

const commands = [example, pull, push];

// Your custom ASCII banner
const banner = `

${chalk.red(`░██                   ░██      ░██`)}
${chalk.red(`░██                   ░██      ░██`)}
${chalk.red(`░████████  ░███████░████████░████████░███████ ░██░████              ░███████ ░████████ ░██    ░██ `)}
${chalk.white(`░██    ░██░██    ░██  ░██      ░██  ░██    ░██░███      ░███████   ░██    ░██░██    ░██ ░██  ░██         `)}
${chalk.white(`░██    ░██░█████████  ░██      ░██  ░█████████░██                  ░█████████░██    ░██ ░██  ░██  `)}
${chalk.blue(`░███   ░██░██         ░██      ░██  ░██       ░██                  ░██       ░██    ░██  ░██░██   `)}
${chalk.blue(`░██░█████  ░███████    ░████    ░████░███████ ░██                   ░███████ ░██    ░██   ░███     `)}
`;


//todo:
// red banner if error
// yellow banner if warning
// rainbow animated banner if normal 

function main() {
  // Only print banner if help is NOT requested
  const isHelp =
    process.argv.includes("-h") ||
    process.argv.includes("--help") ||
    process.argv.includes("--version") ||
    process.argv.includes("help");
  if (!isHelp) {
    console.log(chalk.red(banner));
  }

  const program = new Command()
    .name("better-env")
    // .description("Better Env CLI")
    .usage("[command] [options]")
    .version(version || "0.0.0")
    .helpOption("-h, --help", "display help")
    .showHelpAfterError()
    .addHelpText("before", "\nhey haha\n")
    .addHelpText(
      "after",
      "\nUse `better-env help [command]` for more details.\n"
    );

  commands.forEach((command) => {
    program.addCommand(command);
  });

  program.parse();
}

main();
