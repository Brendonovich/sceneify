import { Effect, Layer } from "effect";
import type OBSWebSocket from "obs-websocket-js";
import { OBSError } from "./errors.ts";
import { OBSSocket } from "./OBSSocket.ts";

export type Settings = Readonly<Record<string, any>>;

export interface RecordedCall {
  readonly requestType: string;
  readonly requestData?: Readonly<Record<string, unknown>>;
}

export interface FilterSeed {
  readonly name: string;
  readonly kind: string;
  readonly settings?: Settings;
  readonly enabled?: boolean;
}

export interface InputSeed {
  readonly name: string;
  readonly kind: string;
  readonly settings?: Settings;
  readonly privateSettings?: Settings;
  readonly filters?: ReadonlyArray<FilterSeed>;
  readonly muted?: boolean;
  readonly volumeMul?: number;
  readonly audioSyncOffset?: number;
  readonly audioMonitorType?: string;
  readonly propertyLists?: Readonly<
    Record<
      string,
      ReadonlyArray<{
        readonly name: string;
        readonly enabled?: boolean;
        readonly value?: string | number;
      }>
    >
  >;
}

export interface SceneItemSeed {
  readonly sourceName: string;
  readonly id?: number;
  readonly enabled?: boolean;
  readonly locked?: boolean;
  readonly transform?: Settings;
  readonly privateSettings?: Settings;
}

export interface SceneSeed {
  readonly name: string;
  readonly privateSettings?: Settings;
  readonly filters?: ReadonlyArray<FilterSeed>;
  readonly items?: ReadonlyArray<SceneItemSeed>;
}

export interface Options {
  readonly scenes?: ReadonlyArray<SceneSeed>;
  readonly inputs?: ReadonlyArray<InputSeed>;
  readonly currentProgramSceneName?: string;
  readonly currentPreviewSceneName?: string | null;
}

export interface FilterSnapshot {
  readonly name: string;
  readonly kind: string;
  readonly settings: Settings;
  readonly enabled: boolean;
  readonly index: number;
}

export interface InputSnapshot {
  readonly name: string;
  readonly uuid: string;
  readonly kind: string;
  readonly settings: Settings;
  readonly privateSettings: Settings;
  readonly filters: ReadonlyArray<FilterSnapshot>;
  readonly muted: boolean;
  readonly volumeMul: number;
  readonly audioSyncOffset: number;
  readonly audioMonitorType: string;
  readonly propertyLists: NonNullable<InputSeed["propertyLists"]>;
}

export interface SceneItemSnapshot {
  readonly sourceName: string;
  readonly id: number;
  readonly enabled: boolean;
  readonly locked: boolean;
  readonly transform: Settings;
  readonly privateSettings: Settings;
  readonly index: number;
}

export interface SceneSnapshot {
  readonly name: string;
  readonly uuid: string;
  readonly privateSettings: Settings;
  readonly filters: ReadonlyArray<FilterSnapshot>;
  readonly items: ReadonlyArray<SceneItemSnapshot>;
}

export interface Snapshot {
  readonly scenes: ReadonlyArray<SceneSnapshot>;
  readonly inputs: ReadonlyArray<InputSnapshot>;
  readonly currentProgramSceneName: string | null;
  readonly currentPreviewSceneName: string | null;
}

interface State extends Snapshot {
  readonly nextUuid: number;
  readonly nextSceneItemId: number;
}

interface Reduction {
  readonly state: State;
  readonly response: unknown;
}

class RequestError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

// Request data is copied and frozen once at the boundary. State, responses,
// and snapshots can then safely share readonly values without output cloning.
const copyIn = <T>(value: T): T => deepFreeze(structuredClone(value));

const reindex = <T extends { readonly index: number }>(
  values: ReadonlyArray<T>
): ReadonlyArray<T> =>
  values.map((value, index) =>
    value.index === index ? value : { ...value, index }
  );

const filterFromSeed = (seed: FilterSeed, index: number): FilterSnapshot => ({
  name: seed.name,
  kind: seed.kind,
  settings: copyIn(seed.settings ?? {}),
  enabled: seed.enabled ?? true,
  index,
});

