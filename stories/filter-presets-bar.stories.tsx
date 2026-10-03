/** Demonstrates saved filter presets next to FilterQueryBar, with the presets owned by the example. */
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FilterPresetSaveButton, FilterPresetsBar, FilterQueryBar, type FilterPreset, type FilterQualifierConfig } from "@guidomodarelli/beez-ui";

const QUERY_FILTER_CONFIGS: FilterQualifierConfig[] = [
  { key: "", kind: "text", label: "Descripción" },
  { key: "total", kind: "numberRange", label: "Total" },
];
const INITIAL_PRESETS: FilterPreset[] = [
  { name: "Grandes", query: "total:>1000" },
  { name: "Solo Internet", query: "Internet" },
];

/** Keeps the presets in memory, where an application would persist them. */
function FilterPresetsExample() {
  const [presets, setPresets] = useState(INITIAL_PRESETS);
  const [query, setQuery] = useState("");

  return (
    <div className="grid max-w-xl gap-3">
      <div className="flex items-center gap-2">
        <FilterQueryBar ariaLabel="Filtrar gastos" configs={QUERY_FILTER_CONFIGS} onValueChange={setQuery} value={query} />
        <FilterPresetSaveButton
          canSaveCurrentQuery={query.trim().length > 0}
          onSaveCurrentQuery={(presetName) => {
            if (!query.trim()) return false;
            setPresets([...presets.filter((preset) => preset.name !== presetName), { name: presetName, query: query.trim() }]);
            return true;
          }}
        />
      </div>
      <FilterPresetsBar
        presets={presets}
        queryFilterConfigs={QUERY_FILTER_CONFIGS}
        onApplyPreset={(preset) => setQuery(preset.query)}
        onDeletePreset={(presetName) => setPresets(presets.filter((preset) => preset.name !== presetName))}
        onUpdatePreset={({ name, originalName, query: presetQuery }) =>
          setPresets(presets.map((preset) => (preset.name === originalName ? { name, query: presetQuery } : preset)))
        }
      />
    </div>
  );
}

const meta = {
  title: "Components/FilterPresetsBar",
  render: () => <FilterPresetsExample />,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
