/** Defines filter values shared by the pure grammar and table UI. */
type PresenceFilterValue = "hasValue" | "noValue";

/**
 * Modos de un filtro de rango de año-mes:
 * - `hasValue` / `noValue`: presencia (con fechas / sin fechas).
 * - `range`: acota por cota inferior y superior.
 * - `from`: solo cota inferior.
 * - `to`: solo cota superior.
 */
type YearMonthRangeFilterMode = "hasValue" | "noValue" | "range" | "from" | "to";

export type DataTableColumnFilterValue =
  | {
      kind: "numberRange";
      max?: number;
      min?: number;
    }
  | {
      kind: "enum";
      value: string;
    }
  | {
      kind: "presence";
      value: PresenceFilterValue;
    }
  | {
      kind: "yearMonthRange";
      mode: YearMonthRangeFilterMode;
      max?: number;
      min?: number;
    };

