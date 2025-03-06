import { Dropdown, Label } from "flowbite-react";

const DATE_RANGE_PRESETS = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
  { label: "Custom range", value: "custom" }
];

interface DateRangeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label value="Date Range" className="text-sm font-medium" />
      <div className="relative max-w-[240px]"> {/* Added max-width container */}
        <Dropdown 
          label={DATE_RANGE_PRESETS.find(p => p.value === value)?.label || "Select date range"}
          dismissOnClick={true}
          color="light"
          className="w-full [&>button]:!bg-gray-50 [&>button]:dark:!bg-gray-700 [&>button]:!border-gray-300 [&>button]:dark:!border-gray-600 [&>button]:hover:!bg-gray-100 [&>button]:dark:hover:!bg-gray-600 [&>button]:focus:!ring-4 [&>button]:focus:!ring-blue-300 [&>button]:dark:focus:!ring-blue-800"
        >
          <div className="py-1">
            {DATE_RANGE_PRESETS.map((preset) => (
              <Dropdown.Item 
                key={preset.value}
                onClick={() => onChange(preset.value)}
                className={`whitespace-nowrap ${value === preset.value ? "!bg-gray-100 dark:!bg-gray-600" : ""}`}
              >
                {preset.label}
              </Dropdown.Item>
            ))}
          </div>
        </Dropdown>
      </div>
    </div>
  );
}
