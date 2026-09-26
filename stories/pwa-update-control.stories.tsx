/** Documents PwaUpdateControl, which appears only while a service worker update is waiting. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PwaUpdateControl } from "beez-ui";

const meta = {
  title: "Components/PwaUpdateControl",
  render: () => (
    <div className="grid gap-2 text-sm text-muted-foreground">
      <p className="m-0">El control aparece junto a este texto solo cuando hay una versión nueva del service worker esperando.</p>
      <PwaUpdateControl />
    </div>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
