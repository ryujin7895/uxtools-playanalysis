import { Card, Button, Badge } from "flowbite-react";
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface AnalysisResultsProps {
  onReset: () => void;
  appCount: number;
}

export function AnalysisResults({ onReset, appCount }: AnalysisResultsProps) {
  return (
    <Card className="w-full shadow-sm rounded-2xl">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Analysis Results
          </h2>
          <Button color="light" onClick={onReset} className="flex items-center shadow-sm hover:shadow transition-shadow">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{new Date().toLocaleDateString()}</span>
          <span>•</span>
          <Badge color="gray" className="px-2.5 py-0.5">
            {appCount} {appCount > 1 ? 'apps' : 'app'}
          </Badge>
        </div>
      </div>

      <div className="h-px bg-gray-200 dark:bg-gray-700 -mx-6 mb-6" />
      
      <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
        <ChartBarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-center">
          Analysis results will appear here
        </p>
      </div>
    </Card>
  );
}
