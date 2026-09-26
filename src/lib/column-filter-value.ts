/** Provides server-safe matching of table cells against the query grammar's filter values. */
import type { DataTableColumnFilterValue } from "../types/data-table.js";
import { matchesAdvancedYearMonthRangeFilter } from "./year-month-filter.js";

const DIACRITICS_PATTERN = /[̀-ͯ]/g;

/** Normalizes text for accent- and case-insensitive comparisons. */
export function normalizeFilterToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLocaleLowerCase()
    .trim();
}

/** Distinguishes the grammar's structured values from plain text written by the search input. */
function isColumnFilterValue(value: unknown): value is DataTableColumnFilterValue {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { kind?: unknown }).kind === "string"
  );
}

/** Reads numbers and numeric strings; anything else has no comparable value. */
function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Treats `null`, `undefined`, blank strings and empty lists as a missing value. */
function isMissingValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Evalúa el valor de una celda contra un filtro de columna de la barra de filtros.
 * Entiende los valores estructurados (`numberRange`, `enum`, `presence`, `yearMonthRange`)
 * y, para texto plano, busca coincidencias parciales sin distinguir acentos ni mayúsculas.
 * Una celda sin valor comparable no cumple los rangos; un filtro vacío deja pasar la fila.
 * @param cellValue - Valor de la celda tal como lo devuelve el accessor de la columna.
 * @param filterValue - Valor activo del filtro de esa columna.
 * @returns `true` cuando la fila debe mostrarse.
 */
export function matchesColumnFilterValue(cellValue: unknown, filterValue: unknown): boolean {
  if (!isColumnFilterValue(filterValue)) {
    const query = normalizeFilterToken(String(filterValue ?? ""));
    return query === "" || normalizeFilterToken(String(cellValue ?? "")).includes(query);
  }

  switch (filterValue.kind) {
    case "numberRange": {
      const value = toFiniteNumber(cellValue);
      if (value == null) return false;
      if (filterValue.min != null && value < filterValue.min) return false;
      return filterValue.max == null || value <= filterValue.max;
    }
    case "enum":
      return Array.isArray(cellValue)
        ? cellValue.some((item) => String(item) === filterValue.value)
        : String(cellValue ?? "") === filterValue.value;
    case "presence":
      return filterValue.value === "hasValue"
        ? !isMissingValue(cellValue)
        : isMissingValue(cellValue);
    case "yearMonthRange":
      return matchesAdvancedYearMonthRangeFilter(filterValue, toFiniteNumber(cellValue));
  }
}
