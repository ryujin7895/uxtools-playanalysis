import { Card, Button, Spinner } from "flowbite-react";
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { AppInput } from "~/components/common/AppInput";
import { DateRangeSelector } from "~/components/common/DateRangeSelector";
import { Form, useActionData } from "@remix-run/react";

interface ComparisonAnalysisProps {
  appInputs: Array<{ id: number; value: string; error: string }>;
  onAddApp: () => void;
  onRemoveApp: (id: number) => void;
  onInputChange: (id: number, value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  isAnalyzing: boolean;
}

export function ComparisonAnalysis({
  appInputs,
  onAddApp,
  onRemoveApp,
  onInputChange,
  dateRange,
  onDateRangeChange,
  isAnalyzing
}: ComparisonAnalysisProps) {
  const actionData = useActionData<{ success: boolean; error?: string }>();

  return (
    <Card className="w-full shadow-sm rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          App Comparison Analysis
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
          Comparison Mode
        </span>
      </div>

      <Form method="post" className="space-y-6">
        <div className="space-y-4">
          {appInputs.map((input, index) => (
            <div key={input.id} className="flex items-start gap-4">
              <AppInput
                id={`app-${input.id}`}
                name="appIds[]"
                label={`${index === 0 ? 'Primary' : 'Comparison'} App`}
                value={input.value}
                error={input.error || (actionData?.error ?? '')}
                onChange={(value) => onInputChange(input.id, value)}
                placeholder={index === 0 ? "e.g., com.example.app" : "e.g., com.competitor.app"}
                showHelper={index === 0}
              />
              
              <div className="flex items-center mt-[30px]">
                {index === 0 ? (
                  appInputs.length < 3 && (
                    <Button
                      type="button"
                      onClick={onAddApp}
                      className="!h-[42px] !w-[42px] !p-0 !text-gray-500 !bg-gray-50 !rounded-full hover:!text-gray-700 hover:!bg-gray-100 dark:!bg-gray-800 dark:!text-gray-400 dark:hover:!text-gray-300 dark:hover:!bg-gray-700 !focus:outline-none !focus:ring-2 !focus:ring-gray-200 dark:!focus:ring-gray-700 !transition-all !duration-150 !ease-in-out !flex !items-center !justify-center"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </Button>
                  )
                ) : (
                  <Button
                    type="button"
                    onClick={() => onRemoveApp(input.id)}
                    className="!h-[42px] !w-[42px] !p-0 !text-gray-500 !bg-gray-50 !rounded-full hover:!text-red-600 hover:!bg-red-50 dark:!bg-gray-800 dark:!text-gray-400 dark:hover:!text-red-400 dark:hover:!bg-red-900/30 !focus:outline-none !focus:ring-2 !focus:ring-gray-200 dark:!focus:ring-gray-700 !transition-all !duration-150 !ease-in-out !flex !items-center !justify-center"
                  >
                    <MinusIcon className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <input type="hidden" name="dateRange" value={dateRange} />
        <DateRangeSelector
          value={dateRange}
          onChange={onDateRangeChange}
        />

        <Button 
          type="submit"
          gradientDuoTone="cyanToBlue"
          disabled={isAnalyzing || appInputs.some(input => !input.value || input.error)}
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

        {actionData?.error && !appInputs.some(input => input.error) && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-500">
            {actionData.error}
          </p>
        )}
      </Form>
    </Card>
  );
}
