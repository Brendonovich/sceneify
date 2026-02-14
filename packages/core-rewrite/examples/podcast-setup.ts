/**
 * Example: Podcast recording setup with multiple camera angles.
 *
 * Shows a simpler setup focused on:
 * - Multiple camera inputs with inline audio filter chains
 * - Scene switching between layouts
 * - Runtime audio adjustments
 */

import { Effect } from "effect";
import {
  InputType,
  FilterType,
  Input,
  Scene,
  OBSSocket,
  Sceneify,
} from "../src/index.js";

// ─── Input Types ─────────────────────────────────────────────────────────────

class VideoCaptureSource extends InputType("av_capture_input_v2")<{
  device: string;
  device_name: string;
}>() {}

class AudioInputCapture extends InputType("coreaudio_input_capture")<{
  device_id: string;
}>() {}

class ColorSource extends InputType("color_source_v3")<{
  color: number;
  width: number;
  height: number;
}>() {}

class ImageSource extends InputType("image_source")<{
  file: string;
}>() {}

// ─── Filter Types ────────────────────────────────────────────────────────────

class NoiseSuppressFilter extends FilterType("noise_suppress_filter_v2")<{
  method: "speex" | "rnnoise" | "nvafx";
}>() {}

class NoiseGateFilter extends FilterType("noise_gate_filter")<{
  open_threshold: number;
  close_threshold: number;
  attack_time: number;
  hold_time: number;
  release_time: number;
}>() {}

class GainFilter extends FilterType("gain_filter")<{
  db: number;
}>() {}

// ─── Inputs (with inline filters) ───────────────────────────────────────────

const hostCamera = Input.declare(VideoCaptureSource, {
  name: "Host Camera",
  settings: {
    device: "0x1234567890",
    device_name: "Logitech C920",
  },
});

const guestCamera = Input.declare(VideoCaptureSource, {
  name: "Guest Camera",
  settings: {
    device: "0x0987654321",
    device_name: "Sony A6400",
  },
});

const hostMic = Input.declare(AudioInputCapture, {
  name: "Host Microphone",
  settings: { device_id: "AppleHDAEngineInput:1" },
  filters: {
    noiseSuppression: {
      type: NoiseSuppressFilter,
      name: "Host Noise Suppression",
      settings: { method: "rnnoise" },
    },
    noiseGate: {
      type: NoiseGateFilter,
      name: "Host Noise Gate",
      settings: {
        open_threshold: -26,
        close_threshold: -32,
        attack_time: 25,
        hold_time: 200,
        release_time: 150,
      },
    },
    gain: {
      type: GainFilter,
      name: "Host Gain",
      settings: { db: 2.0 },
    },
  },
});

const guestMic = Input.declare(AudioInputCapture, {
  name: "Guest Microphone",
  settings: { device_id: "AppleHDAEngineInput:2" },
  filters: {
    noiseSuppression: {
      type: NoiseSuppressFilter,
      name: "Guest Noise Suppression",
      settings: { method: "rnnoise" },
    },
    gain: {
      type: GainFilter,
      name: "Guest Gain",
      settings: { db: 4.0 },
    },
  },
});

const podcastBackground = Input.declare(ColorSource, {
  name: "Podcast BG",
  settings: { color: 0xff2d2d3a, width: 1920, height: 1080 },
});

const logo = Input.declare(ImageSource, {
  name: "Podcast Logo",
  settings: { file: "/assets/podcast-logo.png" },
});

// ─── Scenes ──────────────────────────────────────────────────────────────────

// Side-by-side layout for conversation
const dualCamScene = Scene.declare({
  name: "Dual Camera",
  items: {
    bg: { source: podcastBackground, index: 0 },
    host: {
      source: hostCamera,
      transform: {
        positionX: 0,
        positionY: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        cropTop: 60,
        cropBottom: 60,
      },
      index: 1,
    },
    guest: {
      source: guestCamera,
      transform: {
        positionX: 960,
        positionY: 0,
        scaleX: 0.5,
        scaleY: 0.5,
        cropTop: 60,
        cropBottom: 60,
      },
      index: 2,
    },
    logo: {
      source: logo,
      transform: {
        positionX: 860,
        positionY: 980,
        scaleX: 0.15,
        scaleY: 0.15,
      },
      index: 3,
    },
    hostAudio: { source: hostMic, index: 4 },
    guestAudio: { source: guestMic, index: 5 },
  },
});

// Full-screen host for solo segments
const hostSoloScene = Scene.declare({
  name: "Host Solo",
  items: {
    bg: { source: podcastBackground, index: 0 },
    host: {
      source: hostCamera,
      transform: { positionX: 0, positionY: 0 },
      index: 1,
    },
    logo: {
      source: logo,
      transform: {
        positionX: 1720,
        positionY: 980,
        scaleX: 0.1,
        scaleY: 0.1,
      },
      index: 2,
    },
    hostAudio: { source: hostMic, index: 3 },
    guestAudio: { source: guestMic, index: 4 },
  },
});

// ─── Runtime ─────────────────────────────────────────────────────────────────

const program = Effect.gen(function* () {
  // Create scenes - shared inputs (bg, logo, mics) are created only once
  const dual = yield* Scene.sync(dualCamScene);
  const solo = yield* Scene.sync(hostSoloScene);

  // Adjust host mic audio processing at runtime
  const hostMicInput = dual.item("hostAudio").input;
  yield* hostMicInput.setVolume({ db: -3.0 });
  yield* hostMicInput.filter("gain").setSettings({ db: 4.0 });
  yield* hostMicInput.filter("noiseGate").setSettings({
    open_threshold: -24,
  });

  // Mute guest during host solo segments
  yield* dual.item("guestAudio").input.setMuted(true);

  // Reposition host camera in dual view
  yield* dual.item("host").setTransform({
    positionX: 20,
    positionY: 20,
  });

  // Lock the background so it can't be accidentally moved in OBS
  yield* dual.item("bg").setLocked(true);
  yield* solo.item("bg").setLocked(true);
});

const OBSLive = OBSSocket.layer({ url: "ws://localhost:4455" });

const runnable = program.pipe(
  Effect.provide(OBSLive),
  Effect.provide(Sceneify.layer)
);

Effect.runPromise(runnable);