const defaultTransform = (input?: InputSnapshot): Settings => {
  const sourceWidth = Number(input?.settings.width ?? 0);
  const sourceHeight = Number(input?.settings.height ?? 0);
  return {
    alignment: 5,
    boundsAlignment: 0,
    boundsHeight: 0,
    boundsType: "OBS_BOUNDS_NONE",
    boundsWidth: 0,
    cropBottom: 0,
    cropLeft: 0,
    cropRight: 0,
    cropToBounds: false,
    cropTop: 0,
    positionX: 0,
    positionY: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    sourceHeight,
    sourceWidth,
    height: sourceHeight,
    width: sourceWidth,
  };
};

const findInput = (state: State, name: string): InputSnapshot | undefined =>
  state.inputs.find((value) => value.name === name);

const findScene = (state: State, name: string): SceneSnapshot | undefined =>
  state.scenes.find((value) => value.name === name);

const requireInput = (state: State, name: string): InputSnapshot => {
  const value = findInput(state, name);
  if (!value) {
    throw new RequestError(
      600,
      `No source was found by the name of \`${name}\`.`
    );
  }
  return value;
};

const requireScene = (state: State, name: string): SceneSnapshot => {
  const value = findScene(state, name);
  if (!value) {
    throw new RequestError(
      600,
      `No source was found by the name of \`${name}\`.`
    );
  }
  return value;
};

const requireSource = (
  state: State,
  name: string
): InputSnapshot | SceneSnapshot => {
  const value = findInput(state, name) ?? findScene(state, name);
  if (!value) {
    throw new RequestError(
      600,
      `No source was found by the name of \`${name}\`.`
    );
  }
  return value;
};

const requireSceneItem = (
  state: State,
  sceneName: string,
  id: number
): SceneItemSnapshot => {
  const value = requireScene(state, sceneName).items.find(
    (item) => item.id === id
  );
  if (!value) {
    throw new RequestError(
      600,
      `No scene item was found with the numeric ID \`${id}\` in the scene \`${sceneName}\`.`
    );
  }
  return value;
};

const requireFilter = (
  state: State,
  sourceName: string,
  filterName: string
): FilterSnapshot => {
  const value = requireSource(state, sourceName).filters.find(
    (candidate) => candidate.name === filterName
  );
  if (!value) {
    throw new RequestError(
      600,
      `No filter was found in the source \`${sourceName}\` with the name \`${filterName}\`.`
    );
  }
  return value;
};

const updateInput = (
  state: State,
  name: string,
  update: (input: InputSnapshot) => InputSnapshot
): State => {
  requireInput(state, name);
  return {
    ...state,
    inputs: state.inputs.map((value) =>
      value.name === name ? update(value) : value
    ),
  };
};

const updateScene = (
  state: State,
  name: string,
  update: (scene: SceneSnapshot) => SceneSnapshot
): State => {
  requireScene(state, name);
  return {
    ...state,
    scenes: state.scenes.map((value) =>
      value.name === name ? update(value) : value
    ),
  };
};

const updateSource = (
  state: State,
  name: string,
  update: (
    source: InputSnapshot | SceneSnapshot
  ) => InputSnapshot | SceneSnapshot
): State => {
  if (findInput(state, name)) {
    return updateInput(state, name, (value) => update(value) as InputSnapshot);
  }
  return updateScene(state, name, (value) => update(value) as SceneSnapshot);
};

const updateSceneItem = (
  state: State,
  sceneName: string,
  id: number,
  update: (item: SceneItemSnapshot) => SceneItemSnapshot
): State => {
  requireSceneItem(state, sceneName, id);
  return updateScene(state, sceneName, (value) => ({
    ...value,
    items: value.items.map((item) => (item.id === id ? update(item) : item)),
  }));
};

const renderedTransform = (state: State, item: SceneItemSnapshot): Settings => {
  const input = findInput(state, item.sourceName);
  const sourceWidth = Number(input?.settings.width ?? 0);
  const sourceHeight = Number(input?.settings.height ?? 0);
  return {
    ...item.transform,
    sourceWidth,
    sourceHeight,
    width: sourceWidth * Number(item.transform.scaleX ?? 1),
    height: sourceHeight * Number(item.transform.scaleY ?? 1),
  };
};

const filterResponse = (value: FilterSnapshot) => ({
  filterEnabled: value.enabled,
  filterIndex: value.index,
  filterKind: value.kind,
  filterSettings: value.settings,
});

