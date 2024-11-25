import * as definition from "./definition";
import { OBS } from "./obs";
import { OBSSceneItemTransform } from "./obs-types";
import { SceneItemTransform, sceneItemTransformToOBS } from "./sceneItem";

type SceneItems = Record<string, definition.Input<any, any>>;

class Scene<TItems extends SceneItems> {
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

  async syncItem<
    TInput extends definition.Input<definition.InputType<string, any>, any>
  >(args: definition.DefineSceneItemArgs<TInput>) {
    const { input } = args;

    const items = await this.getItems();
    const existingItem = items.find(
      (i) => i.sourceName === args.input.args.name
    );

    let item: SceneItem<Input<TInput>>;
    if (existingItem && existingItem.inputKind === input.type.kind) {
      item = new SceneItem(
        new Input(input, this.obs),
        this,
        existingItem.sceneItemId
      );
    } else if (!existingItem) {
      item = await this.createItem(args);
    } else {
      throw new Error(
        `Input '${input.args.name}' already exists with kind '${existingItem.inputKind}' instead of expected kind '${args.input.type.kind}'`
      );
    }

    if (input.args.settings)
      await input.setSettings(this.obs, input.args.settings);

    await item.setTransform(args);

    return item;
  }

  async createItem<TInput extends definition.Input<any, any>>(
    args: definition.DefineSceneItemArgs<TInput>
  ) {
    const id = await this.obs.ws
      .call("CreateSceneItem", {
        sceneName: this.name,
        sourceName: args.input.args.name,
      })
      .catch(() =>
        this.obs.ws.call("CreateInput", {
          sceneName: this.name,
          inputName: args.input.args.name,
          inputKind: args.input.type.kind,
          inputSettings: args.input.args.settings,
        })
      )
      .then((r) => r.sceneItemId);

    return new SceneItem(new Input(args.input, this.obs), this, id);
  }
}

class Input<TDefinition extends definition.Input<any, any>> {
  constructor(public definition: TDefinition, public obs: OBS) {}

  filter<TKey extends keyof definition.InputFilters<TDefinition>>(key: TKey) {
    return null;
  }
}

class SceneItem<TInput extends Input<any>> {
  obs: OBS;

  constructor(
    public input: TInput,
    public scene: Scene<any>,
    public id: number
  ) {
    this.obs = input.obs;
  }

  async getTransform() {
    const res = await this.obs.ws.call("GetSceneItemTransform", {
      sceneName: this.scene.name,
      sceneItemId: this.id,
    });

    return res.sceneItemTransform as any as OBSSceneItemTransform;
  }

  async setTransform(
    transform: Partial<
      Omit<
        SceneItemTransform,
        | "width"
        | "height"
        | "sourceWidth"
        | "sourceHeight"
        | "boundsWidth"
        | "boundsHeight"
      >
    >
  ) {
    await this.obs.ws.call("SetSceneItemTransform", {
      sceneItemTransform: sceneItemTransformToOBS(transform),
      sceneName: this.scene.name,
      sceneItemId: this.id,
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
}

export async function syncScene<T extends definition.Scene>(
  obs: OBS,
  sceneDef: T
) {
  try {
    await obs.ws.call("CreateScene", { sceneName: sceneDef.args.name });
  } catch {}

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

  return scene;
}
