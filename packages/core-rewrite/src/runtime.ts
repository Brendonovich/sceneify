import { OBSWebSocketError } from "obs-websocket-js";

import * as definition from "./definition.ts";
import { OBS } from "./obs.ts";
import {
  OBSMonitoringType,
  OBSSceneItemTransform,
  OBSVolumeInput,
} from "./obs-types.ts";
import {
  SceneItemTransformInput,
  sceneItemTransformToOBS,
} from "./sceneItem.ts";

type SIOfSceneAsSI<TDef extends definition.Scene> = {
  [K in keyof definition.SIOfScene<TDef>]: SceneItem<
    Input<definition.SIOfScene<TDef>[K]>
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
  ): SceneItem<Input<definition.SIOfScene<TDef>[K]>> {
    return this.items[key];
  }

  async getItems() {
    return await this.def.getItems(this.obs);
  }

  /* @internal */
  async syncItem<
    TInput extends definition.Input<definition.InputType<string, any>, any>
  >(def: definition.DefineSceneItemArgs<TInput>) {
    const { input } = def;

    let res:
      | undefined
      | { error: "same-name-different-kind"; kind: string }
      | { error: "not-owned"; id: number }
      | { success: SceneItem<Input<TInput>> } = undefined;

    for (const item of await this.getItems()) {
      if (item.sourceName !== def.input.args.name) continue;
      if (item.inputKind !== def.input.type.kind) {
        if (!res)
          res = { error: "same-name-different-kind", kind: item.inputKind };
        continue;
      }

      const { sceneItemSettings } = await this.obs.ws.call(
        "GetSceneItemPrivateSettings",
        { sceneName: this.def.name, sceneItemId: item.sceneItemId }
      );

      if (sceneItemSettings.SCENEIFY?.init !== "created") {
        res = { error: "not-owned", id: item.sceneItemId };
        continue;
      }

      res = {
        success: new SceneItem(
          new Input(input, this.obs),
          this,
          item.sceneItemId
        ),
      };
    }

    let sceneItem: SceneItem<Input<TInput>>;
    if (!res) sceneItem = await this.createItem(def);
    else if ("success" in res) {
      const item = res.success;
      await item.updateFromDefinition(def);
      sceneItem = item;
    } else {
      if (res.error === "same-name-different-kind")
        throw new Error(
          `Input '${input.args.name}' already exists with kind '${res.kind}' instead of expected kind '${def.input.type.kind}'`
        );
      else
        throw new Error(
          `Scene items of input '${input.args.name}' cannot be synced as none are owned by Sceneify`
        );
    }

    if (input.args.settings)
      await input.setSettings(this.obs, input.args.settings);

    await sceneItem.setTransform(def);

    return sceneItem;
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

    const item = new SceneItem(new Input(def.input, this.obs), this, id);

    await item.updateFromDefinition(def);

    return item;
  }
}

class Filter<TDef extends definition.Filter<any>> {
  constructor(public def: TDef, public obs: OBS, public input: Input<any>) {}

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

class Input<TDef extends definition.Input<any, any>> {
  constructor(public def: TDef, public obs: OBS) {}

  get name() {
    return this.def.name;
  }

  filter<TKey extends keyof definition.InputFilters<TDef>>(
    key: TKey
  ): Filter<definition.InputFilters<TDef>[TKey]> {
    return null;
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
}

class SceneItem<TInput extends Input<definition.Input<any, any>>> {
  obs: OBS;
  declared: boolean;

  constructor(
    public input: TInput,
    public scene: Scene<any>,
    public id: number
  ) {
    this.obs = input.obs;
    this.declared = !!currentSceneDef;
  }

  /* @internal */
  async updateFromDefinition(def: definition.DefineSceneItemArgs<any>) {
    if (def.index !== undefined) this.setIndex(def.index);

    if (def.enabled !== undefined) this.setEnabled(def.enabled);
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
    const item = await scene.syncItem(args);

    items[key] = item;
  }

  currentSceneDef = prevCurrentSceneDef;

  return scene;
}
