/** Demonstrates FilterQueryBar with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterQueryBar } from "beez-ui";
import { useArgs } from "storybook/preview-api";
import { FILTER_CONFIGS } from "./table-data.js";
/** Editable inputs specific to this example. */
type Args = { value: string; placeholder: string };
const meta = {
  title: "Components/FilterQueryBar",
  args: {
    value: "",
    placeholder: "Filtrar por concepto, importe o estado",
  },
  argTypes: {
    value: {
      control: "text",
    },
    placeholder: {
      control: "text",
    },
  },
  parameters: { controls: { include: ["value", "placeholder"] } },
  render: function Render(args) {
    const [, updateArgs] = useArgs<Args>();
    return (
      <div className="StoryStack">
        <FilterQueryBar
          configs={FILTER_CONFIGS}
          value={args.value}
          onValueChange={(value) => updateArgs({ value })}
          placeholder={args.placeholder}
          ariaLabel="Filtrar movimientos"
        />
        <output className="StoryOutput">
          Consulta: {args.value || "Sin filtros"}
        </output>
      </div>
    );
  },
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
