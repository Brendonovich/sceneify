import { Scene } from "../src"

test("Creates a scene", async () => {
  const scene = new Scene({
    name: "Test",
    items: {},
  });

  expect(scene.name).toBe("Test");
});
