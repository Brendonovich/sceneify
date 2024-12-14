import { defineScene } from "./definition.ts";
import {
  gainFilter,
  noiseGateFilter,
  noiseSuppressFilter,
  sharpenFilter,
  // streamfxBlurFilter,
} from "./filters.ts";
import {
  browserSource,
  coreAudioInputCapture,
  macOSScreenCapture,
  videoCaptureSource,
} from "./inputs.ts";
import { OBS } from "./obs.ts";
import { FilterDefsOfInputDef, syncScene as syncScene } from "./runtime.ts";

export const GAP = 20;

export const webcam = videoCaptureSource.defineInput({
  name: "Webcam",
  settings: {
    device: "0x122000046d085c",
  },
});

const display = macOSScreenCapture.defineInput({
  name: "Display",
  settings: {
    display_uuid: "37D8832A-2D66-02CA-B9F7-8F30A301B230",
  },
});

const micInput = coreAudioInputCapture.defineInput({
  name: "Mic Audio",
  settings: {
    device_id:
      "AppleUSBAudioEngine:Burr-Brown from TI              :USB Audio CODEC :130000:2",
    enable_downmix: true,
  },
  filters: {
    gain: gainFilter.defineFilter({
      index: 0,
      enabled: true,
      name: "Gain",
      settings: { db: 2.5 },
    }),
    noiseSuppression: noiseSuppressFilter.defineFilter({
      index: 1,
      enabled: true,
      name: "Noise Suppression",
      settings: { method: "speex" },
    }),
  },
});

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

const DISPLAY_WIDTH = 3456;
const DISPLAY_HEIGHT = 2234;

const DISPLAY_SCALE = OUTPUT_HEIGHT / DISPLAY_HEIGHT;
const DISPLAY_OFFSET = (OUTPUT_WIDTH - DISPLAY_WIDTH * DISPLAY_SCALE) / 2;

export const mainScene = defineScene({
  name: "Main",
  items: {
    display: {
      index: 1,
      input: display,
      scaleX: DISPLAY_SCALE,
      scaleY: DISPLAY_SCALE,
      positionX: DISPLAY_OFFSET,
      positionY: 0,
      alignment: "topLeft",
    },
    webcam: {
      index: 2,
      input: webcam,
      positionX: OUTPUT_WIDTH - GAP,
      positionY: OUTPUT_HEIGHT - GAP,
      cropLeft: 300,
      cropRight: 300,
      alignment: "bottomRight",
    },
    discordServer: {
      index: 3,
      input: browserSource.defineInput({
        name: "Discord Server",
        settings: {
          width: 312,
          height: 64,
          url: "https://streamkit.discord.com/overlay/status/1177608475682029568?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=0&invite_code=XpctyaUgG8&limit_speaking=false&small_avatars=false&hide_names=false&fade_chat=0",
          css: "body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }",
        },
      }),
      alignment: "topRight",
      positionX: OUTPUT_WIDTH - GAP,
      positionY: GAP,
    },
    mic: {
      index: 4,
      input: micInput,
    },
    //   guest: {
    //     input: browserSource.defineInput({
    //       name: "Guest",
    //       settings: {
    //         width: 1920,
    //         height: 1080,
    //         url: "https://ping.gg/call/brendonovich/embed?view=cl8287d6q12920gmk8bbjyff5",
    //       },
    //     }),
    //     alignment: "bottomRight",
    //   },
    //   chat: {
    //     input: browserSource.defineInput({
    //       name: "Chat",
    //       settings: {
    //         url: "", //import.meta.env.VITE_CHAT_WIDGET_URL,
    //         width: 1000,
    //       },
    //     }),
    //     positionX: 1920 - GAP,
    //     alignment: "bottomRight",
    //   },
    //   streamkitVoice: {
    //     input: browserSource.defineInput({
    //       name: "Streamkit Voice",
    //       settings: {
    //         url: "https://streamkit.discord.com/overlay/voice/949090953497567312/966581199025893387?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=0&invite_code=XpctyaUgG8&limit_speaking=true&small_avatars=false&hide_names=false&fade_chat=0",
    //       },
    //     }),
    //   },
  },
});

const cameraScene = defineScene({
  name: "Camera",
  items: {
    webcam: {
      index: 0,
      input: webcam,
      positionX: 0,
      positionY: 0,
      scaleX: 1,
      scaleY: 1,
      alignment: "topLeft",
    },
    mic: {
      index: 1,
      input: micInput,
    },
  },
});

export const CAM_HEIGHT = 350;
export const CAM_WIDTH = (CAM_HEIGHT * 16) / 9;

async function main() {
  const obs = new OBS();
  await obs.connect("ws://localhost:4455");

  const main = await syncScene(obs, mainScene);
  const camera = await syncScene(obs, cameraScene);

  await obs.setCurrentScene(main);
}

main();
