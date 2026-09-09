/** Shares the production theme, fonts and tooltip context across examples. */
import { useEffect } from "react";
import type { Preview } from "@storybook/react-vite";
import { BeezUIProvider, TooltipProvider, useTheme } from "beez-ui";
import "beez-ui/styles.css";
import "./preview.css";

/** Applies toolbar changes without preventing the theme component's own interactions. */
function ThemeSync({ theme }: { theme: string }) {
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);
  return null;
}

const preview: Preview = {
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Tema compartido",
      toolbar: {
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Claro" },
          { value: "dark", title: "Oscuro" },
          { value: "system", title: "Sistema" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    options: { storySort: { method: "alphabetical" } },
  },
  decorators: [
    (Story, context) => (
      <BeezUIProvider
        themeOptions={{
          storageKey: "beez-ui-storybook-theme",
          defaultTheme: "light",
        }}
      >
        <ThemeSync theme={context.globals.theme} />
        <TooltipProvider>
          <div
            className={
              context.parameters.layout === "fullscreen"
                ? "StoryFullscreen"
                : "StoryFrame"
            }
          >
            <Story />
          </div>
        </TooltipProvider>
      </BeezUIProvider>
    ),
  ],
};

export default preview;
