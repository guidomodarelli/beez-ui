/** Demonstrates ConfirmDeleteButton through its public component contract. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConfirmDeleteButton, DropdownMenuItem } from "beez-ui";

/** Tracks the last action so the confirmation result is visible. */
function ConfirmDeleteExample({ message }: { message: string }) {
  const [lastAction, setLastAction] = useState("Ninguna");

  return (
    <div className="flex items-center gap-4">
      <ConfirmDeleteButton
        message={message}
        onConfirm={() => setLastAction("Eliminado")}
        extraMenuItems={<DropdownMenuItem onSelect={() => setLastAction("Editar")}>Editar</DropdownMenuItem>}
      />
      <output aria-label="Última acción">{lastAction}</output>
    </div>
  );
}

const meta = {
  title: "Components/ConfirmDeleteButton",
  args: { message: "¿Eliminar el gasto Luz?" },
  argTypes: { message: { control: "text" } },
  parameters: { controls: { include: ["message"] } },
  render: ({ message }) => <ConfirmDeleteExample message={message} />,
} satisfies Meta<{ message: string }>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
