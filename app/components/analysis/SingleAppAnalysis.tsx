import { Card, Button, Spinner } from "flowbite-react";
import { PlusIcon } from '@heroicons/react/24/outline';
import { AppInput } from "~/components/common/AppInput";
import { DateRangeSelector } from "~/components/common/DateRangeSelector";
import { Form, useActionData } from "@remix-run/react";

interface SingleAppAnalysisProps {
  appInput: { id: number; value: string; error: string };
  onInputChange: (value: string) => void;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  isAnalyzing: boolean;
}

export function SingleAppAnalysis({ 
  appInput,
  onInputChange,
  dateRange,
  onDateRangeChange,
  isAnalyzing
}: SingleAppAnalysisProps) {
  const actionData = useActionData<{ success: boolean; error?: string }>();

  return (
    <Card className="w-full shadow-sm rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Play Store Comment Analysis
        </h2>
      </div>

      <Form method="post" className="space-y-6">
        <div className="flex items-start gap-4">
          <AppInput
            id={`app-${appInput.id}`}
            name="appIds[]"
            label="Primary App"
            value={appInput.value}
            error={appInput.error || (actionData?.error ?? '')}
            onChange={onInputChange}
            placeholder="e.g., com.example.app"
            showHelper={true}
          />
        </div>

        <input type="hidden" name="dateRange" value={dateRange} />
        <DateRangeSelector
          value={dateRange}
          onChange={onDateRangeChange}
        />

        <Button 
          type="submit"
          gradientDuoTone="cyanToBlue"
          disabled={isAnalyzing || !appInput.value || !!appInput.error}
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

        {isAnalyzing && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Fetching reviews in multiple languages to provide comprehensive analysis. This may take a minute...
          </p>
        )}

        {actionData?.error && !appInput.error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-500">
            {actionData.error}
          </p>
        )}
      </Form>
    </Card>
  );
}
