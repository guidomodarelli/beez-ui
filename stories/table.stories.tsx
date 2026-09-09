/** Demonstrates Table with editable content and real interactions. */
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from "beez-ui";
import { ROWS } from "./table-data.js";
/** Editable inputs specific to this example. */
type Args = { caption: string; rowCount: number; showFooter: boolean };
const meta = {
  title: "Components/Table",
  args: {
    caption: "Movimientos recientes",
    rowCount: 3,
    showFooter: true,
  },
  argTypes: {
    caption: {
      control: "text",
    },
    rowCount: {
      control: {
        type: "range",
        min: 0,
        max: 5,
        step: 1,
      },
    },
    showFooter: {
      control: "boolean",
    },
  },
  parameters: { controls: { include: ["caption", "rowCount", "showFooter"] } },
  render: ({ caption, rowCount, showFooter }) => (
    <Table>
      <TableCaption>{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Concepto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Importe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.slice(0, rowCount).map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.status}</TableCell>
            <TableCell>{row.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {showFooter && (
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>
              {ROWS.slice(0, rowCount).reduce(
                (sum, row) => sum + row.amount,
                0,
              )}
            </TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  ),
} satisfies Meta<Args>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
