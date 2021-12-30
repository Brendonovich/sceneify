---
sidebar_position: 1
---

# Overview

Simple OBS is a library for NodeJS and the browser for creating, and manipulating items in OBS. With a consistent API and easy extensibility, it makes interacting with OBS through OBS Websocket much simpler and more approachable.

## Motivation

OBS is a very powerful piece of software, being capable of compositing, mixing, encoding and streaming live and recorded video. OBS Websocket pushes this to the extreme, allowing for full control of almost every aspect of an OBS instance. That is, as long as you are capable and willing to write the code required to tell the websocket what to do. This can be simple if you're just trying to automate scene switching, mute an audio source or some other small task, but can become quite a daunting task with more complex software and layouts.

Simple OBS was created out of a desire to simplify the process of using OBS Websocket. It is primarily designed to make OBS scripting more focused on what OBS should do, and less about how it's done. In this sense, it could be considered a declarative abstraction over OBS Websocket.

Much of the development of Simple OBS was done in private by Brendonovich for Twitch streamer JDudeTV, who before using Simple OBS had a massive JavaScript file that meticulously controlled everything on his stream through OBS Websocket. It didn't take long for the script to become almost unmaintainable, and a new solution was needed.

Now, JDudeTV uses Simple OBS for creating his entire OBS layout, animating it and making every scene item part of a physics world. This project alone is proof that Simple OBS works and has the ability to drastically simplify the process of controlling OBS with code.

## That's great, but I want to see some code!

Here's a quick example of creating two scenes: One nested scene that contains a color source, and another scene which contains the nested scene at 2x scale.

```ts
import { OBS, Scene } from "@simple-obs/core";
import { ColorSource } from "@simple-obs/sources";

async function main() {
  // Creates an OBS object that will connect to OBS
  const obs = new OBS();

  // Connects the OBS object to OBS
  await obs.connect("localhost:4444");

  // Declares the scene that we will nest.
  // Calling 'new Scene' only creates the object in code,
  // and does not create it in OBS.
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

  // Declares the main scene that contains the nested scene declared above.
  // Again, this does *not* create the scene in OBS yet.
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

  // Finally, tells the main scene to create itself in OBS.
  // As the nested scene has not been created yet,
  // and is an item of the main scene,
  // it will automatically be created.
  await mainScene.create(obs);

  // Sets the current scene in OBS to the main scene
  await mainScene.makeCurrentScene();
}

main();
```