const unchanged = (state: State, response?: unknown): Reduction => ({
  state,
  response,
});

const changed = (state: State, response?: unknown): Reduction => ({
  state,
  response,
});

const reduceRequest = (
  state: State,
  requestType: string,
  data: Record<string, any> = {}
): Reduction => {
  switch (requestType) {
    case "GetSceneList":
      return unchanged(state, {
        currentPreviewSceneName: state.currentPreviewSceneName,
        currentPreviewSceneUuid: state.currentPreviewSceneName
          ? requireScene(state, state.currentPreviewSceneName).uuid
          : null,
        currentProgramSceneName: state.currentProgramSceneName,
        currentProgramSceneUuid: state.currentProgramSceneName
          ? requireScene(state, state.currentProgramSceneName).uuid
          : null,
        scenes: state.scenes.map((value) => ({
          sceneIndex: state.scenes.indexOf(value),
          sceneName: value.name,
          sceneUuid: value.uuid,
        })),
      });

    case "CreateScene": {
      if (
        findInput(state, data.sceneName) ||
        findScene(state, data.sceneName)
      ) {
        throw new RequestError(
          601,
          "A source already exists by that scene name."
        );
      }
      const created: SceneSnapshot = {
        name: data.sceneName,
        uuid: `mock-scene-${state.nextUuid}`,
        privateSettings: {},
        filters: [],
        items: [],
      };
      return changed(
        {
          ...state,
          scenes: [...state.scenes, created],
          currentProgramSceneName:
            state.currentProgramSceneName ?? created.name,
          nextUuid: state.nextUuid + 1,
        },
        { sceneUuid: created.uuid }
      );
    }

    case "RemoveScene": {
      requireScene(state, data.sceneName);
      const scenes = state.scenes.filter(
        (value) => value.name !== data.sceneName
      );
      return changed({
        ...state,
        scenes,
        currentProgramSceneName:
          state.currentProgramSceneName === data.sceneName
            ? scenes[0]?.name ?? null
            : state.currentProgramSceneName,
        currentPreviewSceneName:
          state.currentPreviewSceneName === data.sceneName
            ? null
            : state.currentPreviewSceneName,
      });
    }

    case "GetSceneItemList": {
      const target = requireScene(state, data.sceneName);
      return unchanged(state, {
        sceneItems: target.items.map((item) => {
          const input = findInput(state, item.sourceName);
          const nestedScene = findScene(state, item.sourceName);
          return {
            inputKind: input?.kind ?? null,
            isGroup: null,
            sceneItemBlendMode: "OBS_BLEND_NORMAL",
            sceneItemEnabled: item.enabled,
            sceneItemId: item.id,
            sceneItemIndex: item.index,
            sceneItemLocked: item.locked,
            sceneItemTransform: renderedTransform(state, item),
            sourceName: item.sourceName,
            sourceType: input
              ? "OBS_SOURCE_TYPE_INPUT"
              : "OBS_SOURCE_TYPE_SCENE",
            sourceUuid: input?.uuid ?? nestedScene?.uuid,
          };
        }),
      });
    }

    case "CreateInput": {
      requireScene(state, data.sceneName);
      if (
        findInput(state, data.inputName) ||
        findScene(state, data.inputName)
      ) {
        throw new RequestError(
          601,
          "A source already exists by that input name."
        );
      }
      const created: InputSnapshot = {
        name: data.inputName,
        uuid: `mock-input-${state.nextUuid}`,
        kind: data.inputKind,
        settings: copyIn(data.inputSettings ?? {}),
        privateSettings: {},
        filters: [],
        muted: false,
        volumeMul: 1,
        audioSyncOffset: 0,
        audioMonitorType: "OBS_MONITORING_TYPE_NONE",
        propertyLists: {},
      };
      const item: SceneItemSnapshot = {
        id: state.nextSceneItemId,
        sourceName: created.name,
        enabled: data.sceneItemEnabled ?? true,
        locked: false,
        transform: defaultTransform(created),
        privateSettings: {},
        index: requireScene(state, data.sceneName).items.length,
      };
      const next = updateScene(
        { ...state, inputs: [...state.inputs, created] },
        data.sceneName,
        (value) => ({ ...value, items: [...value.items, item] })
      );
      return changed(
        {
          ...next,
          nextUuid: state.nextUuid + 1,
          nextSceneItemId: state.nextSceneItemId + 1,
        },
        { inputUuid: created.uuid, sceneItemId: item.id }
      );
    }

    case "RemoveInput": {
      requireInput(state, data.inputName);
      return changed({
        ...state,
        inputs: state.inputs.filter((value) => value.name !== data.inputName),
        scenes: state.scenes.map((value) => {
          if (!value.items.some((item) => item.sourceName === data.inputName)) {
            return value;
          }
          return {
            ...value,
            items: reindex(
              value.items.filter((item) => item.sourceName !== data.inputName)
            ),
          };
        }),
      });
    }

    case "CreateSceneItem": {
      requireSource(state, data.sourceName);
      const target = requireScene(state, data.sceneName);
      const item: SceneItemSnapshot = {
        id: state.nextSceneItemId,
        sourceName: data.sourceName,
        enabled: data.sceneItemEnabled ?? true,
        locked: false,
        transform: defaultTransform(findInput(state, data.sourceName)),
        privateSettings: {},
        index: target.items.length,
      };
      return changed(
        {
          ...updateScene(state, data.sceneName, (value) => ({
            ...value,
            items: [...value.items, item],
          })),
          nextSceneItemId: state.nextSceneItemId + 1,
        },
        { sceneItemId: item.id }
      );
    }

    case "RemoveSceneItem": {
      requireSceneItem(state, data.sceneName, data.sceneItemId);
      return changed(
        updateScene(state, data.sceneName, (value) => ({
          ...value,
          items: reindex(
            value.items.filter((item) => item.id !== data.sceneItemId)
          ),
        }))
      );
    }

    case "GetSceneItemTransform":
      return unchanged(state, {
        sceneItemTransform: renderedTransform(
          state,
          requireSceneItem(state, data.sceneName, data.sceneItemId)
        ),
      });

    case "SetSceneItemTransform":
      return changed(
        updateSceneItem(state, data.sceneName, data.sceneItemId, (item) => ({
          ...item,
          transform: {
            ...item.transform,
            ...copyIn(data.sceneItemTransform),
          },
        }))
      );

    case "SetSceneItemEnabled":
      return changed(
        updateSceneItem(state, data.sceneName, data.sceneItemId, (item) => ({
          ...item,
          enabled: data.sceneItemEnabled,
        }))
      );

    case "SetSceneItemLocked":
      return changed(
        updateSceneItem(state, data.sceneName, data.sceneItemId, (item) => ({
          ...item,
          locked: data.sceneItemLocked,
        }))
      );

    case "SetSceneItemIndex": {
      const target = requireScene(state, data.sceneName);
      const item = requireSceneItem(state, data.sceneName, data.sceneItemId);
      const without = target.items.filter((value) => value.id !== item.id);
      const index = Math.max(0, Math.min(data.sceneItemIndex, without.length));
      return changed(
        updateScene(state, data.sceneName, (value) => ({
          ...value,
          items: reindex([
            ...without.slice(0, index),
            item,
            ...without.slice(index),
          ]),
        }))
      );
    }

    case "GetInputSettings": {
      const value = requireInput(state, data.inputName);
      return unchanged(state, {
        inputKind: value.kind,
        inputSettings: value.settings,
      });
    }

    case "SetInputSettings":
      return changed(
        updateInput(state, data.inputName, (value) => ({
          ...value,
          settings:
            data.overlay === false
              ? copyIn(data.inputSettings)
              : { ...value.settings, ...copyIn(data.inputSettings) },
        }))
      );

    case "GetInputMute":
      return unchanged(state, {
        inputMuted: requireInput(state, data.inputName).muted,
      });

    case "SetInputMute":
      return changed(
        updateInput(state, data.inputName, (value) => ({
          ...value,
          muted: data.inputMuted,
        }))
      );

    case "ToggleInputMute": {
      const muted = !requireInput(state, data.inputName).muted;
      return changed(
        updateInput(state, data.inputName, (value) => ({ ...value, muted })),
        { inputMuted: muted }
      );
    }

    case "GetInputVolume": {
      const mul = requireInput(state, data.inputName).volumeMul;
      return unchanged(state, {
        inputVolumeDb: mul === 0 ? -100 : 20 * Math.log10(mul),
        inputVolumeMul: mul,
      });
    }

    case "SetInputVolume":
      return changed(
        updateInput(state, data.inputName, (value) => ({
          ...value,
          volumeMul:
            data.inputVolumeMul ?? Math.pow(10, data.inputVolumeDb / 20),
        }))
      );

    case "GetInputAudioSyncOffset":
      return unchanged(state, {
        inputAudioSyncOffset: requireInput(state, data.inputName)
          .audioSyncOffset,
      });

    case "SetInputAudioSyncOffset":
      return changed(
        updateInput(state, data.inputName, (value) => ({
          ...value,
          audioSyncOffset: data.inputAudioSyncOffset,
        }))
      );

    case "GetInputAudioMonitorType":
      return unchanged(state, {
        monitorType: requireInput(state, data.inputName).audioMonitorType,
      });

    case "SetInputAudioMonitorType":
      return changed(
        updateInput(state, data.inputName, (value) => ({
          ...value,
          audioMonitorType: data.monitorType,
        }))
      );

    case "GetInputPropertiesListPropertyItems": {
      const items =
        requireInput(state, data.inputName).propertyLists[data.propertyName] ??
        [];
      return unchanged(state, {
        propertyItems: items.map((item) => ({
          itemEnabled: item.enabled ?? true,
          itemName: item.name,
          ...(item.value === undefined ? {} : { itemValue: item.value }),
        })),
      });
    }

    case "GetSourcePrivateSettings":
      return unchanged(state, {
        sourceSettings: requireSource(state, data.sourceName).privateSettings,
      });

    case "SetSourcePrivateSettings":
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          privateSettings: {
            ...value.privateSettings,
            ...copyIn(data.sourceSettings),
          },
        }))
      );

    case "GetSceneItemPrivateSettings":
      return unchanged(state, {
        sceneItemSettings: requireSceneItem(
          state,
          data.sceneName,
          data.sceneItemId
        ).privateSettings,
      });

    case "SetSceneItemPrivateSettings":
      return changed(
        updateSceneItem(state, data.sceneName, data.sceneItemId, (item) => ({
          ...item,
          privateSettings: {
            ...item.privateSettings,
            ...copyIn(data.sceneItemSettings),
          },
        }))
      );

    case "GetSourceFilterList":
      return unchanged(state, {
        filters: requireSource(state, data.sourceName).filters.map((value) => ({
          filterName: value.name,
          ...filterResponse(value),
        })),
      });

    case "GetSourceFilter":
      return unchanged(
        state,
        filterResponse(requireFilter(state, data.sourceName, data.filterName))
      );

    case "CreateSourceFilter": {
      const source = requireSource(state, data.sourceName);
      if (source.filters.some((value) => value.name === data.filterName)) {
        throw new RequestError(601, "A filter already exists by that name.");
      }
      const created: FilterSnapshot = {
        name: data.filterName,
        kind: data.filterKind,
        settings: copyIn(data.filterSettings ?? {}),
        enabled: true,
        index: source.filters.length,
      };
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          filters: [...value.filters, created],
        }))
      );
    }

    case "RemoveSourceFilter": {
      requireFilter(state, data.sourceName, data.filterName);
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          filters: reindex(
            value.filters.filter((filter) => filter.name !== data.filterName)
          ),
        }))
      );
    }

    case "SetSourceFilterSettings":
      requireFilter(state, data.sourceName, data.filterName);
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          filters: value.filters.map((filter) =>
            filter.name === data.filterName
              ? {
                  ...filter,
                  settings:
                    data.overlay === false
                      ? copyIn(data.filterSettings)
                      : {
                          ...filter.settings,
                          ...copyIn(data.filterSettings),
                        },
                }
              : filter
          ),
        }))
      );

    case "SetSourceFilterEnabled":
      requireFilter(state, data.sourceName, data.filterName);
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          filters: value.filters.map((filter) =>
            filter.name === data.filterName
              ? { ...filter, enabled: data.filterEnabled }
              : filter
          ),
        }))
      );

    case "SetSourceFilterIndex": {
      const source = requireSource(state, data.sourceName);
      const filter = requireFilter(state, data.sourceName, data.filterName);
      const without = source.filters.filter(
        (value) => value.name !== filter.name
      );
      const index = Math.max(0, Math.min(data.filterIndex, without.length));
      return changed(
        updateSource(state, data.sourceName, (value) => ({
          ...value,
          filters: reindex([
            ...without.slice(0, index),
            filter,
            ...without.slice(index),
          ]),
        }))
      );
    }

    case "SetCurrentProgramScene":
      requireScene(state, data.sceneName);
      return changed({ ...state, currentProgramSceneName: data.sceneName });

    case "SetCurrentPreviewScene":
      requireScene(state, data.sceneName);
      return changed({ ...state, currentPreviewSceneName: data.sceneName });

    default:
      throw new RequestError(
        204,
        `The request type \`${requestType}\` is invalid or is not supported.`
      );
  }
};

