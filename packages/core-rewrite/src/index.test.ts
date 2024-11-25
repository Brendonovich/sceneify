import { defineFilterType, defineInputType, defineScene } from "./definition";
import { OBS } from "./obs";
import { syncScene as syncScene } from "./runtime";

export const GAP = 20;

export const macOSScreenCapture = defineInputType("screen_capture").settings<{
  application: string;
  display_uuid: string;
  hide_obs: boolean;
  show_cursor: boolean;
  show_empty_names: boolean;
  show_hidden_windows: boolean;
  type: number;
  window: number;
}>();

export const browserSource = defineInputType("browser_source").settings<{
  url: string;
  width: number;
  height: number;
  reroute_audio: boolean;
}>();

export const videoCaptureSource = defineInputType(
  "av_capture_input_v2"
).settings<{ device: string; device_name: string }>();

export const streamfxBlurFilter = defineFilterType(
  "streamfx-filter-blur"
).settings<{
  "Filter.Blur.Type": string;
  "Filter.Blur.Size": number;
}>();

export const webcam = videoCaptureSource.defineInput({
  name: "Webcam",
  settings: {
    device: "47B4B64B-7067-4B9C-AD2B-AE273A71F4B5",
  },
  filters: {
    blur: streamfxBlurFilter.defineFilter({
      name: "Blur",
      settings: {
        "Filter.Blur.Type": "box",
        "Filter.Blur.Size": 30,
      },
    }),
  },
});

export const mainScene = defineScene({
  name: "Main",
  items: {
    camera: {
      input: webcam,
      positionX: 1920 / 2,
      positionY: 1080 / 2,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      alignment: "center",
    },
  },
});

async function main() {
  const obs = new OBS();
  await obs.connect("ws://localhost:4455");

  const scene = await syncScene(obs, mainScene);

  await scene.syncItem({
    input: display,
    alignment: "topLeft",
    positionX: 0,
    positionY: 0,
    scaleX: 0.5,
    scaleY: 0.5,
  });
}

main();

// guest: {
//   input: browserSource.defineInput({
//     name: "Guest",
//     settings: {
//       width: 1920,
//       height: 1080,
//       url: "https://ping.gg/call/brendonovich/embed?view=cl8287d6q12920gmk8bbjyff5",
//     },
//   }),
//   alignment: "bottom-right",
// },
// chat: {
//   input: browserSource.defineInput({
//     name: "Chat",
//     settings: {
//       url: "", //import.meta.env.VITE_CHAT_WIDGET_URL,
//       width: 1000,
//     },
//   }),
//   positionX: 1920 - GAP,
//   alignment: "bottom-right",
// },
// discordServer: {
//   input: browserSource.defineInput({
//     name: "Discord Server",
//     settings: {
//       url: "https://streamkit.discord.com/overlay/status/949090953497567312?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=0&invite_code=XpctyaUgG8&limit_speaking=false&small_avatars=false&hide_names=false&fade_chat=0",
//       width: 312,
//       height: 64,
//     },
//   }),
//   alignment: "bottom-right",
//   positionX: 1920 - GAP,
//   positionY: GAP,
// },
// streamkitVoice: {
//   input: browserSource.defineInput({
//     name: "Streamkit Voice",
//     settings: {
//       url: "https://streamkit.discord.com/overlay/voice/949090953497567312/966581199025893387?icon=true&online=true&logo=white&text_color=%23ffffff&text_size=14&text_outline_color=%23000000&text_outline_size=0&text_shadow_color=%23000000&text_shadow_size=0&bg_color=%231e2124&bg_opacity=0.95&bg_shadow_color=%23000000&bg_shadow_size=0&invite_code=XpctyaUgG8&limit_speaking=true&small_avatars=false&hide_names=false&fade_chat=0",
//     },
//   }),
// },
// display: {
//   input: display,
//   positionX: 0,
//   positionY: 0,
// },
// micAudio: {
//   input: micInput,
// },
// systemAudio: {
//   source: new Input({
//     name: "System Audio",
//     kind: "coreaudio_input_capture",
//     settings: {
//       device_id: "BlackHole16ch_UID",
//     },
//     // TODO
//     // volume: {
//     // 	db: -8
//     // }
//   }),
// },

// export const micInput = coreAudioInputCapture.define({
//   name: "Mic Audio",
//   settings: {
//     // TODO: mono
//   },
//   filters: {
//     supression: noiseSuppressFilter.define({
//       name: "Noise Suppress",
//       settings: {
//         method: "speex",
//       },
//     }),
//     gate: noiseGateFilter.define({
//       name: "Noise Gate",
//       settings: {
//         open_threshold: -35,
//         close_threshold: -45,
//       },
//     }),
//   },
// });

export const display = macOSScreenCapture.defineInput({
  name: "Display",
  // filters: {
  //   blur: streamfxBlurFilter.defineFilter({
  //     name: "Blur",
  //     enabled: false,
  //     settings: {
  //       "Filter.Blur.Type": "box",
  //       "Filter.Blur.Subtype": "area",
  //       "Filter.Blur.Size": 30,
  //     },
  //   }),
  // },
});
