/** Demonstrates HoverCard as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Avatar,
  AvatarFallback,
} from "beez-ui";

/** Editable inputs specific to this example. */
type Args = {
  name: string;
  bio: string;
  openDelay: number;
  closeDelay: number;
  side: "top" | "bottom";
};
const meta = {
  title: "Components/HoverCard",
  args: {
    name: "Guido",
    bio: "Construye componentes reutilizables.",
    openDelay: 200,
    closeDelay: 150,
    side: "bottom",
  },
  argTypes: {
    name: {
      control: "text",
    },
    bio: {
      control: "text",
    },
    openDelay: {
      control: {
        type: "range",
        min: 0,
        max: 1000,
        step: 50,
      },
    },
    closeDelay: {
      control: {
        type: "range",
        min: 0,
        max: 1000,
        step: 50,
      },
    },
    side: {
      control: "select",
      options: ["top", "bottom"],
    },
  },
  parameters: {
    controls: { include: ["name", "bio", "openDelay", "closeDelay", "side"] },
  },
  render: ({ name, bio, openDelay, closeDelay, side }) => (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <Button variant="link">@{name}</Button>
      </HoverCardTrigger>
      <HoverCardContent side={side}>
        <div className="StoryRow">
          <Avatar>
            <AvatarFallback>GH</AvatarFallback>
          </Avatar>
          <div>
            <strong>{name}</strong>
            <p>{bio}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
