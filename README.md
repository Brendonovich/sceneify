# `obs-js`

### _The easiest way to communicate with OBS_

[![Downloads](https://img.shields.io/npm/dt/@brendonovich/obs-js.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@brendonovich/obs-js)
[![Downloads](https://img.shields.io/npm/v/@brendonovich/obs-js.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@brendonovich/obs-js)
[![Build Size](https://img.shields.io/bundlephobia/min/@brendonovich/obs-js?label=bundle%20size&style=flat&colorA=000000&colorB=000000)](https://bundlephobia.com/result?p=@brendonovich/obs-js)

Controlling OBS with code is difficult. Simple manipulations of scenes and scene items can be manageable, but can easily spiral out of control having to keep track of scenes, sources, settings, filters and more.

obs-js aims to fix this. By simply working with `Scene`, `Source`, and `SceneItem` objects, you can have unparalleled control over your OBS layout.

# Beta Warning
This library is not well tested and is still under heavy development. Feel free to use it, but make sure you make a backup of your scene collections before doing anything with obs-js.

## Features

- Persistence across code reloads, so scenes and items aren't deleted and recreated each time you run your code
- Automatic request batching
- `Scene`, `Source` and `SceneItem` are designed to be overridden, allowing for complex layouts to be abstracted into subclasses
- Easy integration into existing layouts with `Scene.link()`, allowing for incremental migration to `obs-js` without handing over your entire layout to your code

## Installation

1. Install obs-js

```
yarn add @brendonovich/obs-js
```

or NPM

```
npm install @brendonovich/obs-js
```

2. Connect to OBS.

Where you first use OBS in your code, import `obs`:

```ts
import { obs } from "@brendonovich/obs-js";
```

Then simply connect:

```ts
await obs.connect({ address: "localhost:4444" });
```

3. Create and link with scenes and sources. See the example folder for a tutorial.

## To Do
- [ ] Filters
- [ ] Clean
- [ ] Ignored symbol