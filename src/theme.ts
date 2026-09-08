/** Defines controlled theme values without owning persistence or framework state. */
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = Exclude<ThemeMode, "system">;
