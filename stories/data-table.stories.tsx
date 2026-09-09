/** Demonstrates DataTable with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "beez-ui";
import { COLUMNS, FILTER_CONFIGS, type ROWS } from "./table-data.js";
/** Editable inputs specific to this example. */
type Args = {
  data: typeof ROWS;
  emptyMessage: string;
  showColumnVisibilityToggle: boolean;
  queryFilters: boolean;
};
const meta = {
  title: "Components/DataTable",
  args: {
    data: [
      {
        id: "1",
        name: "Internet",
        status: "Pendiente",
        amount: 15000,
      },
      {
        id: "2",
        name: "Alquiler",
        status: "Pagado",
        amount: 250000,
      },
      {
        id: "3",
        name: "Servicios",
        status: "Pendiente",
        amount: 32000,
      },
    ],
    emptyMessage: "No hay registros para estos filtros.",
    showColumnVisibilityToggle: true,
    queryFilters: true,
  },
  argTypes: {
    data: {
      control: "object",
    },
    emptyMessage: {
      control: "text",
    },
    showColumnVisibilityToggle: {
      control: "boolean",
    },
    queryFilters: {
      control: "boolean",
    },
  },
  parameters: {
    controls: {
      include: [
        "data",
        "emptyMessage",
        "showColumnVisibilityToggle",
        "queryFilters",
      ],
    },
  },
  render: ({
    data,
    emptyMessage,
    showColumnVisibilityToggle,
    queryFilters,
  }) => (
    <DataTable
      columns={COLUMNS}
      data={data}
      emptyMessage={emptyMessage}
      filterColumnId="name"
      filterLabel="Buscar concepto"
      showColumnVisibilityToggle={showColumnVisibilityToggle}
      queryFilterConfig={queryFilters ? FILTER_CONFIGS : undefined}
      queryFilterLabel="Filtrar movimientos"
    />
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
