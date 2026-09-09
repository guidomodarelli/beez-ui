/** Demonstrates Tabs as a complete, interactive composition. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "beez-ui";
import { useArgs } from "storybook/preview-api";
/** Editable inputs specific to this example. */
type Args = {
  value: string;
  orientation: "horizontal" | "vertical";
  variant: "default" | "line";
  disabledSecond: boolean;
};
const meta = {
  title: "Components/Tabs",
  args: {
    value: "overview",
    orientation: "horizontal",
    variant: "default",
    disabledSecond: false,
  },
  argTypes: {
    value: {
      control: "select",
      options: ["overview", "activity"],
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
    variant: {
      control: "select",
      options: ["default", "line"],
    },
    disabledSecond: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: ["value", "orientation", "variant", "disabledSecond"],
    },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <Tabs
        value={args.value}
        orientation={args.orientation}
        onValueChange={(value) => updateArgs({ value })}
      >
        <TabsList variant={args.variant} aria-label="Secciones">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="activity" disabled={args.disabledSecond}>
            Actividad
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Resumen de la cuenta.</TabsContent>
        <TabsContent value="activity">
          Últimos movimientos de la cuenta.
        </TabsContent>
      </Tabs>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
