/**
 * @sceneify/obs-to-code
 * 
 * Reverse-engineers OBS scenes into TypeScript code that uses the
 * @sceneify/core-rewrite API.
 */

import { Effect } from "effect";
import { OBSSocket } from "@sceneify/core-rewrite";
import type { OBSData } from "./OBSFetcher.ts";
import { OBSFetcher } from "./OBSFetcher.ts";
import { CodeGenerator, type CodeGeneratorOptions } from "./CodeGenerator.ts";
import { TypeRegistry, UnknownKindError } from "./TypeRegistry.ts";
import { OBSService, OBSServiceLive } from "./OBSService.ts";
import type { OBSError } from "@sceneify/core-rewrite";

export { OBSFetcher, CodeGenerator, TypeRegistry, UnknownKindError };
export { OBSService, OBSServiceLive };
export type { OBSData, CodeGeneratorOptions };

/**
 * Effect-based code generation from OBS.
 * Returns an Effect that fetches data from OBS and generates TypeScript code.
 * 
 * Requires OBSSocket service to be provided via layer.
 * 
 * @param options - Options for code generation
 * @returns Effect that produces TypeScript code
 * 
 * @example
 * ```typescript
 * const program = generateCode({ allowInlineDefinitions: true }).pipe(
 *   Effect.provide(OBSSocket.layer({ url: "ws://localhost:4455" }))
 * );
 * const code = await Effect.runPromise(program);
 * ```
 */
export const generateCode = (
  options?: CodeGeneratorOptions
): Effect.Effect<string, UnknownKindError | OBSError, OBSSocket.OBSSocket> =>
  Effect.gen(function* () {
    const obsService = yield* OBSService;
    const data = yield* obsService.fetchAllData;

    const registry = new TypeRegistry();
    const generator = new CodeGenerator(registry, options);
    const code = yield* generator.generate(data);

    return code;
  }).pipe(Effect.provide(OBSServiceLive));

/**
 * Utility functions for working with OBS data and code generation.
 */
export * from "./utils.ts";
