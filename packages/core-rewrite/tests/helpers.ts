import { Effect, Layer } from "effect";
import { MockOBSSocket, OBSSocket } from "../src/index.js";
import * as SceneifyModule from "../src/Sceneify.js";

export type MockOBSSocketOptions = MockOBSSocket.Options;

/**
 * Creates the stateful in-memory OBS implementation used by tests.
 */
export function createMockOBSSocket(options: MockOBSSocketOptions = {}) {
  const mock = MockOBSSocket.make(options);

  // Existing tests retain this array reference. Forward reads to the mock's
  // current immutable call list as each request replaces it.
  const calls = new Proxy([] as MockOBSSocket.RecordedCall[], {
    get: (_target, property) => Reflect.get(mock.calls, property, mock.calls),
    has: (_target, property) => Reflect.has(mock.calls, property),
  });

  return {
    service: mock.service,
    layer: mock.layer,
    calls,
    snapshot: mock.snapshot,
  };
}

/**
 * Creates a combined test layer with in-memory OBS and fresh Sceneify state.
 */
export function createTestLayer(options: MockOBSSocketOptions = {}) {
  const mock = createMockOBSSocket(options);
  const testLayer = Layer.merge(mock.layer, SceneifyModule.layer);
  return { ...mock, layer: testLayer };
}

export function runEffect<A, E>(
  effect: Effect.Effect<A, E, OBSSocket.OBSSocket | SceneifyModule.Sceneify>,
  options: MockOBSSocketOptions = {}
) {
  const { layer, calls } = createTestLayer(options);
  const run = Effect.runPromise(
    effect.pipe(Effect.scoped, Effect.provide(layer))
  );
  return { result: run as Promise<A>, calls };
}
