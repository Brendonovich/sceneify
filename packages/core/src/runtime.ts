import { OBSWebSocketError } from "obs-websocket-js";

import * as definition from "./definition.js";
import { OBS } from "./obs.js";
import {
  OBSMonitoringType,
  OBSSceneItemTransform,
  OBSVolumeInput,
} from "./obs-types.js";
import {
  SceneItemTransformInput,
  sceneItemTransformToOBS,
} from "./sceneItem.js";

type SIOfSceneAsSI<TDef extends definition.Scene> = {
  [K in keyof definition.SIOfScene<TDef>]: SceneItem<
    definition.SIOfScene<TDef>[K]
  >;
};
export class Scene<TDef extends definition.Scene = definition.Scene> {
  obs: OBS;
  def: TDef;
  private items: SIOfSceneAsSI<TDef>;

  constructor(args: { def: TDef; items: SIOfSceneAsSI<TDef>; obs: OBS }) {
    this.def = args.def;
    this.items = args.items;
    this.obs = args.obs;
  }

  get name() {
    return this.def.name;
  }

  item<K extends keyof definition.SIOfScene<TDef>>(
    key: K
  ): SceneItem<definition.SIOfScene<TDef>[K]> {
    return this.items[key];
  }

  async getItems() {
    return await this.def.getItems(this.obs);
  }

  async createItem<TInput extends definition.Input<any, any>>(
    def: definition.DefineSceneItemArgs<TInput>
  ) {
    const id = await this.obs.ws
      .call("CreateSceneItem", {
        sceneName: this.def.name,
        sourceName: def.input.args.name,
      })
      .catch(() =>
        this.obs.ws.call("CreateInput", {
          sceneName: this.def.name,
          inputName: def.input.args.name,
          inputKind: def.input.type.kind,
          inputSettings: def.input.args.settings,
        })
      )
      .then(async ({ sceneItemId }) => {
        await this.obs.ws.call("SetSceneItemPrivateSettings", {
          sceneName: this.def.name,
          sceneItemId,
          sceneItemSettings: { SCENEIFY: { init: "created" } },
        });

        return sceneItemId;
      });

    const [input] = await syncInput(this.obs, def.input);
    const item = new SceneItem(input, this, id);

    await item.updateFromDefinition(def);

    return item;
  }
}

async function syncSceneItem<
  TScene extends Scene,
  TInput extends definition.Input<definition.InputType<string, any>, any>
>(scene: TScene, def: definition.DefineSceneItemArgs<TInput>) {
  const { input } = def;
  let res:
    | undefined
    | { error: "same-name-different-kind"; kind: string }
    | { error: "not-owned"; id: number }
    | { success: SceneItem<TInput> } = undefined;

  for (const item of await scene.getItems()) {
    if (item.sourceName !== def.input.args.name) continue;
    if (item.inputKind !== def.input.type.id) {
      if (!res)
        res = { error: "same-name-different-kind", kind: item.inputKind };
      continue;
    }

    const { sceneItemSettings } = await scene.obs.ws.call(
      "GetSceneItemPrivateSettings",
      { sceneName: scene.def.name, sceneItemId: item.sceneItemId }
    );

    if (sceneItemSettings.SCENEIFY?.init !== "created") {
      res = { error: "not-owned", id: item.sceneItemId };
      continue;
    }

    const [input] = await syncInput(scene.obs, def.input);

    res = { success: new SceneItem(input, scene, item.sceneItemId) };
  }

  let sceneItem: SceneItem<TInput>;
  if (!res) sceneItem = await scene.createItem(def);
  else if ("success" in res) {
    const item = res.success;
    sceneItem = item;
    await sceneItem.updateFromDefinition(def);
  } else {
    if (res.error === "same-name-different-kind")
      throw new Error(
        `Input '${input.args.name}' already exists with kind '${res.kind}' instead of expected kind '${def.input.type.id}'`
      );
    else
      throw new Error(
        `Scene items of input '${input.args.name}' cannot be synced as none are owned by Sceneify`
      );
  }

  return sceneItem;
}

async function syncInput<TInput extends definition.Input<any, any>>(
  obs: OBS,
  def: TInput
): Promise<[Input<TInput>]>;
async function syncInput<TInput extends definition.Input<any, any>>(
  obs: OBS,
  def: TInput,
  forceCreate: {
    scene: Scene<any>;
    sceneItemArgs: definition.DefineSceneItemArgs<TInput>;
  }
): Promise<[Input<TInput>, SceneItem<TInput>]>;
async function syncInput<
  TInput extends definition.Input<
    any,
    Record<string, definition.FilterType<any, any>>
  >
