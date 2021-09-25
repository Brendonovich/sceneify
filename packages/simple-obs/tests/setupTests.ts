import { obs } from "../src";
import { wait } from "../src/utils";

beforeEach(async () => {
  await wait(100)
  await obs.connect({ address: "localhost:4444" });
});

afterEach(async () => {
  await wait(100)
  obs.clear();
  await obs.clean();

  obs.disconnect();
});
