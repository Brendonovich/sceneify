# `simple-obs`

### _The simplest way to control OBS from JS 🎥_

[![Downloads](https://img.shields.io/npm/dt/@brendonovich/simple-obs-js.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@brendonovich/simple-obs-js)
[![Downloads](https://img.shields.io/npm/v/@brendonovich/simple-obs-js.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@brendonovich/simple-obs-js)
[![Build Size](https://img.shields.io/bundlephobia/min/@brendonovich/simple-obs-js?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=@brendonovich/simple-obs-js)

Using `obs-websocket` can be difficult. Small manipulations of scenes and scene items are manageable, but keeping track of scenes, sources, settings, filters and more can quickly become a daunting task.

`simple-obs` aims to fix this. By working with `Scene`, `Source`, and `SceneItem` objects, you can have unparalleled control over your OBS layouts.

# Beta Warning

This library is not well tested and is still under heavy development. Feel free to use it, but make sure you make a backup of your scene collections before doing anything with `simple-obs`.

## Features

- Persistence across code reloads, so scenes and items aren't deleted and recreated each time you run your code
- Automatic request batching
- `Scene`, `Source` and `SceneItem` are designed to be overridden, allowing for complex layouts to be abstracted into subclasses
- Easy integration into existing layouts with `Scene.link()`, allowing for incremental migration to `simple-obs` without handing over your entire layout to your code

## Installation

1. Install the [fork of obs-websocket](https://github.com/MemedowsTeam/obs-websocket/releases)
  
    `simple-obs` exposes some functionality (eg. `obs.clean()`, `Scene.remove()`) that requires installing a custom fork of `obs-websocket`. This fork simply adds support for removing scenes, retaining all other previous functionality. obs-js will support `obs-w`ebsocket` v5 when it is released, which has native support for removing scenes, and also v4 for backwards compatibility.

2. Install `simple-obs`

    ```
    yarn add simple-obs
    ```

    or NPM

    ```
    npm install simple-obs
    ```
    
3. Connect to OBS. See the example folder for more info.

## To Do

- [x] Filters
- [ ] Clean
- [ ] Ignored symbol
