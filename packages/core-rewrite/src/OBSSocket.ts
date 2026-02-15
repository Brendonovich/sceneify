import { Context, Effect, Layer } from "effect";
import OBSWebSocket, * as OBS from "obs-websocket-js";
import { ConnectionError, OBSError } from "./errors.ts";

/**
 * Configuration for OBS WebSocket connection
 */
export interface OBSSocketConfig {
  readonly url: string;
  readonly password?: string;
}

/**
 * Metadata stored by Sceneify in OBS private settings to track ownership.
 */
export type SceneifyPrivateSettings = {
  init: "created" | "linked";
};

/**
 * Shape of the SCENEIFY key stored in source private settings.
 */
export type SceneifySourceData = SceneifyPrivateSettings & {
  filters?: Array<{ name: string }>;
};

interface RequestTypes extends OBS.OBSRequestTypes {
  GetSourcePrivateSettings: {
    sourceName?: string;
    sourceUuid?: string;
  };
  SetSourcePrivateSettings: {
    sourceName?: string;
    sourceUuid?: string;
    sourceSettings: any;
  };
}

interface ResponseTypes extends OBS.OBSResponseTypes {
  GetSourcePrivateSettings: {
    sourceSettings: any;
  };
  SetSourcePrivateSettings: void;
}

/**
 * OBS WebSocket service interface
 */
export interface OBSSocket {
  /**
   * Call an OBS WebSocket request
   */
  readonly call: <Type extends keyof RequestTypes>(
    requestType: Type,
    requestData?: RequestTypes[Type]
  ) => Effect.Effect<ResponseTypes[Type], OBSError>;

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
              // Cast needed because our RequestTypes/ResponseTypes extend the
              // base OBS types with undocumented private settings endpoints.
              return ws.call(requestType as any, requestData as any) as any;
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
