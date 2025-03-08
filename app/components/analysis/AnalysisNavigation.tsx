import { ChartPieIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { ViewOption } from '~/types/analysis';
import { Dispatch, SetStateAction } from 'react';

interface AnalysisNavigationProps {
  currentView: string;
  setCurrentView: Dispatch<SetStateAction<string>>;
}

export function AnalysisNavigation({ currentView, setCurrentView }: AnalysisNavigationProps) {
  const viewOptions: ViewOption[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <ChartPieIcon className="w-4 h-4" />
    },
    {
      id: "comments",
      label: "Recent Comments",
      icon: <ChatBubbleLeftIcon className="w-4 h-4" />
    }
  ];

  return (
    <div className="flex items-center space-x-2 mb-4">
      {viewOptions.map((option) => (
        <div
          key={option.id}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg cursor-pointer ${
            currentView === option.id
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
          onClick={() => setCurrentView(option.id)}
        >
          <span className="mr-1.5">{option.icon}</span>
          {option.label}
        </div>
      ))}
    </div>
  );
}
