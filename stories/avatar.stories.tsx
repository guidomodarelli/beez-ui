/** Demonstrates Avatar through its public component contract. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  src: string;
  alt: string;
  initials: string;
  size: "default" | "sm" | "lg";
  showBadge: boolean;
};

const meta = {
  title: "Components/Avatar",
  args: {
    src: "avatar.svg",
    alt: "Perfil de ejemplo",
    initials: "GH",
    size: "default",
    showBadge: true,
  },
  argTypes: {
    src: {
      control: "text",
    },
    alt: {
      control: "text",
    },
    initials: {
      control: "text",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    showBadge: {
      control: "boolean",
    },
  },
  parameters: {
    controls: { include: ["src", "alt", "initials", "size", "showBadge"] },
  },
  render: ({ src, alt, initials, size, showBadge }) => (
    <Avatar size={size}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{initials}</AvatarFallback>
      {showBadge && <AvatarBadge aria-label="Disponible" />}
    </Avatar>
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {
  args: {
    showBadge: true,
  },
};
