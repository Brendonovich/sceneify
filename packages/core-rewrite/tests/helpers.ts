import { Effect, Layer } from "effect";
import { OBSSocket, type OBSError } from "../src/index.js";
import * as SceneifyModule from "../src/Sceneify.js";

/**
 * A recorded OBS call for test assertions.
 */
export interface RecordedCall {
  requestType: string;
  requestData?: Record<string, unknown>;
}

/**
 * A handler for a specific OBS request type.
 * Can return data or throw to simulate errors.
 */
export type CallHandler = (requestData?: Record<string, unknown>) => unknown;

/**
 * Options for creating a mock OBS socket.
 */
export interface MockOBSSocketOptions {
  /**
   * Map of request type -> handler function.
   * If a handler is not provided for a request type, it returns {}.
   */
  handlers?: Record<string, CallHandler>;
}

/**
 * Creates a mock OBSSocket for testing.
 *
 * Returns the service object, a Layer for Effect context, and recorded calls.
 */
export function createMockOBSSocket(options: MockOBSSocketOptions = {}) {
  const calls: RecordedCall[] = [];
  const handlers = options.handlers ?? {};

  const service: OBSSocket.OBSSocket = {
    call: (requestType, requestData) => {
      calls.push({ requestType, requestData });

      const handler = handlers[requestType];
      if (handler) {
        return Effect.try({
          try: () => handler(requestData) as any,
          catch: (error) => error as OBSError,
        });
      }

      return Effect.succeed({} as any);
    },
    ws: null as any, // Not needed for unit tests
  };

  const layer = Layer.succeed(OBSSocket.OBSSocket, service);

  return { service, layer, calls };
}

/**
 * Creates a combined test layer with mock OBSSocket and a fresh Sceneify service.
 */
export function createTestLayer(options: MockOBSSocketOptions = {}) {
  const mock = createMockOBSSocket(options);
  const testLayer = Layer.merge(mock.layer, SceneifyModule.layer);
  return { layer: testLayer, calls: mock.calls, service: mock.service };
}

/**
 * Runs an Effect with mock OBSSocket and Sceneify layers.
 * Returns a promise of the result.
 */
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
