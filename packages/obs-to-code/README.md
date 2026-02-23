# @sceneify/obs-to-code

Reverse-engineer OBS scenes into TypeScript code that uses the @sceneify/core-rewrite API.

## Overview

This package allows you to export your existing OBS scenes, inputs, filters, and transforms into TypeScript code that can recreate your setup programmatically using the @sceneify/core-rewrite library.

## Installation

```bash
npm install @sceneify/obs-to-code
# or
pnpm add @sceneify/obs-to-code
```

## CLI Usage

### Basic Usage

Export your current OBS setup:

```bash
# Export to stdout
npx @sceneify/obs-to-code

# Export to a file
npx @sceneify/obs-to-code -o ./my-scene.ts
```

### Options

- `-u, --url <url>` - OBS WebSocket URL (default: ws://localhost:4455)
- `-p, --password <pass>` - OBS WebSocket password (optional)
- `-o, --output <file>` - Output file path (default: stdout)
- `-h, --help` - Show help message

### Examples

```bash
# Connect to remote OBS
npx @sceneify/obs-to-code --url ws://192.168.1.100:4455 --password secret -o ./scene.ts

# Export with custom URL
npx @sceneify/obs-to-code -u ws://localhost:4456 -o ./scene.ts
```

### Generated Code

The CLI generates TypeScript code that looks like this:

```typescript
import { Effect } from "effect";
import {
  InputType,
  FilterType,
  Input,
  Scene,
  OBSSocket,
  Sceneify,
} from "@sceneify/core-rewrite";
import {
  BrowserSource,
  ColorSource,
  // ... other sources
  ChromaKeyFilter,
} from "@sceneify/sources";

// Input declarations
const chatOverlay = Input.declare(BrowserSource, {
  name: "Chat",
  settings: { url: "https://example.com/chat", width: 400, height: 600 },
});

const background = Input.declare(ColorSource, {
  name: "Background",
  settings: { color: 0xff2d2d3a, width: 1920, height: 1080 },
});

// Scene declarations
const mainScene = Scene.declare({
  name: "Main",
  items: {
    background: { source: background, index: 0 },
    chatOverlay: { 
      source: chatOverlay, 
      transform: { positionX: 100, positionY: 100 },
      index: 1 
    },
  },
});

// Export
export { chatOverlay, background, mainScene };
```

## Programmatic API

### Basic Usage

```typescript
import { generateFromOBS } from "@sceneify/obs-to-code";

const code = await generateFromOBS({
  url: "ws://localhost:4455",
  password: "optional-password"
});

console.log(code);
```

### Effect-Based API

For Effect users, use the `generateCode` function. It depends on the OBSSocket service, which you provide via layer:

```typescript
import { Effect } from "effect";
import { OBSSocket } from "@sceneify/core-rewrite";
import { generateCode } from "@sceneify/obs-to-code";

// generateCode only takes code generation options
// The OBS connection is provided via the OBSSocket layer
const program = generateCode({ allowInlineDefinitions: true }).pipe(
  Effect.provide(OBSSocket.layer({ 
    url: "ws://localhost:4455",
    password: "optional-password"
  }))
);

const code = await Effect.runPromise(program);
```

## How It Works

1. **Connects to OBS** via WebSocket using `@sceneify/core-rewrite`'s OBSSocket
2. **Fetches all data**: scenes, inputs, filters, and their transforms
3. **Maps to known types**: Uses `@sceneify/sources` for known input/filter kinds
4. **Generates code**: Creates TypeScript that recreates your OBS setup
5. **Handles unknown types**: Creates inline class definitions for unknown input/filter kinds

## Error Handling

The package uses Effect for all operations, providing:
- Structured error handling
- Proper resource management (WebSocket connections auto-cleanup)
- Type-safe error channels

Errors that may occur:
- Connection errors (can't connect to OBS)
- Unknown input/filter kinds (when `allowInlineDefinitions: false`)
- File system errors (when writing output files)

## Features

- ✅ Exports all scenes and their items
- ✅ Captures input settings (URLs, colors, files, etc.)
- ✅ Exports filters with their settings
- ✅ Preserves transform data (position, scale, rotation, crop)
- ✅ Maintains scene item ordering (index)
- ✅ Handles unknown input/filter types with inline definitions
- ✅ Generates unique, valid TypeScript variable names
- ✅ Effect-based for composability and error handling

## Requirements

- OBS Studio with WebSocket server enabled (v5.0+ recommended)
- Node.js 18+
- TypeScript 5.0+ (for using generated code)

## See Also

- [@sceneify/core-rewrite](https://github.com/brendonovich/sceneify) - The core library for managing OBS scenes
- [@sceneify/sources](https://github.com/brendonovich/sceneify) - Pre-defined input and filter types

## License

MIT
