---
sidebar_position: 3
---

# Basic Walkthrough

This page contains a walkthrough of how to create two scenes, one nested inside another, to demonstrate some of Simple OBS's functionality.

## Step 0: Create a new Scene Collection

While you could use your existing scene collection in OBS, it is **highly** recommended to create a new one. Simple OBS won't alter what you don't tell it to interact with, but for safety's sake it is best to create a new scene collection.

## Step 1: Setup

Firstly, import the necessary classes from Simple OBS.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="package-managers">
<TabItem value="commonjs" label="NodeJS">

```js
const { OBS, Scene, Alignment } = require("@simple-obs/core");
const { ColorSource } = require("@simple-obs/sources");
```

</TabItem>
<TabItem value="es6" label="Browser/TypeScript">

```ts
import { OBS, Scene, Alignment } from "@simple-obs/core";
import { ColorSource } from "@simple-obs/sources";
```

</TabItem>
</Tabs>

Next, create an `async` function that the code can run inside, and execute it.
While not strictly necessary, this allows us to use the `await` keyword, which makes for a nicer development experience.
If you are unfamiliar with JavaScript's `async/await` syntax, it's recommended that you do some research and understand it.
Using it wrong can lead to problems with things being out of sync and not happening in the order you want them to.

```ts
async function main() {
  // Code will go in here
}

main();
```

Lastly, create an instance of [OBS](/api/core/class/OBS) in code and connect it to OBS.
You may need to change the port number from `4444` if your OBS Websocket server runs on a different port.

```ts
// Creates an OBS object that will connect to OBS
const obs = new OBS();

// Connects the OBS object to OBS
await obs.connect("localhost:4444");
```

## Step 2: Declare Nested Scene

Next, we create an instance of [Scene](/api/core/class/Scene) that represents the nested scene in OBS.
It contains one item with default properties, and its source is a [ColourSource](/api/sources/class/ColorSource) created with default settings.

```ts
const nestedScene = new Scene({
  name: "Nested",
  items: {
    color: {
      source: new ColorSource({
        name: "Nested Color Source",
        settings: {},
      }),
    },
  },
});
```

## Step 3: Declare Parent Scene

Like before, create a `new Scene` that represents the main scene. Give it one item, and make the item's source the nested scene you created earlier.
Assign this item some properties, such as 2x scale and center alignment.

```ts
const mainScene = new Scene({
  name: "Main",
  items: {
    nested: {
      source: nestedScene,
      scaleX: 2,
      scaleY: 2,
      alignment: Alignment.Center,
    },
  },
});
```

## Step 4: Create the Scenes in OBS

Finally, tell the main scene to create itself and all of its children (in this case, the nested scene) in the instance of [OBS](/api/core/class/OBS) you created in Step 1:

```ts
await mainScene.create(obs);
```

## Step 5: Make the Main Scene the Current Scene

Just for fun, make the main scene the current scene in OBS so that you can view it right after it's created.

```ts
await mainScene.makeCurrentScene();
```

## Step 6: Run the Script

Making sure you have OBS running, run the script you just wrote. You should see two scenes be created, with "Main Scene" containing "Nested Scene" as a scene item at 2x scale.

## Going Forward

There are so many features that weren't touched on in this walkthrough, and you are likely confused about some things.

<!-- - The [Guides](/docs/guides/scenes) explain most parts of Simple OBS and how to use them -->
- The [API Referene](/api) contains detailed information on the types and uses of every aspect of Simple OBS.
