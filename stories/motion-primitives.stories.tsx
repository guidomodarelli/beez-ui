/** Demonstrates the public motion primitives through interactive examples. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatePresence } from "motion/react";
import { AnimatedCollapse, AnimatedCount, AnimatedListItem, Button, PresenceSwap } from "@guidomodarelli/beez-ui";

const MEMBER_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elena"];

/** Combines the four primitives the way product surfaces use them. */
function MotionPrimitivesExample() {
  const [count, setCount] = useState(3);
  const [isOpen, setIsOpen] = useState(false);
  const [members, setMembers] = useState(MEMBER_NAMES.slice(0, 2));
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="grid max-w-md gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setCount(count - 1)}>
          Restar
        </Button>
        <output aria-label="Contador" className="text-lg font-semibold">
          <AnimatedCount value={count} />
        </output>
        <Button variant="outline" size="sm" onClick={() => setCount(count + 1)}>
          Sumar
        </Button>
      </div>
      <div className="grid gap-2">
        <Button variant="outline" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
          Detalles
        </Button>
        <AnimatedCollapse isOpen={isOpen}>
          <p className="rounded-lg bg-muted p-3 text-sm">Contenido que se expande y colapsa.</p>
        </AnimatedCollapse>
      </div>
      <div className="grid gap-2">
        <div className="flex gap-2">
          <Button size="sm" disabled={members.length === MEMBER_NAMES.length} onClick={() => setMembers(MEMBER_NAMES.slice(0, members.length + 1))}>
            Agregar
          </Button>
          <Button size="sm" variant="outline" disabled={members.length === 0} onClick={() => setMembers(members.slice(1))}>
            Quitar primero
          </Button>
        </div>
        <ul aria-label="Miembros" className="m-0 grid list-none gap-1 p-0">
          <AnimatePresence initial={false}>
            {members.map((member) => (
              <AnimatedListItem key={member} className="rounded-md border border-border px-3 py-2 text-sm">
                {member}
              </AnimatedListItem>
            ))}
          </AnimatePresence>
        </ul>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setIsSaved(!isSaved)}>
          Alternar estado
        </Button>
        <PresenceSwap presenceKey={isSaved ? "saved" : "idle"}>
          <p className="m-0 text-sm">{isSaved ? "Cambios guardados" : "Sin cambios"}</p>
        </PresenceSwap>
      </div>
    </div>
  );
}

const meta = {
  title: "Motion/Primitives",
  render: () => <MotionPrimitivesExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
