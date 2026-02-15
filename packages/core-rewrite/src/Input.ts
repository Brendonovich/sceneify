import type { InputTypeSettings, InputType } from "./InputType.ts";
import type { Filter } from "./Filter.ts";
import { OBSSocket } from "./OBSSocket.ts";
import { Effect } from "effect";
import type { OBSError } from "./errors.ts";
import type { FilterType } from "./FilterType.ts";

export namespace Input {
  /**
   * Represents a declared input with its type, name, settings, and optional filters.
   * TType is the InputType class (e.g. typeof BrowserSource).
   * TFilters is a record mapping filter keys to inline FilterConfigs.
   */
  export interface Declaration<
    TType extends InputType,
    TFilters extends Record<string, FilterType> = {}
  > {
    readonly type: TType;
    readonly name: string;
    readonly settings: Partial<InputTypeSettings<TType>>;
    readonly filters: FiltersDeclaration<TFilters>;
  }

  export namespace Declaration {
    export type Type<T extends Declaration<any, any>> = T extends Declaration<
      infer Type,
      any
    >
      ? Type
      : never;

    export type Filters<T extends Declaration<any, any>> =
      T extends Declaration<any, infer Filters> ? Filters : never;
  }

  /**
   * Runtime representation of an input in OBS.
   * OBSSocket is captured at creation time - methods return Effects
   * that do not require OBSSocket in context.
   */
  export interface Input<
    TType extends InputType<string, any>,
    TFilters extends Record<string, FilterType>
  > {
    /** The input name in OBS */
    readonly name: string;
    /** The OBS input kind */
    readonly kind: string;

    /** Set input settings (partial update) */
    readonly setSettings: (
      settings: Partial<InputTypeSettings<TType>>
    ) => Effect.Effect<void, OBSError>;

    /** Get current input settings */
    readonly getSettings: () => Effect.Effect<
      InputTypeSettings<TType>,
      OBSError
    >;

    /** Get mute state */
    readonly getMuted: () => Effect.Effect<boolean, OBSError>;

    /** Set mute state */
    readonly setMuted: (muted: boolean) => Effect.Effect<void, OBSError>;

    /** Toggle mute state, returns new state */
    readonly toggleMuted: () => Effect.Effect<boolean, OBSError>;

    /** Get volume (returns { db, mul }) */
    readonly getVolume: () => Effect.Effect<
      { db: number; mul: number },
      OBSError
    >;

    /** Set volume (accepts { db } or { mul }) */
    readonly setVolume: (
      volume: { db: number } | { mul: number }
    ) => Effect.Effect<void, OBSError>;

    /** Get audio sync offset in milliseconds */
    readonly getAudioSyncOffset: () => Effect.Effect<number, OBSError>;

    /** Set audio sync offset in milliseconds */
    readonly setAudioSyncOffset: (
      offset: number
    ) => Effect.Effect<void, OBSError>;

    /** Set audio monitor type */
    readonly setAudioMonitorType: (
      type: "none" | "monitorOnly" | "monitorAndOutput"
    ) => Effect.Effect<void, OBSError>;

    /** Get all filters on this input */
    readonly getFilters: () => Effect.Effect<
      Array<{
        filterEnabled: boolean;
        filterIndex: number;
        filterKind: string;
        filterName: string;
        filterSettings: Record<string, unknown>;
      }>,
      OBSError
    >;

    /** Access a declared filter by key */
    readonly filter: <K extends keyof TFilters>(
      key: K
    ) => Filter.Filter<TFilters[K]>;

    readonly getPropertyListItems: (
      property: keyof InputTypeSettings<TType> & string
    ) => Effect.Effect<
      { name: string; enabled: boolean; value?: string | number }[],
      OBSError
    >;
  }

  type FiltersDeclaration<TFilters extends Record<string, FilterType>> = {
    [K in keyof TFilters]: Filter.Config<TFilters[K]>;
  };

