import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import * as SceneifyModule from "../src/Sceneify.js";

/**
 * Run an effect with a fresh Sceneify layer.
 */
function runSceneifyEffect<A>(
  effect: Effect.Effect<A, never, SceneifyModule.Sceneify>
) {
  return Effect.runPromise(
    effect.pipe(Effect.scoped, Effect.provide(SceneifyModule.layer))
  );
}

describe("Sceneify service", () => {
  it("should start with no registered inputs", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;
        return yield* sceneify.hasInput("test");
      })
    );

    expect(result).toBe(false);
  });

  it("should register and retrieve an input", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;

        yield* sceneify.registerInput({ name: "Chat Browser" });

        const input = yield* sceneify.getInput("Chat Browser");
        return input;
      })
    );

    expect(result).toEqual({ name: "Chat Browser" });
  });

  it("should return undefined for unregistered inputs", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;
        return yield* sceneify.getInput("nonexistent");
      })
    );

    expect(result).toBeUndefined();
  });

  it("should report hasInput correctly", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;

        const before = yield* sceneify.hasInput("Chat Browser");
        yield* sceneify.registerInput({ name: "Chat Browser" });
        const after = yield* sceneify.hasInput("Chat Browser");

        return { before, after };
      })
    );

    expect(result.before).toBe(false);
    expect(result.after).toBe(true);
  });

  it("should clear all registered inputs", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;

        yield* sceneify.registerInput({ name: "Input 1" });
        yield* sceneify.registerInput({ name: "Input 2" });
        yield* sceneify.clear();

        const has1 = yield* sceneify.hasInput("Input 1");
        const has2 = yield* sceneify.hasInput("Input 2");

        return { has1, has2 };
      })
    );

    expect(result.has1).toBe(false);
    expect(result.has2).toBe(false);
  });

  it("should overwrite an input with the same name", async () => {
    const result = await runSceneifyEffect(
      Effect.gen(function* () {
        const sceneify = yield* SceneifyModule.Sceneify;

        yield* sceneify.registerInput({ name: "Chat Browser" });
        yield* sceneify.registerInput({ name: "Chat Browser" });

        const input = yield* sceneify.getInput("Chat Browser");
        return input;
      })
    );

    expect(result).toEqual({ name: "Chat Browser" });
  });
});
