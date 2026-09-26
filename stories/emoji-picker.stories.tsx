/** Demonstrates EmojiPicker from the optional beez-ui/emoji-picker entrypoint. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmojiPicker } from "beez-ui/emoji-picker";

/** Owns the chosen emoji like a consumer would. */
function EmojiPickerExample({ label }: { label: string }) {
  const [emoji, setEmoji] = useState("🎉");
  return <EmojiPicker label={label} value={emoji} onChange={setEmoji} />;
}

const meta = {
  title: "Components/EmojiPicker",
  args: { label: "Ícono del canal" },
  argTypes: { label: { control: "text" } },
  parameters: { controls: { include: ["label"] } },
  render: ({ label }) => <EmojiPickerExample label={label} />,
} satisfies Meta<{ label: string }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
