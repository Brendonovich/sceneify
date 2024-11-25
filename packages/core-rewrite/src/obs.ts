import OBSWebsocket from "obs-websocket-js";

export class OBS {
  ws: OBSWebsocket;

  constructor() {
    this.ws = new OBSWebsocket();
  }

  async connect(url?: string, password?: string) {
    await this.ws.connect(url, password);
  }
}
