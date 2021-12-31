---
sidebar_position: 2
slug: /creating-scenes
---

# Creating Scenes

To create an empty scene, first declare it with and give it a name:

```ts
const someScene = new Scene({
  name: "Scene Name",
});
```

Then, call [create()](/api/core/class/Scene#create) and provide an instance of [OBS](/api/core/class/OBS) the scene should be created in:

```ts
await someScene.create(obs);
```

## With Items

Scenes accept an `items` property, which is a map that describes how each of the scene's items should be created.

The keys of this map are what Simple OBS calls `refs`, and are used to uniquely identify each item of a scene.

The values of this map are [scene item schemas](/api/core#SceneItemSchema), which specify the properties that the items should be created with,
as well as the source they are instances of.
The source does not have to exist in OBS, nor does it even have to be initialized. This will all be done by the scene when it is created.

```ts
new Scene({
  items: {
    // someItem will be the ref of this item
    someItem: {
      source: someSource, // The item's source must be provided.
      // Specify transform fields, enabled etc...
      scaleX: 1,
      enabled: true,
    },
  },
  name: "Scene Name",
});
```
