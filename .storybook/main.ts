/** Builds the component catalog against the same public exports consumers install. */
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  staticDirs: ["../tests/browser/public"],
  typescript: { reactDocgen: false },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: /^beez-ui$/,
            replacement: fileURLToPath(
              new URL("../dist/index.js", import.meta.url),
            ),
          },
          {
            find: "beez-ui/tanstack",
            replacement: fileURLToPath(
              new URL("../dist/tanstack.js", import.meta.url),
            ),
          },
        ],
      },
    });
  },
};

export default config;
