/** Verifies saving, applying, editing and deleting filter presets through real popovers and the filter bar. */
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  FilterPresetSaveButton,
  FilterPresetsBar,
  FilterQueryBar,
  TooltipProvider,
  parseFilterPresets,
  type FilterPreset,
  type FilterQualifierConfig,
} from "beez-ui";

const QUERY_FILTER_CONFIGS: FilterQualifierConfig[] = [
  { key: "", kind: "text", label: "Descripción" },
  { key: "total", kind: "numberRange", label: "Total" },
];

/** Owns the presets and the current query like an application would. */
function PresetsHarness({ initialPresets = [] }: { initialPresets?: FilterPreset[] }) {
  const [presets, setPresets] = useState<FilterPreset[]>(initialPresets);
  const [query, setQuery] = useState("");

  return (
    <TooltipProvider>
      <FilterQueryBar ariaLabel="Filtrar gastos" configs={QUERY_FILTER_CONFIGS} onValueChange={setQuery} value={query} />
      <FilterPresetSaveButton
        canSaveCurrentQuery={query.trim().length > 0}
        onSaveCurrentQuery={(presetName) => {
          if (!query.trim()) return false;
          setPresets([...presets.filter((preset) => preset.name !== presetName), { name: presetName, query: query.trim() }]);
          return true;
        }}
      />
      <FilterPresetsBar
        presets={presets}
        queryFilterConfigs={QUERY_FILTER_CONFIGS}
        onApplyPreset={(preset) => setQuery(preset.query)}
        onDeletePreset={(presetName) => setPresets(presets.filter((preset) => preset.name !== presetName))}
        onUpdatePreset={({ name, originalName, query: presetQuery }) =>
          setPresets(presets.map((preset) => (preset.name === originalName ? { name, query: presetQuery } : preset)))
        }
      />
    </TooltipProvider>
  );
}

describe("FilterPresetSaveButton", () => {
  it("disables saving while the filter bar is empty", () => {
    render(<PresetsHarness />);

    expect(screen.getByRole("button", { name: "Guardar filtro" })).toBeDisabled();
  });

  it("saves the current query as a named preset chip", async () => {
    const user = userEvent.setup();
    render(<PresetsHarness />);

    await user.type(screen.getByRole("combobox", { name: "Filtrar gastos" }), "Internet");
    await user.click(screen.getByRole("button", { name: "Guardar filtro" }));
    await user.click(await screen.findByRole("button", { name: "Guardar filtro con nombre" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresá un nombre para el filtro.");

    await user.type(screen.getByLabelText("Nombre del filtro"), "Solo Internet{Enter}");

    expect(await screen.findByRole("button", { name: "Aplicar filtro guardado Solo Internet" })).toHaveAttribute("title", "Internet");
  });
});

describe("FilterPresetsBar", () => {
  it("renders nothing without presets", () => {
    const { container } = render(
      <FilterPresetsBar presets={[]} queryFilterConfigs={QUERY_FILTER_CONFIGS} onApplyPreset={() => {}} onDeletePreset={() => {}} onUpdatePreset={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("applies a saved preset with one click", async () => {
    const user = userEvent.setup();
    render(<PresetsHarness initialPresets={[{ name: "Grandes", query: "total:>1000" }]} />);

    await user.click(screen.getByRole("button", { name: "Aplicar filtro guardado Grandes" }));

    expect(screen.getByRole("combobox", { name: "Filtrar gastos" })).toHaveValue("total:>1000");
  });

  it("edits the name and query of a saved preset", async () => {
    const user = userEvent.setup();
    render(<PresetsHarness initialPresets={[{ name: "Solo Internet", query: "Internet" }]} />);

    await user.click(screen.getByRole("button", { name: "Editar filtro guardado Solo Internet" }));
    const nameInput = await screen.findByLabelText("Nombre del filtro");
    const queryInput = screen.getByRole("combobox", { name: "Búsqueda del filtro" });
    expect(nameInput).toHaveValue("Solo Internet");
    expect(queryInput).toHaveValue("Internet");

    await user.clear(nameInput);
    await user.type(nameInput, "Solo Luz");
    await user.clear(queryInput);
    await user.type(queryInput, "Luz");
    await user.click(screen.getByRole("button", { name: "Guardar cambios del filtro" }));

    const renamedPreset = await screen.findByRole("button", { name: "Aplicar filtro guardado Solo Luz" });
    expect(renamedPreset).toHaveAttribute("title", "Luz");
    expect(screen.queryByRole("button", { name: "Aplicar filtro guardado Solo Internet" })).not.toBeInTheDocument();
  });

  it("offers the filter bar suggestions inside the query editor without closing it", async () => {
    const user = userEvent.setup();
    render(<PresetsHarness initialPresets={[{ name: "Solo Internet", query: "Internet" }]} />);

    await user.click(screen.getByRole("button", { name: "Editar filtro guardado Solo Internet" }));
    const queryInput = await screen.findByRole("combobox", { name: "Búsqueda del filtro" });
    await user.clear(queryInput);
    await user.type(queryInput, "tot");
    expect(await screen.findByRole("option", { name: "Total" })).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(queryInput).toHaveValue("total:");
    expect(screen.getByLabelText("Nombre del filtro")).toBeInTheDocument();
  });

  it("rejects renaming a preset to another existing preset name", async () => {
    const user = userEvent.setup();
    render(
      <PresetsHarness
        initialPresets={[
          { name: "Luz", query: "Luz" },
          { name: "Internet", query: "Internet" },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Editar filtro guardado Internet" }));
    const nameInput = await screen.findByLabelText("Nombre del filtro");
    await user.clear(nameInput);
    await user.type(nameInput, "Luz");
    await user.click(screen.getByRole("button", { name: "Guardar cambios del filtro" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un filtro con ese nombre.");
    expect(screen.getByRole("button", { name: "Aplicar filtro guardado Internet" })).toBeInTheDocument();
  });

  it("deletes a preset only after confirming and keeps it when cancelled", async () => {
    const user = userEvent.setup();
    render(<PresetsHarness initialPresets={[{ name: "Grandes", query: "total:>1000" }]} />);

    await user.click(screen.getByRole("button", { name: "Eliminar filtro guardado Grandes" }));
    const confirmation = await screen.findByRole("dialog");
    expect(confirmation).toHaveTextContent('¿Querés eliminar el filtro guardado "Grandes"?');
    await user.click(within(confirmation).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Aplicar filtro guardado Grandes" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar filtro guardado Grandes" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Aplicar filtro guardado Grandes" })).not.toBeInTheDocument());
  });
});

describe("parseFilterPresets", () => {
  it("keeps valid presets trimmed and drops malformed entries", () => {
    expect(
      parseFilterPresets([
        { name: " Luz ", query: " Luz " },
        { name: "", query: "vacío" },
        { name: "Sin query", query: "   " },
        { name: 1, query: "x" },
        null,
      ]),
    ).toEqual([{ name: "Luz", query: "Luz" }]);
    expect(parseFilterPresets({ name: "no es lista" })).toEqual([]);
  });
});
