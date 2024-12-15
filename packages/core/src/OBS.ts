import OBSWebsocket from "obs-websocket-js";
import { Scene, Input } from "./runtime.js";

export type LogLevel = "none" | "info" | "error";

export class OBS {
  ws: OBSWebsocket;
  logging: LogLevel;

  /** @internal */
  syncedInputs = new Map<string, Input<any>>();

  constructor() {
    this.ws = new OBSWebsocket();
    this.logging = "info";
  }

  async connect(url?: string, password?: string) {
    await this.ws.connect(url, password);
  }

  /*
   * @internal
   */
  log(level: Omit<LogLevel, "none">, msg: string) {
    if (this.logging === "none") return;
    if (this.logging === "error" || level === "info") console.log(msg);
  }

  async getCurrentScene() {
    return await this.ws
      .call("GetCurrentProgramScene")
      .then((c) => c.currentProgramSceneName);
  }

  async setCurrentScene(scene: string | Scene<any>) {
    await this.ws.call("SetCurrentProgramScene", {
      sceneName: typeof scene === "string" ? scene : scene.name,
    });
  }

  async getPreviewScene() {
    return await this.ws
      .call("GetCurrentPreviewScene")
      .then((c) => c.currentPreviewSceneName);
  }

  async setPreviewScene(scene: string | Scene<any>) {
    await this.ws.call("SetCurrentPreviewScene", {
      sceneName: typeof scene === "string" ? scene : scene.name,
    });
  }

  async startStream() {
    await this.ws.call("StartStream");
  }

  async stopStream() {
    await this.ws.call("StopStream");
  }

  async toggleStream() {
    return await this.ws.call("ToggleStream").then((r) => r.outputActive);
  }

  async getFilterKinds() {
    return await this.ws
      .call("GetSourceFilterKindList")
      .then((d) => d.sourceFilterKinds);
  }
}
