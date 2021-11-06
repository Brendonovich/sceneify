<p align="center">
<img src="website/static/img/logo.png" alt="Simple OBS logo" height="150"/>
</p>

<h1 align="center">Simple OBS</h1>
<p align="center">The simplest way to control OBS from JavaScript</p>

<p align="center">
<a href="https://www.npmjs.com/package/simple-obs">
   <img src="https://img.shields.io/npm/dt/simple-obs.svg?style=flat&colorA=000000&colorB=000000" alt="Downloads">
</a>
<a href="https://www.npmjs.com/package/simple-obs">
   <img src="https://img.shields.io/npm/v/simple-obs.svg?style=flat&colorA=000000&colorB=000000" alt="Version">
</a>
<a href="https://bundlephobia.com/result?p=simple-obs">
   <img src="https://img.shields.io/bundlephobia/min/simple-obs?label=bundle%20size&style=flat&colorA=000000&colorB=000000" alt="Build Size">
</a>
</p>

Translations: [Spanish](translations/README_es.md) | {Add your language translation}

Using `obs-websocket` can be difficult. Small manipulations of scenes and scene items are manageable, but keeping track of scenes, sources, settings, filters and more can quickly become a daunting task.

Simple OBS aims to fix this. By working with `Scene`, `Source`, and `SceneItem` objects, you can have unparalleled control over your OBS layouts.

If you're familiar with databases, it's like an ORM for OBS!

# Beta Warning

This library is not well tested and is still under heavy development. Feel free to use it, but make sure you make a backup of your scene collections before doing anything with Simple OBS.

## Features

- Persistence across code reloads, so scenes and items aren't deleted and recreated each time you run your code
- `Scene`, `Source` and `SceneItem` are designed to be overridden, allowing for complex layouts to be abstracted into subclasses
- Easy integration into existing layouts with `Scene.link()`, allowing for incremental migration to Simple OBS without handing over your entire layout to your code

## Installation

1. Install the [fork of `obs-websocket`](https://github.com/MemedowsTeam/obs-websocket/releases)

   Simple OBS exposes some functionality (eg. `obs.clean()`, `Scene.remove()`) that requires installing a custom fork of `obs-websocket`. This fork simply adds support for removing scenes, retaining all other previous functionality. Simple OBS will support `obs-websocket` v5 when it is released, which has native support for removing scenes, and also v4 for backwards compatibility.

2. Install `@simple-obs/core`

   ```
   yarn add @simple-obs/core
   ```

   or npm

   ```
   npm install @simple-obs/core
   ```

   If using typescript, make sure you are at least using `typescript@4.4.0`, as `@simple-obs/core` uses some features of it to provide more accurate types for requests and events.

3. Connect to OBS. See the example folder for more info.

## Acknowledgements

- [JDudeTV](https://twitch.tv/jdudetv) for being the catalyst for this project, helping with development and using in production on his stream.
- [HannahGBS](https://twitter.com/hannah_gbs) for adding RemoveScene support to the `obs-websocket` fork and helping with development and documenting source and filter types.
- [lclc98](https://github.com/lclc98) for helping document source and filter types.
