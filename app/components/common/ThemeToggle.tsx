import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme, Theme } from "~/utils/themeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK);
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#18181B] shadow-sm border-2 border-gray-200 dark:border-[#27272A] transition-all duration-150 hover:scale-110 active:scale-95"
      aria-label="Toggle dark mode"
    >
      {theme === Theme.DARK ? (
        <SunIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      ) : (
        <MoonIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
}
