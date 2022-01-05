<p align="center">
</p>

<h1 align="center">Sceneify</h1>
<p align="center">The easiest way to control OBS from JavaScript</p>

<p align="center">
<a href="https://www.npmjs.com/package/@sceneify/core">
   <img src="https://img.shields.io/npm/dt/@sceneify/core/beta?colorB=blue&colorA=black&style=flat-square" alt="Downloads">
</a>
<a href="https://www.npmjs.com/package/@sceneify/core">
   <img src="https://img.shields.io/npm/v/@sceneify/core/beta?colorB=blue&colorA=black&style=flat-square" alt="Core Version">
</a>
<a href="https://bundlephobia.com/result?p=@sceneify/core">
   <img src="https://img.shields.io/bundlephobia/min/@sceneify/core?style=flat-square&colorA=black&colorB=blue" alt="Build Size">
</a>
</p>

Translations: [Spanish](translations/README_es.md) | {Add your language translation}

Using `obs-websocket` can be difficult. Small manipulations of scenes and scene items are manageable, but keeping track of scenes, sources, settings, filters and more can quickly become a daunting task.

Sceneify aims to fix this. By working with `Scene`, `Source`, and `SceneItem` objects, you can have unparalleled control over your OBS layouts.

# Beta Warning

This library is not well tested and is still under heavy development. Feel free to use it, but make sure you make a backup of your scene collections before doing anything with Sceneify.

## Features

- Persistence across code reloads, so scenes and items aren't deleted and recreated each time you run your code
- `Scene`, `Source` and `SceneItem` are designed to be overridden, allowing for complex layouts to be abstracted into subclasses
- Easy integration into existing layouts with `Scene.link()`, allowing for incremental migration to Sceneify without handing over your entire layout to your code.


## Acknowledgements

- [JDudeTV](https://twitch.tv/jdudetv) for being the catalyst for this project, helping with development and using in production on his stream.
- [HannahGBS](https://twitter.com/hannah_gbs) for adding RemoveScene support to the `obs-websocket` fork and helping with development and documenting source and filter types.
- [lclc98](https://github.com/lclc98) for helping document source and filter types.
