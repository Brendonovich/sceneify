---
sidebar_position: 1
slug: /input
---

# Input

[Inputs](/api/core/class/Input) can be declared by calling `new Input` with the appropriate arguments.

```ts
const imageSource = new Input({
  kind: "image_source", // The kind of the input
  name: "Image Input", // Name of the input in OBS
  // Must be unique among all sources
});
```

The [sources pacakge](/api/sources) contains helper classes that have type definitions and input kinds built into them.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-managers">
<TabItem value="commonjs" label="NodeJS">

```js
const { ImageSource } = require("@simple-obs/sources");

const imageSource = new ImageSource({
  name: "Image Source",
  // kind is no longer necessary, since it is provided by ImageSource
});
```

</TabItem>
<TabItem value="es6" label="Browser/TypeScript">

```ts
import { ImageSource } from "@simple-obs/sources";

const imageSource = new ImageSource({
  name: "Image Source",
  // Kind is no longer necessary, since it is provided by ImageSource
});
```

</TabItem>
</Tabs>

## Inputs Don't Create Themselves

Declaring a source with `new Input` does not create the source in OBS. In fact, inputs never create themselves. Instead, it is the responsibility of scenes to detect if an input already exists, and create it if necessary.

Inputs have two properties that you can use to check if they have been processed by a scene:

- [exists](/api/core/class/Input#exists): Whether the input exists in OBS
- [initialized](/api/core/class/Input#initialzed): Whether a scene has checked if the input exists in OBS

## Properties

In addition to the two properties above, inputs have a number of other properties:

- [name](/api/core/class/Input#name): The name of the input
- [kind](/api/core/class/Input#kind): The kind of the input
- [filters](/api/core/class/Input#filters): An array of filters corresponding to the filters on the input in OBS

These properties can be set with their associated functions:

- [settings](/api/core/class/Input#settings) - [setSettings](/api/core/class/Input#setSettings)
- [volume](/api/core/class/Input#volume) - [setVolume](/api/core/class/Input#volume)
- [audioMonitorType](/api/core/class/Input#audioMonitorType) - [setAudioMonitorType](/api/core/class/Input#setAudioMonitorType)
- [audioSyncOffset](/api/core/class/Input#audioSyncOffset) - [setAudioSyncOffset](/api/core/class/Input#setAudioSyncOffset)
- [muted](/api/core/class/Input#muted) - [setMuted](/api/core/class/Input#setMuted)
