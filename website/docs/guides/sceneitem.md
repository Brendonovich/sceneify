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

## Properties

SceneItems have three main properties that can be updated by their associated functions:

- [transform](/api/core/class/SceneItem#transform) & [setTransform](/api/core/class/SceneItem#setTransform)
- [enabled](/api/core/class/SceneItem#enabled) & [setEnabled](/api/core/class/SceneItem#setEnabled)
- [locked](/api/core/class/SceneItem#locked) & [setLocked](/api/core/class/SceneItem#setLocked)

They also have some additional properties:

- [scene](/api/core/class/SceneItem#scene) - The scene that the item exists in
- [source](/api/core/class/SceneItem#source) - The source that the item is an instance of
- [id](/api/core/class/SceneItem#id) - The id of the item in OBS
- [ref](/api/core/class/SceneItem#ref) - The ref of the item used by Simple OBS

## Removing

SceneItems can be removed from their containing scene with [remove()](/api/core/class/SceneItem#remove)

```ts
await someItem.remove();
```
