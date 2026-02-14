import { Context, Effect, Layer, HashMap, Ref, Option } from "effect";

/**
 * Placeholder for Input type (will be implemented in Phase 2)
 */
export interface Input {
  readonly name: string;
}

/**
 * Sceneify service interface
 * Tracks instantiated inputs to prevent duplicate creation
 */
export interface Sceneify {
  /**
   * Get an input by name if it has been instantiated
   */
  readonly getInput: (
    name: string
  ) => Effect.Effect<Input | undefined, never>;

  /**
   * Register an instantiated input
   */
  readonly registerInput: (input: Input) => Effect.Effect<void, never>;

  /**
   * Check if an input has been instantiated
   */
  readonly hasInput: (name: string) => Effect.Effect<boolean, never>;

  /**
   * Clear all registered inputs (mainly for testing)
   */
  readonly clear: () => Effect.Effect<void, never>;
}

/**
 * Sceneify service tag
 */
export const Sceneify = Context.GenericTag<Sceneify>("@sceneify/Sceneify");

/**
 * Create a Sceneify layer
 */
export const layer: Layer.Layer<Sceneify> = Layer.scoped(
  Sceneify,
  Effect.gen(function* () {
    // Create a Ref to hold the map of instantiated inputs
    const inputsRef = yield* Ref.make(HashMap.empty<string, Input>());

    // Create the service implementation
    const service: Sceneify = {
      getInput: (name) =>
        Ref.get(inputsRef).pipe(
          Effect.map((inputs) =>
            Option.getOrUndefined(HashMap.get(inputs, name))
          )
        ),

      registerInput: (input) =>
        Ref.update(inputsRef, (inputs) =>
          HashMap.set(inputs, input.name, input)
        ),

      hasInput: (name) =>
        Ref.get(inputsRef).pipe(
          Effect.map((inputs) => HashMap.has(inputs, name))
        ),

      clear: () => Ref.set(inputsRef, HashMap.empty()),
    };

    return service;
  })
);
