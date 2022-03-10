import { MockOBSWebSocket, OBS } from "../src";

export let obs = new OBS();

beforeEach(() => {
  obs.socket = new MockOBSWebSocket() as any;
});