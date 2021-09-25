import { BrowserSource, Scene } from "../../src";

describe("setSettings()", () => {
  it("updates width and height of item instances", async () => {
    const source = new BrowserSource({
      name: "Test Source",
      settings: {
        width: 200,
        height: 300,
        url: "https://obsproject.com/",
      },
    });

    const scene = new Scene({
      name: "Test",
      items: {
        browser: {
          source,
        },
      },
    });
    
    await scene.create();
    const item = scene.items.browser;
    
    expect(item.properties.width).toBe(200);
    expect(item.properties.sourceWidth).toBe(200);
    expect(item.properties.height).toBe(300);
    expect(item.properties.sourceHeight).toBe(300);

    await source.setSettings({
      width: 400,
      height: 500,
    });

    expect(item.properties.width).toBe(400);
    expect(item.properties.sourceWidth).toBe(400);
    expect(item.properties.height).toBe(500);
    expect(item.properties.sourceHeight).toBe(500);

    await item.setProperties({
      scale: {
        x: 1.5,
        y: 2,
      },
    });

    expect(item.properties.width).toBe(600);
    expect(item.properties.sourceWidth).toBe(400);
    expect(item.properties.height).toBe(1000);
    expect(item.properties.sourceHeight).toBe(500);
  });
});
