import type { MetaFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation } from "@remix-run/react";
import { Button, Card, Navbar, Dropdown, TextInput, Label, Tooltip, Spinner } from "flowbite-react";
import { useState, useRef, useEffect } from "react";
import { SunIcon, MoonIcon, PlusIcon, MinusIcon, ChartBarIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTheme, Theme } from "~/utils/themeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SingleAppAnalysis } from "~/components/analysis/SingleAppAnalysis";
import { ComparisonAnalysis } from "~/components/analysis/ComparisonAnalysis";
import { AnalysisResults } from "~/components/analysis/AnalysisResults";
import { ThemeToggle } from "~/components/common/ThemeToggle";
import { PlayStoreService } from "~/services/server/playstore.server";
import type { AnalysisResult } from "~/types/analysis";

export const meta: MetaFunction = () => {
  return [
    { title: "Play Store Analysis Tool" },
    { name: "description", content: "Analyze Play Store comments to extract insights" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  console.log('Action function called');
  const formData = await request.formData();
  const appIds = formData.getAll("appIds[]");
  const dateRange = formData.get("dateRange") as string;

  console.log('Form data:', { appIds, dateRange });

  if (!appIds.length || !dateRange) {
    console.error('Missing required fields');
    return json(
      { success: false, error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    console.log('Starting analysis for apps:', appIds);
    const results = await Promise.all(
      appIds.map(appId => PlayStoreService.fetchComments(appId.toString(), dateRange))
    );
    console.log('Analysis completed successfully');
    return json({ success: true, results });
  } catch (error) {
    console.error('Analysis failed:', error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to analyze comments'
      },
      { status: 500 }
    );
  }
};

// Date range preset options
const DATE_RANGE_PRESETS = [
  { label: "Last 7 days", value: "7days" },
  { label: "Last 30 days", value: "30days" },
  { label: "Last 90 days", value: "90days" },
  { label: "Last year", value: "1year" },
  { label: "All time", value: "all" },
  { label: "Custom range", value: "custom" }
];

export default function Index() {
  const { theme, setTheme } = useTheme();
  const navigation = useNavigation();
  const actionData = useActionData<{ success: boolean; results: AnalysisResult[] }>();
  
  // State for app inputs
  const [appInputs, setAppInputs] = useState([{ id: 1, value: "", error: "" }]);
  const [dateRange, setDateRange] = useState(DATE_RANGE_PRESETS[1].value);
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  // Refs for custom date inputs
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  // Check if we're in comparison mode whenever appInputs changes
  const isComparisonMode = appInputs.length > 1;
  const isAnalyzing = navigation.state === "submitting";

  // Reset form when analysis is complete
  useEffect(() => {
    if (actionData?.success && actionData.results) {
      setAppInputs([{ id: 1, value: "", error: "" }]);
    }
  }, [actionData]);

  // Validate app ID/URL
  const validateAppInput = (value: string) => {
    if (!value.trim()) return "App ID or URL is required";
    
    // Simple validation - either an app ID or a Play Store URL
    const appIdPattern = /^[a-zA-Z0-9._]+$/;
    const urlPattern = /https:\/\/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/;
    
    if (!appIdPattern.test(value) && !urlPattern.test(value)) {
      return "Enter a valid App ID or Play Store URL";
    }
    
    return "";
  };

  // Handle app input change
  const handleAppInputChange = (id: number, value: string) => {
    const error = validateAppInput(value);
    setAppInputs(prev => 
      prev.map(input => 
        input.id === id ? { ...input, value, error } : input
      )
    );
  };

  // Add new app input for comparison (max 3)
  const addAppInput = () => {
    if (appInputs.length < 3) {
      const newId = Math.max(...appInputs.map(i => i.id)) + 1;
      setAppInputs([...appInputs, { id: newId, value: "", error: "" }]);
    }
  };

  // Remove an app input
  const removeAppInput = (id: number) => {
    if (appInputs.length > 1) {
      setAppInputs(appInputs.filter(input => input.id !== id));
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    setAppInputs([{ id: 1, value: "", error: "" }]);
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    // If custom is selected, focus on the start date input and open date picker
    if (value === 'custom' && startDateRef.current) {
      setIsDatePickerOpen(true);
      setTimeout(() => startDateRef.current?.focus(), 100);
    } else {
      setIsDatePickerOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar fluid className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 px-4 sm:px-6">
        <Navbar.Brand href="#" className="flex items-center">
          <img src="/logo-light.png" className="mr-3 h-8 sm:h-9 dark:hidden" alt="Play Analysis Logo" />
          <img src="/logo-dark.png" className="mr-3 h-8 hidden sm:h-9 dark:block" alt="Play Analysis Logo" />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            Play Store Analysis
          </span>
        </Navbar.Brand>
        <div className="flex md:order-2">
          <ThemeToggle />
        </div>
      </Navbar>
      
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!actionData?.success ? (
            <motion.div 
              key="console"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              {isComparisonMode ? (
                <ComparisonAnalysis 
                  appInputs={appInputs}
                  onAddApp={addAppInput}
                  onRemoveApp={removeAppInput}
                  onInputChange={handleAppInputChange}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  isAnalyzing={isAnalyzing}
                />
              ) : (
                <SingleAppAnalysis 
                  appInput={appInputs[0]}
                  onInputChange={(value) => handleAppInputChange(appInputs[0].id, value)}
                  dateRange={dateRange}
                  onDateRangeChange={handleDateRangeChange}
                  onAddApp={addAppInput}
                  isAnalyzing={isAnalyzing}
                />
              )}
            </motion.div>
          ) : (
            <AnalysisResults 
              onReset={resetAnalysis}
              appCount={appInputs.length}
              result={Array.isArray(actionData.results) ? actionData.results[0] : actionData.results}
              comparisonResults={Array.isArray(actionData.results) ? actionData.results.slice(1) : undefined}
            />
          )}
        </AnimatePresence>
      </main>
      
      <footer className="bg-white shadow-inner dark:bg-gray-800 mt-8">
        <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
            Play Store Analysis Tool © {new Date().getFullYear()}
          </span>
          <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-gray-500 dark:text-gray-400 sm:mt-0">
            <li>
              <a href="#" className="mr-6 hover:underline hover:text-gray-900 dark:hover:text-white transition-colors">About</a>
            </li>
            <li>
              <a href="#" className="hover:underline hover:text-gray-900 dark:hover:text-white transition-colors">Help</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
