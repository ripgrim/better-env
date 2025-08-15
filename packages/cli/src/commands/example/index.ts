import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

import { logger } from "@/src/utils/logger";

const spinner = ora({
  text: "Loading...",
  color: "yellow",
});

export const example = new Command()
  .name("example")
  .description("An example command")
  .arguments("[name]")
  .action(async (name) => {
    await runExample(name);
  });

export const pull = new Command()
  .name("pull")
  .description("Pull environment variables from a project")
  .arguments("[projectId]")
  .action(async (projectId) => {
    await runPull(projectId);
  });

export const push = new Command()
  .name("push")
  .description("Push environment variables to a project")
  .arguments("[projectId]")
  .action(async (projectId) => {
    await runPush(projectId);
  });

export async function runPull(projectId: string) {
  logger.info(`Executing ${chalk.bold("pull")} command`);
  spinner.start();
  await new Promise((res) => setTimeout(res, 2000));
  spinner.succeed(`Pulled environment variables from ${projectId}`);
}

export async function runPush(projectId: string) {
  logger.info(`Executing ${chalk.bold("push")} command`);
  spinner.start();
  await new Promise((res) => setTimeout(res, 2000));
  spinner.succeed(`Pushed environment variables to ${projectId}`);
}

export async function runExample(name = "world") {
  logger.info(`Executing ${chalk.bold("example")} command`);
  spinner.start();
  await new Promise((res) => setTimeout(res, 2000));
  spinner.succeed(`Hello, ${name}`);

  return `Hello, ${name}`;
}
