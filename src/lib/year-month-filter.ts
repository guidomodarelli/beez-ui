/** Provides server-safe month parsing and matching for table filters. */
import type { DataTableColumnFilterValue } from "../types/data-table";

const YEAR_MONTH_INPUT_PATTERN = /^(0[1-9]|1[0-2])\/(\d{4})$/;

/**
 * Parsea un texto `MM/AAAA` a su valor numérico comparable `AAAAMM`
 * (por ejemplo `06/2026` → `202606`). Devuelve `null` cuando el texto no es
 * un mes-año válido.
 */
export function parseYearMonthFilterInput(value: string): number | null {
  const match = YEAR_MONTH_INPUT_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const [, month, year] = match;

  return Number(`${year}${month}`);
}

/**
 * Formatea un valor numérico `AAAAMM` de vuelta a `MM/AAAA` para rehidratar
 * los inputs del filtro al reabrir el diálogo.
 */
/**
 * Evalúa un filtro de rango de año-mes contra el valor numérico `AAAAMM` de una
 * fila (`null` cuando la fila no tiene fecha). Devuelve `true` cuando el filtro
 * no aplica, replicando el contrato de los demás matchers de la tabla.
 */
export function matchesAdvancedYearMonthRangeFilter(
  columnFilterValue: unknown,
  value: number | null,
): boolean {
  if (
    !columnFilterValue ||
    typeof columnFilterValue !== "object" ||
    (columnFilterValue as DataTableColumnFilterValue).kind !== "yearMonthRange"
  ) {
    return true;
  }

  const filterValue = columnFilterValue as Extract<
    DataTableColumnFilterValue,
    { kind: "yearMonthRange" }
  >;
  const hasValue = value != null && Number.isFinite(value);

  if (filterValue.mode === "hasValue") {
    return hasValue;
  }

  if (filterValue.mode === "noValue") {
    return !hasValue;
  }

  if (!hasValue) {
    return false;
  }

  if (filterValue.min != null && (value as number) < filterValue.min) {
    return false;
  }

  if (filterValue.max != null && (value as number) > filterValue.max) {
    return false;
  }

  return true;
}

