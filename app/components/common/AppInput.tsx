import { Label } from "flowbite-react";

interface AppInputProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  error: string;
  onChange: (value: string) => void;
  placeholder: string;
  showHelper?: boolean;
}

export function AppInput({
  id,
  name,
  label,
  value,
  error,
  onChange,
  placeholder,
  showHelper = false
}: AppInputProps) {
  return (
    <div className="flex-1">
      <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        className={`bg-gray-50 border text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white focus:ring-2 transition-all ${
          error
            ? 'border-red-500 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-200 dark:focus:ring-blue-800'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
      {showHelper && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Enter either an app ID (e.g., com.example.app) or a Play Store URL
        </p>
      )}
    </div>
  );
}
