export default {
  drivers: [
    ["jest", {}],
    [
      "typescript",
      {
        buildFolder: "dts",
        declarationOnly: true,
      },
    ],
  ],
  settings: {
    node: true,
  },
};
