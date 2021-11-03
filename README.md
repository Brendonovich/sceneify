<center>

<img src="website/static/img/logo.png" alt="simple-obs logo" height="150" align="center"/>

<h1 align="center"><code>simple-obs</code>
<h2 align="center">The simplest way to control OBS from JS</h2>

[![Downloads](https://img.shields.io/npm/dt/simple-obs.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/simple-obs)
[![Downloads](https://img.shields.io/npm/v/simple-obs.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/simple-obs)
[![Build Size](https://img.shields.io/bundlephobia/min/simple-obs?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=simple-obs)

</center>

Translations: [Spanish](translations/README_es.md) | {Add your language translation}

Using `obs-websocket` can be difficult. Small manipulations of scenes and scene items are manageable, but keeping track of scenes, sources, settings, filters and more can quickly become a daunting task.

`simple-obs` aims to fix this. By working with `Scene`, `Source`, and `SceneItem` objects, you can have unparalleled control over your OBS layouts.

If you're familiar with databases, it's like an ORM for OBS!

# Beta Warning

This library is not well tested and is still under heavy development. Feel free to use it, but make sure you make a backup of your scene collections before doing anything with `simple-obs`.

## Features

- Persistence across code reloads, so scenes and items aren't deleted and recreated each time you run your code
- Automatic request batching
- `Scene`, `Source` and `SceneItem` are designed to be overridden, allowing for complex layouts to be abstracted into subclasses
- Easy integration into existing layouts with `Scene.link()`, allowing for incremental migration to `simple-obs` without handing over your entire layout to your code

## Installation

1. Install the [fork of `obs-websocket`](https://github.com/MemedowsTeam/obs-websocket/releases)

   `simple-obs` exposes some functionality (eg. `obs.clean()`, `Scene.remove()`) that requires installing a custom fork of `obs-websocket`. This fork simply adds support for removing scenes, retaining all other previous functionality. `simple-obs` will support `obs-websocket` v5 when it is released, which has native support for removing scenes, and also v4 for backwards compatibility.

2. Install `simple-obs`

   ```
   yarn add simple-obs
   ```

   or npm

   ```
   npm install simple-obs
   ```

   If using typescript, make sure you are at least using `typescript@4.4.0`, as `simple-obs` uses some features of it to provide more accurate types for requests and events.

3. Connect to OBS. See the example folder for more info.

## Acknowledgements

- [JDudeTV](https://twitch.tv/jdudetv) for being the catalyst for this project, helping with development and using in production on his stream.
- [HannahGBS](https://twitter.com/hannah_gbs) for adding RemoveScene support to the `obs-websocket` fork and helping with development and documenting source and filter types.
- [lclc98](https://github.com/lclc98) for helping document source and filter types.
