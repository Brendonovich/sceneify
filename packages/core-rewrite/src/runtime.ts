import { OBSWebSocketError } from "obs-websocket-js";
import * as definition from "./definition.ts";
import { OBS } from "./obs.ts";
import { OBSSceneItemTransform } from "./obs-types.ts";
import {
  SceneItemTransform,
  SceneItemTransformInput,
  sceneItemTransformToOBS,
} from "./sceneItem.ts";

type SceneItems = Record<string, definition.Input<any, any>>;

export class Scene<TItems extends SceneItems> {
  obs: OBS;
  name: string;
  private items: { [K in keyof TItems]: SceneItem<Input<TItems[K]>> };

  constructor(args: {
    name: string;
    items: { [K in keyof TItems]: SceneItem<Input<TItems[K]>> };
    obs: OBS;
  }) {
    this.name = args.name;
    this.items = args.items;
    this.obs = args.obs;
  }

  item<K extends keyof TItems>(key: K): SceneItem<Input<TItems[K]>> {
    return this.items[key];
  }

  async getItems() {
    return await this.obs.ws
      .call("GetSceneItemList", { sceneName: this.name })
      .then(
        (res) =>
          res.sceneItems as Array<{
            sceneItemId: number;
            sceneItemIndex: number;
            sourceName: string;
            inputKind: string;
          }>
      );
  }

  /* @internal */
  async syncItem<
    TInput extends definition.Input<definition.InputType<string, any>, any>
  >(def: definition.DefineSceneItemArgs<TInput>) {
    const { input } = def;

    const items = await this.getItems();
    const existingItemWithName = items.find(
      (i) => i.sourceName === def.input.args.name
    );

    let item: SceneItem<Input<TInput>>;
    if (
      existingItemWithName &&
      existingItemWithName.inputKind === input.type.kind
    ) {
      item = new SceneItem(
        new Input(input, this.obs),
        this,
        existingItemWithName.sceneItemId
      );

      await item.updateFromDefinition(def);
    } else if (!existingItemWithName) item = await this.createItem(def);
    else
      throw new Error(
        `Input '${input.args.name}' already exists with kind '${existingItemWithName.inputKind}' instead of expected kind '${def.input.type.kind}'`
      );

    if (input.args.settings)
      await input.setSettings(this.obs, input.args.settings);

    await item.setTransform(def);

    return item;
  }

  async createItem<TInput extends definition.Input<any, any>>(
    def: definition.DefineSceneItemArgs<TInput>
  ) {
    const id = await this.obs.ws
      .call("CreateSceneItem", {
        sceneName: this.name,
        sourceName: def.input.args.name,
      })
      .catch(() =>
        this.obs.ws.call("CreateInput", {
          sceneName: this.name,
          inputName: def.input.args.name,
          inputKind: def.input.type.kind,
          inputSettings: def.input.args.settings,
        })
      )
      .then((r) => r.sceneItemId);

    const item = new SceneItem(new Input(def.input, this.obs), this, id);

    await item.updateFromDefinition(def);

    return item;
  }
}

class Input<TDefinition extends definition.Input<any, any>> {
  constructor(public def: TDefinition, public obs: OBS) {}

  filter<TKey extends keyof definition.InputFilters<TDefinition>>(key: TKey) {
    return null;
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
    if (def.index !== undefined)
      await this.obs.ws.call("SetSceneItemIndex", {
        sceneName: this.scene.name,
        sceneItemId: this.id,
        sceneItemIndex: def.index,
      });

    if (def.enabled !== undefined)
      await this.obs.ws.call("SetSceneItemEnabled", {
        sceneItemId: this.id,
        sceneName: this.scene.name,
        sceneItemEnabled: def.enabled,
      });
  }

  async getTransform() {
    const res = await this.obs.ws.call("GetSceneItemTransform", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
    });

    return res.sceneItemTransform as any as OBSSceneItemTransform;
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
    .catch((e) => {
      const SCENE_ALREADY_EXISTS = 601;
      if (e instanceof OBSWebSocketError && e.code === SCENE_ALREADY_EXISTS) {
        obs.log(
          "info",
          `Reusing existing scene '${sceneDef.args.name}' as it already exists`
        );

        return;
      }

      throw e;
    });

  const items: Record<string, any> = {} as any;

  const scene = new Scene<definition.SceneItemsOfScene<T>>({
    name: sceneDef.args.name,
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
