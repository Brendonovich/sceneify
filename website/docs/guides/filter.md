---
sidebar_position: 4
slug: /filter
---

# Filter

[Filters](/api/core/class/Filter) can be declared in a similar way to sources, by calling `new Filter` with the appropriate arguments.

```ts
const colorCorrectionFilter = new Filter({
  kind: "color_filter_v2", // The kind of the filter
  name: "Filter", // Name of the filter in OBS
  // Must be unique within the filters of
  // the source it will be created for
});
```

The [filters package](/api/filters) contains helper classes that have type definitions and filter kinds built into them.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-managers">
<TabItem value="commonjs" label="NodeJS">

```js
const { ColorCorrectionFilter } = require("@simple-obs/filters");

const colorCorrectionFilter = new ColorCorrectionFilter({
  name: "Filter",
  // kind is no longer necessary, since it is
  // provided by ColorCorrectionFilter
});
```

</TabItem>
<TabItem value="es6" label="Browser/TypeScript">

```ts
import { ColorCorrectionFilter } from "@simple-obs/filters";

const colorCorrectionFilter = new ColorCorrectionFilter({
  name: "Filter",
  // Kind is no longer necessary, since it is provided by ColorCorrectionFilter
});
```

</TabItem>
</Tabs>

## Create Source with Filter

[Sources](/api/core/class/Source) (and [Scenes](/api/core/class/Source), since they are also sources) take a map of filters as an argument when being created to specify default filters that the source should be created with.

```ts
const imageSource = new ImageSource({
  name: "Some Source",
  filters: {
    colorCorrection: new ColorCorrectionFilter({
      name: "Filter",
    }),
  },
});

const scene = new Scene({
  name: "Some Scene",
  items: {
    image: {
      source: imageSource,
    },
  },
  filters: {
    colorCorrection: new ColorCorrectionFilter({
      name: "Filter",
    }),
  },
});
```

The keys of this map are for acceessing the filters through the source's [filter()](/api/core/class/Source#filter) method, and though it does not have the same function as a `ref`, it must uniquely identify the filter within the source it is assigned to.

```ts
const filter = source.filter("colorCorrection");
```

## Add a Filter to a Source

A filter can be added to a source dynamically by calling [addFilter](/api/core/class/Source#addFilter) on the source.

```ts
const filter = await source.addFilter(
  "colorCorrection",
  new ColorCorrectionFilter({
    name: "Filter",
  })
);
```

## Properties

- [name](/api/core/class/Filter#name): The name the filter was created with
- [kind](/api/core/class/Filter#kind): The kind of the filter
- [source](/api/core/class/Filter#source): The source the filter is assigned to

These properties can be set with their associated functions:

- [settings](/api/core/class/Source#settings) - [setSettings](/api/core/class/Filter#setSettings)
- [enabled](/api/core/class/Filter#enabled) - [setEnabled](/api/core/class/Filter#setEnabled)