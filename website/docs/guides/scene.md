---
sidebar_position: 2
slug: /scene
---

# Scene

To create an empty scene, first declare it with and give it a name:

```ts
const someScene = new Scene({
  name: "Scene Name", // Name of the scene in OBS
  // Must be unique among all sources and scenes
});
```

Then, call [create()](/api/core/class/Scene#create) and provide an instance of [OBS](/api/core/class/OBS) the scene should be created in:

```ts
await someScene.create(obs);
```

## Items

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

After the scene is created, its [items](/api/core/class/Scene#items) array will be populated with all of its items, and each item can be accessed by ref using [item()](/api/core/class/Scene#item).

## Properties

As scenes are also sources, they share many similar properties as [Inputs](/api/core/class/Input):

- [name](/api/core/class/Scene#name): The name of the scene
- [kind](/api/core/class/Scene#kind): The kind of the scene (will always be `scene`)