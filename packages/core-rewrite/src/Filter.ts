import { Effect } from "effect";
import type { FilterTypeSettings, FilterType } from "./FilterType.ts";
import { OBSSocket } from "./OBSSocket.ts";
import type { OBSError } from "./errors.ts";

export namespace Filter {
  /**
   * Inline filter configuration for use within Input.declare.
   * Filters are always attached to an input, so there is no standalone declaration.
   *
   * Usage:
   * ```ts
   * Input.declare(BrowserSource, {
   *   name: "Webcam",
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
  export interface Config<TType extends FilterType = FilterType> {
    readonly type: TType;
    readonly name: string;
    readonly settings?: Partial<FilterTypeSettings<TType>>;
    readonly enabled?: boolean;
  }

  /**
   * Runtime representation of a filter on an OBS source.
   * OBSSocket is captured at creation time - methods return Effects
   * that do not require OBSSocket in context.
   */
  export interface Filter<TType extends FilterType = FilterType> {
    /** The filter name in OBS */
    readonly name: string;
    /** The source this filter is applied to */
    readonly sourceName: string;

    /** Get current filter settings */
    readonly getSettings: () => Effect.Effect<
      FilterTypeSettings<TType>,
      OBSError
    >;

    /** Set filter settings (partial update) */
    readonly setSettings: (
      settings: Partial<FilterTypeSettings<TType>>
    ) => Effect.Effect<void, OBSError>;

    /** Set filter enabled state */
    readonly setEnabled: (enabled: boolean) => Effect.Effect<void, OBSError>;

    /** Set filter index/order */
    readonly setIndex: (index: number) => Effect.Effect<void, OBSError>;
  }

  /**
   * Creates a Filter from a filter name and its parent source name.
   * The OBSSocket is captured at creation and used for all subsequent calls.
   */
  export const make = Effect.fnUntraced(function* <TType extends FilterType>(
    name: string,
    sourceName: string
  ) {
    const obs = yield* OBSSocket;

    return {
      name,
      sourceName,

      getSettings: () =>
        Effect.gen(function* () {
          const result = yield* obs.call("GetSourceFilter", {
            sourceName,
            filterName: name,
          });
          return result.filterSettings as FilterTypeSettings<TType>;
        }),

      setSettings: (settings) =>
        Effect.gen(function* () {
          yield* obs.call("SetSourceFilterSettings", {
            sourceName,
            filterName: name,
            filterSettings: settings as any,
          });
        }),

      setEnabled: (enabled) =>
        Effect.gen(function* () {
          yield* obs.call("SetSourceFilterEnabled", {
            sourceName,
            filterName: name,
            filterEnabled: enabled,
          });
        }),

      setIndex: (index) =>
        Effect.gen(function* () {
          yield* obs.call("SetSourceFilterIndex", {
            sourceName,
            filterName: name,
            filterIndex: index,
          });
        }),
    } as Filter<TType>;
  });
}
