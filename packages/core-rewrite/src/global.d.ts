import "obs-websocket-js";

declare module "obs-websocket-js" {
  type SceneifyPrivateSettings = {
    init: "created" | "linked";
  };

  interface OBSRequestTypes {
    // undocumented requests that the devs left in for us :)
    SetSourcePrivateSettings: {
      sourceName: string;
      sourceSettings: {
        SCENEIFY?: SceneifyPrivateSettings & {
          filters?: Array<{ name: string }>;
        };
      };
    };
    GetSourcePrivateSettings: {
      sourceName: string;
    };
    SetSceneItemPrivateSettings: {
      sceneName: string;
      sceneItemId: number;
      sceneItemSettings: {
        SCENEIFY?: SceneifyPrivateSettings;
      };
    };
    GetSceneItemPrivateSettings: {
      sceneName: string;
      sceneItemId: number;
    };
  }

  interface OBSResponseTypes {
    SetSourcePrivateSettings: void;
    GetSourcePrivateSettings: {
      sourceSettings: {
        SCENEIFY?: SceneifyPrivateSettings & {
          filters?: Array<{ name: string }>;
        };
      };
    };
    SetSceneItemPrivateSettings: {};
    GetSceneItemPrivateSettings: {
      sceneItemSettings: {
        SCENEIFY?: SceneifyPrivateSettings;
      };
    };
  }
}
