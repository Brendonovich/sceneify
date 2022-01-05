---
sidebar_position: 1
---

# Overview

Sceneify is a collection of libraries for NodeJS and the browser for creating, and manipulating items in OBS. With a consistent API and easy extensibility, it makes interacting with OBS through OBS Websocket much simpler and more approachable.

:::caution

This documentation is for the upcoming 1.0.0 release of Sceneify that uses OBS Websocket v5.

:::

:::note

This documentation assumes that you are familar with OBS, including terminology, unique name requirements of sources and filters, and how items, sources and filters are created and removed.

:::

## Motivation

OBS is a very powerful piece of software, being capable of compositing, mixing, encoding and streaming live and recorded video. OBS Websocket pushes this to the extreme, allowing for full control of almost every aspect of an OBS instance. That is, as long as you are capable and willing to write the code required to tell the websocket what to do. This can be simple if you're just trying to automate scene switching, mute an audio source or some other small task, but can become quite a daunting task with more complex software and layouts.

Sceneify was created out of a desire to simplify the process of using OBS Websocket. It is primarily designed to make OBS scripting more focused on what OBS should do, and less about how it's done. In this sense, it could be considered a declarative abstraction over OBS Websocket.

Much of the development of Sceneify was done in private by Brendonovich for Twitch streamer JDudeTV, who before using Sceneify had a massive JavaScript file that meticulously controlled everything on his stream through OBS Websocket. It didn't take long for the script to become almost unmaintainable, and a new solution was needed.

Now, JDudeTV uses Sceneify for creating his entire OBS layout, animating it and making every scene item part of a physics world. This project alone is proof that Sceneify works and has the ability to drastically simplify the process of controlling OBS with code.
