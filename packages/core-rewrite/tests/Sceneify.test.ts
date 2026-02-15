import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect } from "effect";
import * as SceneifyModule from "../src/Sceneify.js";

const SceneifyLive = SceneifyModule.layer;

describe("Sceneify service", () => {
  it.scoped("should start with no registered inputs", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;
      expect(yield* sceneify.hasInput("test")).toBe(false);
    }).pipe(Effect.provide(SceneifyLive))
  );

  it.scoped("should register and retrieve an input", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;

      yield* sceneify.registerInput({ name: "Chat Browser" });

      const input = yield* sceneify.getInput("Chat Browser");
      expect(input).toEqual({ name: "Chat Browser" });
    }).pipe(Effect.provide(SceneifyLive))
  );

  it.scoped("should return undefined for unregistered inputs", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;
      const result = yield* sceneify.getInput("nonexistent");
      expect(result).toBeUndefined();
    }).pipe(Effect.provide(SceneifyLive))
  );

  it.scoped("should report hasInput correctly", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;

      const before = yield* sceneify.hasInput("Chat Browser");
      yield* sceneify.registerInput({ name: "Chat Browser" });
      const after = yield* sceneify.hasInput("Chat Browser");

      expect(before).toBe(false);
      expect(after).toBe(true);
    }).pipe(Effect.provide(SceneifyLive))
  );

  it.scoped("should clear all registered inputs", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;

      yield* sceneify.registerInput({ name: "Input 1" });
      yield* sceneify.registerInput({ name: "Input 2" });
      yield* sceneify.clear();

      const has1 = yield* sceneify.hasInput("Input 1");
      const has2 = yield* sceneify.hasInput("Input 2");

      expect(has1).toBe(false);
      expect(has2).toBe(false);
    }).pipe(Effect.provide(SceneifyLive))
  );

  it.scoped("should overwrite an input with the same name", () =>
    Effect.gen(function* () {
      const sceneify = yield* SceneifyModule.Sceneify;

      yield* sceneify.registerInput({ name: "Chat Browser" });
      yield* sceneify.registerInput({ name: "Chat Browser" });

      const input = yield* sceneify.getInput("Chat Browser");
      expect(input).toEqual({ name: "Chat Browser" });
    }).pipe(Effect.provide(SceneifyLive))
  );
});
