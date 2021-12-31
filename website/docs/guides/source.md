---
sidebar_position: 1
slug: /source
---

# Source

[Sources](/api/core/class/Source) can be declared by calling `new Source` with the appropriate arguments.

```ts
const imageSource = new Source({
  kind: "image_source", // The kind of the source
  name: "Image Source", // Name of the scene in OBS
  // Must be unique among all sources and scenes
});
```

The [sources pacakge](/api/sources) contains helper classes that have type definitions and source kinds built into them.

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

## Sources Don't Create Themselves

Declaring a source with `new Source` does not create the source in OBS. In fact, sources never create themselves. Instead, it is the responsibility of scenes to detect if a source already exists, and create it if necessary.

Sources have two properties that you can use to check if they have been processed by a scene:

- [exists](/api/core/class/Source#exists): Whether the source exists in OBS
- [initialized](/api/core/class/Source#initialzed): Whether a scene has checked if the source exists in OBS

## Properties

In addition to the two properties above, sources have a number of other properties:

- [name](/api/core/class/Source#name): The name the source was created with
- [kind](/api/core/class/Source#kind): The kind of the source
- [filters](/api/core/class/Source#filters): An array of filters corresponding to the filters of the source in OBS

These properties can be set with their associated functions:

- [settings](/api/core/class/Source#settings) - [setSettings](/api/core/class/Source#setSettings)
- [volume](/api/core/class/Source#volume) - [setVolume](/api/core/class/Source#volume)
- [audioMonitorType](/api/core/class/Source#audioMonitorType) - [setAudioMonitorType](/api/core/class/Source#setAudioMonitorType)
- [audioSyncOffset](/api/core/class/Source#audioSyncOffset) - [setAudioSyncOffset](/api/core/class/Source#setAudioSyncOffset)
- [muted](/api/core/class/Source#muted) - [setMuted](/api/core/class/Source#setMuted)
