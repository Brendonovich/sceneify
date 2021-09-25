import { obs } from "../src";

beforeEach(async () => {
  await obs.connect({ address: "localhost:4444" });
});

afterEach(async () => {
  obs.clear();
  await obs.clean();

  obs.disconnect();
});
