#!/usr/bin/env node
/**
 * @sceneify/obs-to-code CLI
 *
 * Reverse-engineers OBS scenes into TypeScript code.
 *
 * Usage:
 *   npx @sceneify/obs-to-code [options]
 *   npx @sceneify/obs-to-code -o ./my-scene.ts
 *   npx @sceneify/obs-to-code --url ws://192.168.1.100:4455 --password secret
 */

// @ts-ignore Node.js global
const process = (globalThis as any).process;

import { Console, Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { OBSSocket } from "@sceneify/core-rewrite";
import { generateCode, type GenerateFromOBSConfig } from "./index.ts";

interface CLIOptions {
  url: string;
  password?: string;
  output?: string;
  help: boolean;
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    url: "ws://localhost:4455",
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-u":
      case "--url":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error(`Option ${arg} requires a value`);
        }
        options.url = nextArg;
        i++;
        break;
      case "-p":
      case "--password":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error(`Option ${arg} requires a value`);
        }
        options.password = nextArg;
        i++;
        break;
      case "-o":
      case "--output":
        if (!nextArg || nextArg.startsWith("-")) {
          throw new Error(`Option ${arg} requires a value`);
        }
        options.output = nextArg;
        i++;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return options;
}

function showHelp(): Effect.Effect<void> {
  return Console.log(`
@sceneify/obs-to-code - Reverse-engineer OBS scenes to TypeScript

Usage:
  npx @sceneify/obs-to-code [options]

Options:
  -u, --url <url>         OBS WebSocket URL (default: ws://localhost:4455)
  -p, --password <pass>   OBS WebSocket password (optional)
  -o, --output <file>     Output file path (default: stdout)
  -h, --help              Show this help message

Examples:
  # Export current OBS setup to stdout
  npx @sceneify/obs-to-code

  # Export to a file
  npx @sceneify/obs-to-code -o ./my-scene.ts

  # Connect to remote OBS
  npx @sceneify/obs-to-code --url ws://192.168.1.100:4455 --password secret -o ./scene.ts

  # Import and use in your code
  import { mainScene, webcam, chatOverlay } from "./my-scene";
`);
}

const runCli = (argv: string[]) =>
  Effect.gen(function* () {
    const args = argv.slice(2);

    const options = parseArgs(args);

    if (options.help) {
      yield* showHelp();
      return;
    }

    yield* Console.error(`Connecting to OBS at ${options.url}...`);

    const config: GenerateFromOBSConfig = {
      url: options.url,
      ...(options.password && { password: options.password }),
    };

    // Run the Effect-based generation
    const code = yield* generateCode(config).pipe(
      Effect.provide(OBSSocket.layer(config))
    );

    if (options.output) {
      // Access the FileSystem service
      const fs = yield* FileSystem.FileSystem;
      yield* fs.writeFileString(options.output, code);
      yield* Console.error(`Generated code written to ${options.output}`);
    } else {
      yield* Console.log(code);
    }
  });

// Execute with FileSystem layer provided
const program = runCli(process.argv).pipe(
  Effect.catchAll((error) => Console.error(`Error: ${error}`))
);

Effect.runPromise(
  program.pipe(Effect.provide(NodeFileSystem.layer))
).then(() => process.exit(0)).catch(() => process.exit(1));
