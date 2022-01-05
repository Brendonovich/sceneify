---
sidebar_position: 3
slug: /sceneitem
---

# SceneItem

After creating a scene, you can access specific items using [item()](/api/core/class/Scene#item).
Simply provide an item's `ref` and it will return the [item](/api/core/class/SceneItem) or `undefined` if there is no item with the provided `ref`.

```ts
const someItem = someScene.item("someItem");
```

## Creating Items Dynamically

Scene items don't have to be created at the same time as a scene.
You may use [createItem()](/api/core/class/Scene#createItem) to create an item from a [schema](/api/core#SceneItemSchema) at any time after a scene has been created.

```ts
await scene.createItem("anotherRef", {
  source: anotherSource,
  positionX: 0,
  enabled: false,
});
```

This function is used internally by [create()](/api/core/class/Scene#create), so you can be certain that creation of the item will perform the same way as if it was created at the same time as the scene.

## Removing

Scene items can be removed from their containing scene with [remove()](/api/core/class/SceneItem#remove)

```ts
await someItem.remove();
```

## Properties

- [scene](/api/core/class/SceneItem#scene) - The scene that the item exists in
- [source](/api/core/class/SceneItem#source) - The source that the item is an instance of
- [id](/api/core/class/SceneItem#id) - The id of the item in OBS
- [ref](/api/core/class/SceneItem#ref) - The ref of the item used by Sceneify

These properties can be set with their associated functions:

- [transform](/api/core/class/SceneItem#transform) - [setTransform](/api/core/class/SceneItem#setTransform)
- [enabled](/api/core/class/SceneItem#enabled) - [setEnabled](/api/core/class/SceneItem#setEnabled)
- [locked](/api/core/class/SceneItem#locked) - [setLocked](/api/core/class/SceneItem#setLocked)