>(
  obs: OBS,
  def: TInput,
  forceCreate?: {
    scene: Scene<any>;
    sceneItemArgs: definition.DefineSceneItemArgs<TInput>;
  }
): Promise<[Input<TInput>, ...([SceneItem<TInput>] | [])]> {
  let input: Input<TInput>;
  let sceneItem: SceneItem<TInput> | undefined;

  const prev = obs.syncedInputs.get(def.name);
  if (prev) return [prev] as any;

  const inputFilters: any = {};

  if (forceCreate)
    sceneItem = await forceCreate.scene.createItem(forceCreate.sceneItemArgs);

  input = new Input({ def, obs, filters: inputFilters });

  await Promise.all([
    (async () => {
      if (def.args.settings) await input.setSettings(def.args.settings as any);
    })(),
    (async () => {
      if (def.args.filters) {
        const filters = await input.getFilters();

        const {
          sourceSettings: { SCENEIFY },
        } = await obs.ws.call("GetSourcePrivateSettings", {
          sourceName: input.def.name,
        });

        const entries = Object.entries(def.args.filters);
        entries.sort(([_, f1], [__, f2]) => {
          if (f1.args.index === undefined) return -1;
          if (f2.args.index === undefined) return 1;
          return f1.args.index - f2.args.index;
        });

        for (const [key, filterDef] of entries) {
          let filter: Filter<any, TInput> | undefined;

          for (const existingFilter of filters) {
            if (existingFilter.name !== filterDef.args.name) continue;
            if (existingFilter.kind !== filterDef.kind.id)
              throw new Error(
                `Filter '${existingFilter.name}' on source ${input.name} already exists with kind '${existingFilter.kind}' instead of expected kind '${filterDef.kind.id}'`
              );

            if (!SCENEIFY?.filters?.some((f) => f.name === filterDef.name))
              throw new Error(
                `Filter '${filterDef.name}' of input '${input.name}' cannot be synced as it is not owned by Sceneify`
              );

            filter = new Filter(filterDef, obs, input);
          }

          if (!filter) {
            await obs.ws.call("CreateSourceFilter", {
              sourceName: input.name,
              filterName: filterDef.name,
              filterKind: filterDef.kind.id,
            });

            filter = new Filter(filterDef, obs, input);
          }

          await Promise.all([
            (async () => {
              if (filterDef.args.index !== undefined)
                await filter.setIndex(filterDef.args.index);
            })(),
            (async () => {
              if (filterDef.args.enabled !== undefined)
                await filter.setEnabled(filterDef.args.enabled);
            })(),
            (async () => {
              if (filterDef.args.settings)
                filter.setSettings(filterDef.args.settings);
            })(),
          ]);

          inputFilters[key] = filter;
        }
      }
    })(),
  ]);

  await obs.ws.call("SetSourcePrivateSettings", {
    sourceName: def.args.name,
    sourceSettings: {
      SCENEIFY: {
        init: "created",
        ...(def.args.filters
          ? {
              filters: Object.entries(def.args.filters).map(([_, f]) => ({
                name: f.args.name,
              })),
            }
          : undefined),
      },
    },
  });

  obs.syncedInputs.set(def.name, input);

  if (sceneItem) return [input, sceneItem];
  return [input];
}

export class Filter<
  TDef extends definition.Filter<any>,
  TInput extends definition.Input<any, any>
> {
  constructor(public def: TDef, public obs: OBS, public input: Input<TInput>) {}

  get name() {
    return this.def.name;
  }

  async setSettings(
    filterSettings: Partial<definition.FilterSettings<TDef>>,
    overlay = true
  ) {
    return await this.def.setSettings(
      this.obs,
      this.input,
      filterSettings,
      overlay
    );
  }

  async setIndex(index: number) {
    return await this.def.setIndex(this.obs, this.input, index);
  }

  async setEnabled(enabled: boolean) {
    return await this.def.setEnabled(this.obs, this.input, enabled);
  }
}

export type FilterDefsOfInputDef<TDef extends definition.Input<any, any>> =
  TDef extends definition.Input<any, infer TFilters> ? TFilters : never;
type InputFiltersFromDef<
  TDef extends definition.Input<any, any>,
  TInput extends TDef
> = {
  [K in keyof FilterDefsOfInputDef<TDef>]: Filter<
    FilterDefsOfInputDef<TDef>[K],
    TInput
  >;
};

export class Input<TDef extends definition.Input<any, any>> {
  obs: OBS;
  def: TDef;
  private filters: InputFiltersFromDef<TDef, TDef> = {} as any;

  constructor(args: {
    def: TDef;
    obs: OBS;
    filters: InputFiltersFromDef<TDef, TDef>;
  }) {
    this.def = args.def;
    this.filters = args.filters;
    this.obs = args.obs;
  }

  get name() {
    return this.def.name;
  }

  filter<TKey extends keyof definition.InputFilters<TDef>>(
    key: TKey
  ): Filter<definition.InputFilters<TDef>[TKey], TDef> {
    return this.filters[key];
  }

