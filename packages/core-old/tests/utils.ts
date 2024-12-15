import { mocks, OBS } from "../src";

export let obs = new OBS();

beforeEach(async () => {
  obs.socket = new mocks.MockOBSWebSocket() as any;
  await obs.connect("", "");
});

export function resetSceneify() {
  let socket = obs.socket;
  obs = new OBS();
  obs.socket = socket;
}
