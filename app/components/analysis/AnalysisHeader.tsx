import { Button, Badge } from "flowbite-react";
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { ReactNode } from "react";

export interface AnalysisHeaderProps {
  title: string;
  icon?: ReactNode;
  date?: Date;
  appCount: number;
  totalComments: number;
  isComparisonMode?: boolean;
  onReset: () => void;
  actions?: ReactNode; // Additional action buttons can be passed here
}

export function AnalysisHeader({
  title = "Analysis Results",
  icon = <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />,
  date = new Date(),
  appCount,
  totalComments,
  isComparisonMode = false,
  onReset,
  actions
}: AnalysisHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
            {icon}
            {title}
            {isComparisonMode && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Comparison Mode
              </span>
            )}
          </h2>
          <div className="flex items-center mt-2 space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{date.toLocaleDateString()}</span>
            <span>•</span>
            <Badge color="gray" className="px-2.5 py-0.5">
              {appCount} {appCount > 1 ? 'apps' : 'app'}
            </Badge>
            <span>•</span>
            <span>{totalComments} comments analyzed</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {actions}
          <Button color="light" onClick={onReset} className="flex items-center shadow-sm hover:shadow transition-shadow">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
