/**
 * Example: Full streaming setup with scenes, inputs, and filters.
 *
 * Demonstrates the complete Sceneify v2 flow:
 * 1. Define input types and filter types
 * 2. Declare inputs with inline filter configs
 * 3. Declare scenes with items and transforms
 * 4. Connect to OBS and create everything
 * 5. Manipulate runtime objects
 */

import { Effect } from "effect";
import {
  InputType,
  FilterType,
  Input,
  Scene,
  OBSSocket,
  Sceneify,
} from "../src/index.ts";

// ─── 1. Define Input Types ──────────────────────────────────────────────────

class BrowserSource extends InputType("browser_source")<{
  url: string;
  width: number;
  height: number;
  css: string;
}>() {}

class ColorSource extends InputType("color_source_v3")<{
  color: number;
  width: number;
  height: number;
}>() {}

class ImageSource extends InputType("image_source")<{
  file: string;
}>() {}

class MediaSource extends InputType("ffmpeg_source")<{
  local_file: string;
  looping: boolean;
  hw_decode: boolean;
}>() {}

// ─── 2. Define Filter Types ─────────────────────────────────────────────────

class ColorCorrectionFilter extends FilterType("color_filter_v2")<{
  gamma: number;
  contrast: number;
  brightness: number;
  saturation: number;
  hue_shift: number;
  opacity: number;
}>() {}

class ChromaKeyFilter extends FilterType("chroma_key_filter_v2")<{
  similarity: number;
  smoothness: number;
  key_color_type: string;
}>() {}

// ─── 3. Declare Inputs (with inline filters) ────────────────────────────────

const chatOverlay = Input.declare(BrowserSource, {
  name: "Chat Overlay",
  settings: {
    url: "https://streamelements.com/overlay/chat",
    width: 400,
    height: 600,
  },
});

const alertBox = Input.declare(BrowserSource, {
  name: "Alert Box",
  settings: {
    url: "https://streamelements.com/overlay/alerts",
    width: 800,
    height: 600,
  },
});

const webcam = Input.declare(ImageSource, {
  name: "Webcam",
  settings: { file: "" },
  filters: {
    colorCorrection: {
      type: ColorCorrectionFilter,
      name: "Webcam Color Correction",
      settings: {
        gamma: 0.9,
        contrast: 1.1,
        brightness: 0.02,
        saturation: 1.15,
      },
    },
    chromaKey: {
      type: ChromaKeyFilter,
      name: "Webcam Chroma Key",
      settings: {
        similarity: 400,
        smoothness: 80,
        key_color_type: "green",
      },
      enabled: false, // Disabled by default, enable when using green screen
    },
  },
});

const background = Input.declare(ColorSource, {
  name: "Background",
  settings: {
    color: 0xff1a1a2e,
    width: 1920,
    height: 1080,
  },
});

const stingerTransition = Input.declare(MediaSource, {
  name: "Stinger",
  settings: {
    local_file: "/assets/stinger.webm",
    looping: false,
    hw_decode: true,
  },
});

// ─── 4. Declare Scenes ──────────────────────────────────────────────────────

const mainScene = Scene.declare({
  name: "Main Scene",
  items: {
    background: {
      source: background,
      index: 0,
    },
    webcam: {
      source: webcam,
      transform: {
        positionX: 1420,
        positionY: 680,
        scaleX: 0.35,
        scaleY: 0.35,
        cropLeft: 200,
        cropRight: 200,
      },
      index: 1,
    },
    chatOverlay: {
      source: chatOverlay,
      transform: {
        positionX: 1500,
        positionY: 20,
      },
      index: 2,
    },
    alertBox: {
      source: alertBox,
      transform: {
        positionX: 560,
        positionY: 200,
      },
      index: 3,
    },
  },
});

const brbScene = Scene.declare({
  name: "BRB Scene",
  items: {
    background: {
      source: background,
      index: 0,
    },
    stinger: {
      source: stingerTransition,
      enabled: true,
      index: 1,
    },
  },
});

// ─── 5. Create and Manipulate ────────────────────────────────────────────────

const program = Effect.gen(function* () {
  // Create both scenes - inputs shared between scenes are only created once
  const main = yield* Scene.sync(mainScene);
  const brb = yield* Scene.sync(brbScene);

  // Access scene items with full type safety
  const webcamItem = main.item("webcam");
  const chatItem = main.item("chatOverlay");

  // Manipulate input settings (type-checked against BrowserSource settings)
  yield* chatItem.input.setSettings({
    url: "https://streamelements.com/overlay/chat?theme=dark",
  });

  // Manipulate scene item transforms
  yield* webcamItem.setTransform({
    positionX: 0,
    positionY: 0,
    scaleX: 1.0,
    scaleY: 1.0,
  });

  // Toggle webcam visibility
  yield* webcamItem.setEnabled(false);
  yield* webcamItem.setEnabled(true);

  // Access filters on the webcam input
  const chromaKey = webcamItem.input.filter("chromaKey");
  yield* chromaKey.setEnabled(true);
  yield* chromaKey.setSettings({ similarity: 500 });

  const colorCorrection = webcamItem.input.filter("colorCorrection");
  yield* colorCorrection.setSettings({ brightness: 0.05, saturation: 1.2 });

  // Dynamically add a new item to the scene at runtime
  const timerItem = yield* main.createItem({
    type: BrowserSource,
    name: "Stream Timer",
    settings: {
      url: "https://streamelements.com/overlay/timer",
      width: 300,
      height: 100,
    },
  });
  yield* timerItem.setTransform({ positionX: 10, positionY: 10 });

  yield* Effect.sleep("500 millis");

  // Dynamic items can be removed (declared items cannot)
  yield* timerItem.remove();
});

// ─── 6. Run with OBS Connection ──────────────────────────────────────────────

const OBSLive = OBSSocket.layer({
  url: "ws://localhost:4455",
});

const runnable = program.pipe(
  Effect.provide(OBSLive),
  Effect.provide(Sceneify.layer)
);

Effect.runPromise(runnable);
