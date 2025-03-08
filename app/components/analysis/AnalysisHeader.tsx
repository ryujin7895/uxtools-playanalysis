import { Button, Badge, Tooltip } from "flowbite-react";
import { ChartBarIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
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
  description?: string; // Optional description to provide context
}

export function AnalysisHeader({
  title = "Analysis Results",
  icon = <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />,
  date = new Date(),
  appCount,
  totalComments,
  isComparisonMode = false,
  onReset,
  actions,
  description
}: AnalysisHeaderProps) {
  return (
    <header className="flex flex-col space-y-4 mb-6" role="banner" aria-label="Analysis results header">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
            {icon}
            {title}
            {isComparisonMode && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300" 
                    aria-label="Comparison mode active">
                Comparison Mode
              </span>
            )}
            {description && (
              <Tooltip content={description}>
                <InformationCircleIcon className="w-5 h-5 ml-2 text-gray-400 cursor-help" />
              </Tooltip>
            )}
          </h2>
          <div className="flex flex-wrap items-center mt-2 gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span aria-label="Analysis date">{date.toLocaleDateString()}</span>
            <span className="hidden md:inline" aria-hidden="true">•</span>
            <Badge color="info" className="px-2.5 py-0.5">
              <span aria-label={`${appCount} apps analyzed`}>{appCount} {appCount > 1 ? 'apps' : 'app'}</span>
            </Badge>
            <span className="hidden md:inline" aria-hidden="true">•</span>
            <span aria-label={`${totalComments} comments analyzed`}>{totalComments.toLocaleString()} comments analyzed</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {actions}
          <Button 
            color="light" 
            onClick={onReset} 
            className="flex items-center shadow-sm hover:shadow transition-shadow focus:ring-2 focus:ring-blue-300"
            aria-label="Start new analysis">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>
    </header>
  );
}
