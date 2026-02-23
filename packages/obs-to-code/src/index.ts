/**
 * @sceneify/obs-to-code
 * 
 * Reverse-engineers OBS scenes into TypeScript code that uses the
 * @sceneify/core-rewrite API.
 */

import { Effect } from "effect";
import { OBSSocket } from "@sceneify/core-rewrite";
import type { OBSConnectionConfig, OBSData } from "./OBSFetcher.ts";
import { OBSFetcher } from "./OBSFetcher.ts";
import { CodeGenerator, type CodeGeneratorOptions } from "./CodeGenerator.ts";
import { TypeRegistry, UnknownKindError } from "./TypeRegistry.ts";
import { OBSService, OBSServiceLive } from "./OBSService.ts";
import type { OBSError } from "@sceneify/core-rewrite";

export { OBSFetcher, CodeGenerator, TypeRegistry, UnknownKindError };
export { OBSService, OBSServiceLive };
export type { OBSConnectionConfig, OBSData, CodeGeneratorOptions };

/**
 * Main configuration for generating code from OBS.
 */
export interface GenerateFromOBSConfig extends OBSConnectionConfig {
  /**
   * Options for code generation.
   */
  generatorOptions?: CodeGeneratorOptions;
}

/**
 * Effect-based code generation from OBS.
 * Returns an Effect that connects to OBS, fetches data, and generates TypeScript code.
 */
export const generateCode = (
  config: GenerateFromOBSConfig
): Effect.Effect<string, UnknownKindError | OBSError, OBSSocket.OBSSocket> =>
  Effect.gen(function* () {
    const obsService = yield* OBSService;
    const data = yield* obsService.fetchAllData;

    const registry = new TypeRegistry();
    const generator = new CodeGenerator(registry, config.generatorOptions);
    const code = yield* generator.generate(data);

    return code;
  }).pipe(Effect.provide(OBSServiceLive));

/**
 * Async wrapper for backward compatibility.
 * Connects to OBS, fetches all scene and input data, and generates
 * TypeScript code that recreates the OBS setup using @sceneify/core-rewrite.
 * 
 * @param config - Configuration for OBS connection and code generation
 * @returns Generated TypeScript code
 * 
 * @example
 * ```typescript
 * const code = await generateFromOBS({
 *   url: "ws://localhost:4455",
 *   password: "secret"
 * });
 * console.log(code);
 * ```
 */
export function generateFromOBS(
  config: GenerateFromOBSConfig
): Promise<string> {
  const program = generateCode(config).pipe(
    Effect.provide(OBSSocket.layer(config))
  );
  return Effect.runPromise(program);
}

/**
 * Utility functions for working with OBS data and code generation.
 */
export * from "./utils.ts";