const initialState = (options: Options): State => {
  let nextUuid = 1;
  let nextSceneItemId = 1;
  const inputs: InputSnapshot[] = (options.inputs ?? []).map((seed) => ({
    name: seed.name,
    uuid: `mock-input-${nextUuid++}`,
    kind: seed.kind,
    settings: copyIn(seed.settings ?? {}),
    privateSettings: copyIn(seed.privateSettings ?? {}),
    filters: (seed.filters ?? []).map(filterFromSeed),
    muted: seed.muted ?? false,
    volumeMul: seed.volumeMul ?? 1,
    audioSyncOffset: seed.audioSyncOffset ?? 0,
    audioMonitorType: seed.audioMonitorType ?? "OBS_MONITORING_TYPE_NONE",
    propertyLists: copyIn(seed.propertyLists ?? {}),
  }));
  const inputByName = (name: string) =>
    inputs.find((value) => value.name === name);
  const scenes: SceneSnapshot[] = (options.scenes ?? []).map((seed) => ({
    name: seed.name,
    uuid: `mock-scene-${nextUuid++}`,
    privateSettings: copyIn(seed.privateSettings ?? {}),
    filters: (seed.filters ?? []).map(filterFromSeed),
    items: (seed.items ?? []).map((item, index) => {
      const id = item.id ?? nextSceneItemId++;
      nextSceneItemId = Math.max(nextSceneItemId, id + 1);
      return {
        sourceName: item.sourceName,
        id,
        enabled: item.enabled ?? true,
        locked: item.locked ?? false,
        transform: {
          ...defaultTransform(inputByName(item.sourceName)),
          ...copyIn(item.transform ?? {}),
        },
        privateSettings: copyIn(item.privateSettings ?? {}),
        index,
      };
    }),
  }));
  return {
    inputs,
    scenes,
    currentProgramSceneName:
      options.currentProgramSceneName ?? scenes[0]?.name ?? null,
    currentPreviewSceneName: options.currentPreviewSceneName ?? null,
    nextUuid,
    nextSceneItemId,
  };
};