  /**
   * Declare an input instance from an InputType class.
   *
   * Settings are type-checked against the InputType's settings type.
   * Filters are defined inline with their type, name, and optional settings/enabled.
   *
   * Usage:
   * ```ts
   * const chatBrowser = Input.declare(BrowserSource, {
   *   name: "Chat Browser",
   *   settings: { url: "https://twitch.tv/chat", width: 1920 },
   *   filters: {
   *     colorFix: {
   *       type: ColorCorrection,
   *       name: "Color Fix",
   *       settings: { gamma: 1.5 },
   *     },
   *   },
   * });
   * ```
   */
  export const declare = <
    const TType extends InputType<any, any>,
    const TFilters extends Record<string, FilterType> = {}
  >(
    type: TType,
    options: {
      name: string;
      settings?: Partial<InputTypeSettings<TType>>;
      filters?: FiltersDeclaration<TFilters>;
    }
  ): Input.Declaration<TType, TFilters> => {
    return {
      type,
      name: options.name,
      settings: options.settings ?? ({} as Partial<InputTypeSettings<TType>>),
      filters: options.filters ?? ({} as FiltersDeclaration<TFilters>),
    };
  };

  /**
   * Makes an Input object from name, kind, and filters
   * The OBSSocket is captured at creation and used for all subsequent calls.
   */
  export const make = Effect.fnUntraced(function* <
    TType extends InputType<string, any>,
    TFilters extends Record<string, FilterType>
  >(
    name: string,
    kind: string,
    filters: { [K in keyof TFilters]: Filter.Filter<TFilters[K]> } = {} as any
  ) {
    const obs = yield* OBSSocket;

    const monitorTypeMap = {
      none: "OBS_MONITORING_TYPE_NONE",
      monitorOnly: "OBS_MONITORING_TYPE_MONITOR_ONLY",
      monitorAndOutput: "OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT",
    } as const;

    return {
      name,
      kind,

      setSettings: (settings) =>
        Effect.gen(function* () {
          yield* obs.call("SetInputSettings", {
            inputName: name,
            inputSettings: settings as any,
          });
        }),

      getSettings: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetInputSettings", {
            inputName: name,
          });
          return result.inputSettings as InputTypeSettings<TType>;
        }),

      getMuted: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetInputMute", {
            inputName: name,
          });
          return result.inputMuted as boolean;
        }),

      setMuted: (muted) =>
        Effect.gen(function* () {
          yield* obs.call("SetInputMute", {
            inputName: name,
            inputMuted: muted,
          });
        }),

      toggleMuted: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("ToggleInputMute", {
            inputName: name,
          });
          return result.inputMuted as boolean;
        }),

      getVolume: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetInputVolume", {
            inputName: name,
          });
          return {
            db: result.inputVolumeDb as number,
            mul: result.inputVolumeMul as number,
          };
        }),

      setVolume: (volume) =>
        Effect.gen(function* () {
          const data: Record<string, unknown> = { inputName: name };
          if ("db" in volume) {
            data.inputVolumeDb = volume.db;
          } else {
            data.inputVolumeMul = volume.mul;
          }
          yield* obs.call("SetInputVolume", data);
        }),

      getAudioSyncOffset: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetInputAudioSyncOffset", {
            inputName: name,
          });
          return result.inputAudioSyncOffset as number;
        }),

      setAudioSyncOffset: (offset) =>
        Effect.gen(function* () {
          yield* obs.call("SetInputAudioSyncOffset", {
            inputName: name,
            inputAudioSyncOffset: offset,
          });
        }),

      setAudioMonitorType: (type) =>
        Effect.gen(function* () {
          yield* obs.call("SetInputAudioMonitorType", {
            inputName: name,
            monitorType: monitorTypeMap[type],
          });
        }),

      getFilters: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetSourceFilterList", {
            sourceName: name,
          });
          return result.filters as any;
        }),

      filter: (key) => {
        const f = filters[key];
        if (!f) {
          throw new Error(
            `Filter "${String(
              key
            )}" not found on input "${name}". Available filters: ${Object.keys(
              filters
            ).join(", ")}`
          );
        }
        return f;
      },
      getPropertyListItems: (property) =>
        obs
          .call("GetInputPropertiesListPropertyItems", {
            inputName: name,
            propertyName: property,
          })
          .pipe(
            Effect.map((v) =>
              v.propertyItems.map((v) => ({
                name: v.itemName,
                enabled: v.itemEnabled,
                value: v.itemValue,
              }))
            )
          ),
    } as Input<TType, TFilters>;
  });
}
