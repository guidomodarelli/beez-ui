/** Demonstrates the in-app browser call to action and the external browser handoff. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalBrowserHandoff, OpenInBrowserCta } from "beez-ui";

/** Long enough to explore the handoff without being redirected while reviewing it. */
const STORY_COUNTDOWN_SECONDS = 30;

const meta = {
  title: "Components/InAppBrowser",
  args: { isIos: true },
  argTypes: { isIos: { control: "boolean" } },
  parameters: { controls: { include: ["isIos"] } },
  render: ({ isIos }) => <OpenInBrowserCta url="https://example.com/ingresar" isIos={isIos} />,
} satisfies Meta<{ isIos: boolean }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Handoff: Story = {
  render: () => (
    <ExternalBrowserHandoff
      externalBrowserUrl="x-safari-https://example.com/grupo"
      fallbackUrl="#continuar"
      countdownSeconds={STORY_COUNTDOWN_SECONDS}
      onFallback={() => {}}
      copy={{ eyebrow: "Suscripción pendiente" }}
    />
  ),
};
