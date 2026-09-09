/** Shares stable example records between the table, data table and query stories. */
import type { ColumnDef } from "@tanstack/react-table";
import type { FilterQualifierConfig } from "beez-ui";

export const ROWS = [
  { id: "1", name: "Internet", status: "Pendiente", amount: 15000 },
  { id: "2", name: "Alquiler", status: "Pagado", amount: 250000 },
  { id: "3", name: "Servicios", status: "Pendiente", amount: 32000 },
  { id: "4", name: "Seguro", status: "Pagado", amount: 18000 },
  { id: "5", name: "Transporte", status: "Pendiente", amount: 22000 },
];

export const COLUMNS: ColumnDef<(typeof ROWS)[number]>[] = [
  { accessorKey: "name", header: "Concepto" },
  { accessorKey: "status", header: "Estado" },
  { accessorKey: "amount", header: "Importe" },
];

export const FILTER_CONFIGS: FilterQualifierConfig[] = [
  { key: "", kind: "text", label: "Concepto" },
  { key: "importe", kind: "numberRange", columnId: "amount", label: "Importe" },
  {
    key: "estado",
    kind: "enum",
    columnId: "status",
    label: "Estado",
    options: [
      { slug: "pagado", value: "Pagado", label: "Pagado" },
      { slug: "pendiente", value: "Pendiente", label: "Pendiente" },
    ],
  },
];
