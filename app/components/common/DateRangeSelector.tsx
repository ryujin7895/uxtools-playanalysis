import { Select } from "flowbite-react";

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DATE_RANGE_PRESETS = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
  { label: "Custom range", value: "custom" }
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div>
      <label htmlFor="dateRange" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        Date Range
      </label>
      <Select
        id="dateRange"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full"
      >
        {DATE_RANGE_PRESETS.map(preset => (
          <option key={preset.value} value={preset.value}>
            {preset.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
