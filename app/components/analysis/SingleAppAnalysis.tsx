import { Card, Button, Spinner } from "flowbite-react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { AppInput } from "~/components/common/AppInput";
import { DateRangeSelector } from "~/components/common/DateRangeSelector";

interface SingleAppAnalysisProps {
  appInput: { id: number; value: string; error: string };
  onInputChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onAddApp: () => void;  // Add this prop
}

export function SingleAppAnalysis({ 
  appInput,
  onInputChange,
  dateRange,
  onDateRangeChange,
  onAnalyze,
  isAnalyzing,
  onAddApp     // Add this prop
}: SingleAppAnalysisProps) {
  return (
    <Card className="w-full shadow-sm rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Play Store Comment Analysis
        </h2>
      </div>

      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <AppInput
            id={`app-${appInput.id}`}
            label="Primary App"
            value={appInput.value}
            error={appInput.error}
            onChange={onInputChange}
            placeholder="e.g., com.example.app"
            showHelper={true}
          />
          
          <div className="flex items-center mt-[30px]">
            <Button
              onClick={onAddApp}
              className="!h-[42px] !w-[42px] !p-0 !text-gray-500 !bg-gray-50 !rounded-full hover:!text-gray-700 hover:!bg-gray-100 dark:!bg-gray-800 dark:!text-gray-400 dark:hover:!text-gray-300 dark:hover:!bg-gray-700 !focus:outline-none !focus:ring-2 !focus:ring-gray-200 dark:!focus:ring-gray-700 !transition-all !duration-150 !ease-in-out !flex !items-center !justify-center"
            >
              <PlusIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <DateRangeSelector
          value={dateRange}
          onChange={onDateRangeChange}
        />

        <Button 
          gradientDuoTone="cyanToBlue"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="w-full h-10 font-medium transition-all shadow-md hover:shadow-lg"
        >
          {isAnalyzing ? (
            <>
              <Spinner size="sm" className="mr-3" />
              Analyzing Comments...
            </>
          ) : (
            "Analyze Comments"
          )}
        </Button>
      </div>
    </Card>
  );
}
