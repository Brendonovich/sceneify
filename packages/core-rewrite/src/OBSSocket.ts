import { Context, Effect, Layer } from "effect";
import OBSWebSocket, {
  type OBSRequestTypes,
  type OBSResponseTypes,
} from "obs-websocket-js";
import { ConnectionError, OBSError } from "./errors.ts";

/**
 * Configuration for OBS WebSocket connection
 */
export interface OBSSocketConfig {
  readonly url: string;
  readonly password?: string;
}

/**
 * OBS WebSocket service interface
 */
export interface OBSSocket {
  /**
   * Call an OBS WebSocket request
   */
  readonly call: <Type extends keyof OBSRequestTypes>(
    requestType: Type,
    requestData?: OBSRequestTypes[Type]
  ) => Effect.Effect<OBSResponseTypes[Type], OBSError>;

  /**
   * Get the underlying OBS WebSocket instance (for advanced usage)
   */
  readonly ws: OBSWebSocket;
}

/**
 * OBS WebSocket service tag
 */
export const OBSSocket = Context.GenericTag<OBSSocket>("@sceneify/OBSSocket");

/**
 * Create an OBS WebSocket layer from configuration
 */
export const layer = (
  config: OBSSocketConfig
): Layer.Layer<OBSSocket, ConnectionError> => {
  return Layer.scoped(
    OBSSocket,
    Effect.gen(function* () {
      const ws = new OBSWebSocket();

      // Connect to OBS
      yield* Effect.tryPromise({
        try: () => ws.connect(config.url, config.password),
        catch: (error) =>
          new ConnectionError({ url: config.url, cause: error }),
      });

      // Add finalizer to disconnect on scope cleanup
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          ws.disconnect();
        })
      );

      // Create the service implementation
      const service: OBSSocket = {
        call: (requestType, requestData) =>
          Effect.tryPromise({
            try: () => {
              console.log(`OBS.call: ${requestType}`);
              return ws.call(requestType, requestData);
            },
            catch: (error) =>
              new OBSError({
                message: `OBS request "${requestType}" failed: ${error}`,
                cause: error,
              }),
          }),
        ws,
      };

      return service;
    })
  );
};