/**
 * Creates a stateful OBSSocket implementation without opening a WebSocket.
 * Requests reduce one immutable state value into the next state value.
 */
export const make = (options: Options = {}) => {
  let state = deepFreeze(initialState(options));
  let calls: ReadonlyArray<RecordedCall> = [];
  let service!: OBSSocket;

  const ws = {
    call: (requestType: string, requestData?: Record<string, any>) =>
      Effect.runPromise(service.call(requestType as any, requestData as any)),
  } as unknown as OBSWebSocket;

  service = {
    call: (requestType, requestData) => {
      const data = copyIn((requestData ?? {}) as Record<string, any>);
      calls = Object.freeze([
        ...calls,
        {
          requestType,
          ...(requestData === undefined ? {} : { requestData: data }),
        },
      ]);
      return Effect.try({
        try: () => {
          const reduction = reduceRequest(state, requestType, data);
          state = deepFreeze(reduction.state);
          return reduction.response as any;
        },
        catch: (cause) => {
          const error = cause as RequestError;
          return new OBSError({
            message: `OBS request "${requestType}" failed: Error: ${error.message}`,
            cause: { code: error.code, message: error.message },
          });
        },
      }) as any;
    },
    ws,
  };

  return {
    service,
    layer: Layer.succeed(OBSSocket, service),
    get calls() {
      return calls;
    },
    snapshot: (): Snapshot => state,
  };
};

export const layer = (options: Options = {}): Layer.Layer<OBSSocket> =>
  make(options).layer;
