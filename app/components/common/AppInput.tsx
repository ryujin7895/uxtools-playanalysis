import { Label } from "flowbite-react";

interface AppInputProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showHelper?: boolean;
}

export function AppInput({ id, label, value, error, onChange, placeholder, showHelper = false }: AppInputProps) {
  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-2">
        <Label 
          htmlFor={id}
          className="text-sm font-medium text-gray-900 dark:text-white"
          value={label}
        />
      </div>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}
        aria-describedby={`helper-text-${id}`}
      />
      {(showHelper || error) && (
        <p id={`helper-text-${id}`} className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error || "Enter App ID or Play Store URL"}
        </p>
      )}
    </div>
  );
}