  async setSettings(
    settings: Partial<definition.InputSettings<TDef>>,
    overlay?: boolean
  ) {
    return await this.def.setSettings(this.obs, settings, overlay);
  }

  async getMuted() {
    return await this.def.getMuted(this.obs);
  }

  async setMuted(muted: boolean) {
    return await this.def.setMuted(this.obs, muted);
  }

  async toggleMuted() {
    return await this.def.toggleMuted(this.obs);
  }

  async getVolume() {
    return await this.def.getVolume(this.obs);
  }

  async setVolume(volume: OBSVolumeInput) {
    return await this.def.setVolume(this.obs, volume);
  }

  async getAudioSyncOffset() {
    return await this.def.getAudioSyncOffset(this.obs);
  }

  async setAudioSyncOffset(offset: number) {
    return await this.def.setAudioSyncOffset(this.obs, offset);
  }

  async setAudioMonitorType(type: OBSMonitoringType) {
    return await this.def.setAudioMonitorType(this.obs, type);
  }

  async getSettingListItems<
    K extends keyof definition.InputSettings<TDef> & string
  >(setting: K) {
    return await this.def.getSettingListItems(this.obs, setting);
  }

  async getFilters() {
    return await this.def.getFilters(this.obs);
  }
}

export class SceneItem<TInput extends definition.Input<any, any>> {
  obs: OBS;
  declared: boolean;

  constructor(
    public input: Input<TInput>,
    public scene: Scene<any>,
    public id: number
  ) {
    this.obs = input.obs;
    this.declared = !!currentSceneDef;
  }

  /* @internal */
  async updateFromDefinition(def: definition.DefineSceneItemArgs<any>) {
    await Promise.all([
      this.setTransform(def),
      (async () => {
        if (def.index !== undefined) await this.setIndex(def.index);
      })(),
      (async () => {
        if (def.enabled !== undefined) await this.setEnabled(def.enabled);
      })(),
    ]);
  }

  async getTransform() {
    return await this.obs.ws
      .call("GetSceneItemTransform", {
        sceneName: this.scene.name,
        sceneItemId: this.id,
      })
      .then((r) => r.sceneItemTransform as any as OBSSceneItemTransform);
  }

  async setTransform(transform: SceneItemTransformInput) {
    const CANNOT_ACT = 703;
    await this.obs.ws
      .call("SetSceneItemTransform", {
        sceneItemTransform: sceneItemTransformToOBS(transform),
        sceneName: this.scene.name,
        sceneItemId: this.id,
      })
      .catch((e) => {
        if (e instanceof OBSWebSocketError && e.code === CANNOT_ACT) return;
        throw e;
      });
  }

  async setEnabled(enabled: boolean) {
    await this.obs.ws.call("SetSceneItemEnabled", {
      sceneItemEnabled: enabled,
      sceneName: this.scene.name,
      sceneItemId: this.id,
    });
  }

  async setLocked(locked: boolean) {
    await this.obs.ws.call("SetSceneItemLocked", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      sceneItemLocked: locked,
    });
  }

  async setIndex(index: number) {
    await this.obs.ws.call("SetSceneItemIndex", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
      sceneItemIndex: index,
    });
  }

  async remove() {
    if (this.declared)
      throw new Error(
        `Cannot remove static scene item of input '${this.input.def.args.name}' from scene '${this.scene.name}'`
      );

    await this.obs.ws.call("RemoveSceneItem", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
    });
  }
}

let currentSceneDef: definition.Scene | undefined;

export async function syncScene<T extends definition.Scene>(
  obs: OBS,
  sceneDef: T
) {
  let prevCurrentSceneDef = currentSceneDef;
  currentSceneDef = sceneDef;

  await obs.ws
    .call("CreateScene", { sceneName: sceneDef.args.name })
    .then(() =>
      obs.ws.call("SetSourcePrivateSettings", {
        sourceName: sceneDef.args.name,
        sourceSettings: { SCENEIFY: { init: "created" } },
      })
    )
    .catch(async (e) => {
      const SCENE_ALREADY_EXISTS = 601;
      if (e instanceof OBSWebSocketError && e.code === SCENE_ALREADY_EXISTS) {
        const { sourceSettings } = await obs.ws.call(
          "GetSourcePrivateSettings",
          { sourceName: sceneDef.args.name }
        );

        if (sourceSettings.SCENEIFY?.init === "created") {
          obs.log(
            "info",
            `Reusing existing scene '${sceneDef.args.name}' as it already exists`
          );

          return;
        }
      }

      throw e;
    });

  const items: Record<string, any> = {} as any;

  const scene = new Scene<T>({
    def: sceneDef,
    items: items as any,
    obs,
  });

  for (const [key, args] of Object.entries(sceneDef.args.items ?? {})) {
    const item = await syncSceneItem(scene, args);

    items[key] = item;
  }

  currentSceneDef = prevCurrentSceneDef;

  return scene;
}
