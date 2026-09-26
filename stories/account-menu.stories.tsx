/** Demonstrates AccountMenu through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountMenu, type AccountMenuStatus } from "beez-ui";

/** Editable inputs specific to this example. */
type Args = { name: string; email: string; triggerVariant: "avatar" | "sidebar"; showStatusBadge: boolean };

/** Owns the session status so signing in and out is visible. */
function AccountMenuExample(args: Args) {
  const [status, setStatus] = useState<AccountMenuStatus>("authenticated");

  return (
    <div style={{ maxWidth: "16rem" }}>
      <AccountMenu
        {...args}
        image="/avatar.svg"
        status={status}
        onSignIn={() => setStatus("authenticated")}
        onSignOut={() => setStatus("unauthenticated")}
        tooltipLabel={status === "authenticated" ? args.name : "Sin sesión"}
      />
    </div>
  );
}

const meta = {
  title: "Components/AccountMenu",
  args: { name: "Ana López", email: "ana@example.com", triggerVariant: "avatar", showStatusBadge: true },
  argTypes: {
    name: { control: "text" },
    email: { control: "text" },
    triggerVariant: { control: "select", options: ["avatar", "sidebar"] },
    showStatusBadge: { control: "boolean" },
  },
  parameters: { controls: { include: ["name", "email", "triggerVariant", "showStatusBadge"] } },
  render: (args) => <AccountMenuExample {...args} />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
