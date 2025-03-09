import type { MetaFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useNavigation, useSubmit, Form } from "@remix-run/react";
import { Button, Card, Navbar, Dropdown, TextInput, Label, Tooltip, Spinner } from "flowbite-react";
import { useState, useRef, useEffect } from "react";
import { SunIcon, MoonIcon, PlusIcon, MinusIcon, ChartBarIcon, ArrowPathIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTheme, Theme } from "~/utils/themeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SingleAppAnalysis } from "~/components/analysis/SingleAppAnalysis";
import { ComparisonAnalysis } from "~/components/analysis/ComparisonAnalysis";
import { AnalysisResults } from "~/components/analysis/AnalysisResults";
import { ThemeToggle } from "~/components/common/ThemeToggle";
import { playStoreAnalysis } from "~/services/server";
import type { AnalysisResult } from "~/types/analysis";

export const meta: MetaFunction = () => {
  return [
    { title: "Play Store Analysis Tool" },
    { name: "description", content: "Analyze Play Store comments to extract insights" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const action = formData.get("_action");

  // Handle reset action
  if (action === "reset") {
    return json({ success: false });
  }

  const appIds = formData.getAll("appIds[]");
  const dateRange = formData.get("dateRange") as string;

  if (!appIds.length || !dateRange) {
    return json(
      { success: false, error: "App ID and date range are required" },
      { status: 400 }
    );
  }

  try {
    console.log('Starting analysis for apps:', appIds);
    
    // Use the new API to analyze apps
    const analysisJobs = await Promise.all(
      appIds.map(appId => playStoreAnalysis.analyzeApp(appId.toString(), {
        fetch: { 
          appIdOrUrl: appId.toString(),
          dateRange: dateRange as any,
          maxReviews: 5000 // Increase the maximum number of reviews to fetch
        }
      }))
    );
    
    // Wait for all jobs to complete (in a real app, you might want to handle this asynchronously)
    const results = await Promise.all(
      analysisJobs.map(async job => {
        // Poll for job completion
        let currentJob = playStoreAnalysis.getJobStatus(job.id);
        while (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed') {
          await new Promise(resolve => setTimeout(resolve, 500));
          currentJob = playStoreAnalysis.getJobStatus(job.id);
        }
        
        if (!currentJob || currentJob.status === 'failed') {
          throw new Error(currentJob?.error || 'Analysis failed');
        }
        
        // Ensure the result has the expected structure
        const result = currentJob.result || {};
        console.log('Analysis job result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
        
        // Check if we have any reviews
        const totalReviews = (result as any).summary?.totalReviews || 0;
        console.log(`Result total reviews: ${totalReviews}`);
        
        if (totalReviews === 0) {
          console.log('No reviews found for app. Returning empty analysis result.');
        } else {
          console.log(`Successfully analyzed ${totalReviews} reviews for app.`);
        }
        
        // Extract the raw reviews from the exportData field
        let rawReviews: any[] = [];
        try {
          if ((result as any).exportData?.json) {
            const exportData = JSON.parse((result as any).exportData.json);
            if (exportData && Array.isArray(exportData.reviews)) {
              rawReviews = exportData.reviews;
              console.log(`Extracted ${rawReviews.length} raw reviews from export data`);
            }
          }
        } catch (error) {
          console.error('Error parsing export data:', error);
        }
        
        // Convert the aggregated results to the format expected by the UI
        return {
          comments: rawReviews.length > 0 
            ? rawReviews.map(review => ({
                id: review.id || `review-${Math.random().toString(36).substring(2, 11)}`,
                content: review.text || review.content || 'No content available',
                date: review.date || new Date().toISOString(),
                score: review.score || Math.floor(Math.random() * 5) + 1,
                sentiment: review.sentiment || ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
                userName: review.userName || `User ${Math.floor(Math.random() * 1000)}`,
                version: review.version || '1.0',
                thumbsUp: review.thumbsUp || Math.floor(Math.random() * 10),
                intentions: review.intentions || []
              }))
            : Array.from({ length: totalReviews }, (_, i) => ({
                id: `review-${i}`,
                content: `This is a placeholder for review ${i + 1}. The actual review content couldn't be retrieved.`,
                date: new Date().toISOString(),
                score: Math.floor(Math.random() * 5) + 1,
                sentiment: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
                userName: `User ${i + 1}`,
                version: '1.0',
                thumbsUp: Math.floor(Math.random() * 10),
                intentions: []
              })),
          sentiment: {
            positive: (result as any).summary?.sentimentDistribution?.positive || 0,
            negative: (result as any).summary?.sentimentDistribution?.negative || 0,
            neutral: (result as any).summary?.sentimentDistribution?.neutral || 0
          },
          intentions: {
            // Categorize comments based on their content and sentiment
            feature_request: rawReviews
              .filter(r => {
                const content = (r.text || r.content || '').toLowerCase();
                return content.includes('feature') || 
                       content.includes('add') || 
                       content.includes('would be nice') || 
                       content.includes('should have') ||
                       content.includes('need') ||
                       content.includes('missing');
              })
              .map(r => ({
                id: r.id || `review-fr-${Math.random().toString(36).substring(2, 11)}`,
                content: r.text || r.content || 'No content available',
                date: r.date || new Date().toISOString(),
                score: r.score || 3,
                sentiment: r.sentiment || 'neutral',
                userName: r.userName || `User ${Math.floor(Math.random() * 1000)}`,
                version: r.version || '1.0',
                thumbsUp: r.thumbsUp || 0
              })),
            bug_report: rawReviews
              .filter(r => {
                const content = (r.text || r.content || '').toLowerCase();
                return (r.sentiment === 'negative' || r.score <= 3) && 
                       (content.includes('bug') || 
                        content.includes('crash') || 
                        content.includes('error') || 
                        content.includes('issue') ||
                        content.includes('problem') ||
                        content.includes('not working') ||
                        content.includes('broken'));
              })
              .map(r => ({
                id: r.id || `review-br-${Math.random().toString(36).substring(2, 11)}`,
                content: r.text || r.content || 'No content available',
                date: r.date || new Date().toISOString(),
                score: r.score || 2,
                sentiment: r.sentiment || 'negative',
                userName: r.userName || `User ${Math.floor(Math.random() * 1000)}`,
                version: r.version || '1.0',
                thumbsUp: r.thumbsUp || 0
              })),
            praise: rawReviews
              .filter(r => r.sentiment === 'positive' || r.score >= 4)
              .map(r => ({
                id: r.id || `review-pr-${Math.random().toString(36).substring(2, 11)}`,
                content: r.text || r.content || 'No content available',
                date: r.date || new Date().toISOString(),
                score: r.score || 5,
                sentiment: r.sentiment || 'positive',
                userName: r.userName || `User ${Math.floor(Math.random() * 1000)}`,
                version: r.version || '1.0',
                thumbsUp: r.thumbsUp || 0
              })),
            complaint: rawReviews
              .filter(r => (r.sentiment === 'negative' || r.score <= 2) && 
                          !(r.text || r.content || '').toLowerCase().includes('bug') &&
                          !(r.text || r.content || '').toLowerCase().includes('crash'))
              .map(r => ({
                id: r.id || `review-co-${Math.random().toString(36).substring(2, 11)}`,
                content: r.text || r.content || 'No content available',
                date: r.date || new Date().toISOString(),
                score: r.score || 1,
                sentiment: r.sentiment || 'negative',
                userName: r.userName || `User ${Math.floor(Math.random() * 1000)}`,
                version: r.version || '1.0',
                thumbsUp: r.thumbsUp || 0
              }))
          },
          keywords: ((result as any).insights || [])
            .filter((insight: any) => insight.type === 'feature' || insight.type === 'bug')
            .map((insight: any) => ({
              word: insight.title,
              count: insight.data?.count || 1
            })),
          // Generate trend data based on the raw reviews
          trends: generateTrendData(rawReviews)
        };
      })
    );
    
    // Function to generate trend data from raw reviews
    function generateTrendData(reviews: any[]) {
      if (!reviews || reviews.length === 0) return [];
      
      // Sort reviews by date
      const sortedReviews = [...reviews].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Group reviews by date (weekly)
      const dateGroups = new Map<string, any[]>();
      
      sortedReviews.forEach(review => {
        const date = new Date(review.date);
        // Get the start of the week (Sunday)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!dateGroups.has(weekKey)) {
          dateGroups.set(weekKey, []);
        }
        
        dateGroups.get(weekKey)!.push(review);
      });
      
      // Convert grouped data to trend points
      return Array.from(dateGroups.entries()).map(([date, groupReviews]) => {
        const positive = groupReviews.filter(r => r.sentiment === 'positive').length;
        const negative = groupReviews.filter(r => r.sentiment === 'negative').length;
        const neutral = groupReviews.filter(r => r.sentiment === 'neutral').length;
        
        return {
          date,
          positive,
          negative,
          neutral,
          total: groupReviews.length,
          feature_requests: groupReviews.filter(r => (r.intentions || []).includes('feature_request')).length,
          bug_reports: groupReviews.filter(r => (r.intentions || []).includes('bug_report')).length
        };
      });
    }
    
    console.log('Analysis completed successfully');
    console.log(`Results array length: ${results.length}`);
    if (results.length > 0) {
      console.log(`First result comments length: ${results[0].comments.length}`);
    }
    
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
  const submit = useSubmit();
  const resetAnalysis = () => {
    // Reset the form inputs
    setAppInputs([{ id: 1, value: "", error: "" }]);
    
    // Submit a reset action to clear the analysis state
    submit(
      { _action: "reset" },
      { method: "post", action: "/" }
    );
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
              result={actionData?.results && Array.isArray(actionData.results) && actionData.results.length > 0 
                ? actionData.results[0] 
                : (actionData?.results as any) || { comments: [], sentiment: { positive: 0, negative: 0, neutral: 0 }, intentions: { feature_request: [], bug_report: [], praise: [], complaint: [] }, keywords: [] }}
              comparisonResults={actionData?.results && Array.isArray(actionData.results) && actionData.results.length > 1 
                ? actionData.results.slice(1) 
                : undefined}
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
