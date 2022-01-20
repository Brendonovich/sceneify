const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");

// With JSDoc @type annotations, IDEs can provide config autocompletion
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Sceneify",
  tagline: "The easiest way to control OBS from JavaScript",
  url: "https://sceneify.brendonovich.dev",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "Brendonovich",
  projectName: "sceneify",
  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/Brendonovich/sceneify/edit/master/website/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],
  plugins: [
    [
      "docusaurus-plugin-typedoc-api",
      {
        projectRoot: path.join(__dirname, "../"),
        packages: ["core", "sources", "filters", "animation"].map(
          (pkg) => `packages/${pkg}`
        ),
        tsconfigName: "tsconfig.docs.json",
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "img/twitter.png",
      metadata: [{ name: "twitter:card", content: "summary" }],
      navbar: {
        title: "Sceneify",
        items: [
          {
            type: "doc",
            docId: "overview",
            position: "left",
            label: "Docs",
          },
          {
            to: "api",
            label: "API",
            position: "left",
          },
          {
            href: "https://github.com/Brendonovich/sceneify",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Overview",
                to: "/docs/overview",
              },
            ],
          },
          {
            title: "Links",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/Brendonovich/sceneify",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/brendonovich1",
              },
            ],
          },
        ],
        copyright: `
          Copyright © ${new Date().getFullYear()} Brendonovich <br>
          Sceneify is in no way affiliated with OBS Studio or the OBS Project
        `,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};
