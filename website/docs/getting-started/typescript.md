---
sidebar_position: 2
slug: /typescript
---

# TypeScript Support

While Sceneify can be used directly from JavaScript, it is written in TypeScript and provides first-class TypeScript support. Each class provided by Sceneify is capable of remembering extra information about how it was created when TypeScript is used:

- [Scene](/api/core/class/Scene): Items, filters and settings types
- [Source](/api/core/class/Source): Filters and settings types
- [SceneItem](/api/core/class/SceneItem): Base source and containing scene

All of this information can assist in using Sceneify as your programming environment can be aware of most - if not all - of your OBS layout as you code, providing suggestions and type safety.

## Code Editor Integration

If you are using a code editor such as [Visual Studio Code](https://code.visualstudio.com/), you likely already have TypeScript checking your JavaScript code automatically and providing autocompletion. If not, install the TypeScript extension for your code editor.

## Using the TypeScript Compiler

The TypeScript compiler `tsc` can perform the same type checking as your code editor, the only difference being that it isn't performed as you type.

Alternatively, you can skip compilation and run your TypeScript code with a utility like [ts-node](https://github.com/TypeStrong/ts-node), which will execute your TypeScript files in the same way that `node` executes JavaScript files. This will type check your files before running them, providing the same level of safety as `tsc`.