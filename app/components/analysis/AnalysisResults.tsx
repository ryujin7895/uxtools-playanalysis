import { Card } from "flowbite-react";
import { useState, useEffect } from "react";
import type { AnalysisResultsProps, EnhancedAnalysisResult } from "~/types/analysis";
import { AnalysisHeader } from "~/components/analysis/AnalysisHeader";
import { AnalysisNavigation } from "~/components/analysis/AnalysisNavigation";
import { AnalysisOverview } from "~/components/analysis/AnalysisOverview";
import { AnalysisComments } from "~/components/analysis/AnalysisComments";

export function AnalysisResults({ onReset, appCount, result, comparisonResults }: AnalysisResultsProps) {
  // State for view management
  const [currentView, setCurrentView] = useState<string>("overview");
  
  // Debug logging
  useEffect(() => {
    console.log("AnalysisResults received result:", result);
    console.log("Result comments:", result?.comments);
    console.log("Comments length:", result?.comments?.length);
  }, [result]);
  
  // Check if result exists and has the expected structure
  if (!result || !result.comments) {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No analysis results available</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              There was an issue processing the analysis. Please try again.
            </p>
            <button
              onClick={onReset}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Check if we have any reviews
  if (result.comments.length === 0) {
    return (
      <div className="w-full">
        <Card className="shadow-sm">
          <div className="p-4 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No reviews found</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              We couldn't find any reviews for this app in the selected date range.
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try selecting a different date range or check if the app ID is correct.
            </p>
            <button
              onClick={onReset}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }
  
  // Cast to enhanced type to safely access enhanced properties
  const enhancedResult = result as EnhancedAnalysisResult;
  const enhancedComparisonResults = comparisonResults as EnhancedAnalysisResult[] | undefined;
  
  const isComparisonMode = !!comparisonResults?.length;
  const totalComments = result.comments.length + (comparisonResults?.reduce((sum, r) => sum + (r?.comments?.length || 0), 0) || 0);
  
  console.log(`Rendering AnalysisResults with ${totalComments} total comments`);
  
  // Render the appropriate content based on the selected view
  const renderContent = () => {
    switch (currentView) {
      case "overview":
        return <AnalysisOverview 
                result={enhancedResult} 
                comparisonResults={enhancedComparisonResults} 
                onReset={onReset} 
                appCount={appCount} 
              />;
      case "comments":
        return <AnalysisComments 
                result={result} 
                comparisonResults={comparisonResults} 
                onReset={onReset} 
                appCount={appCount} 
              />;
      default:
        return <AnalysisOverview 
                result={enhancedResult} 
                comparisonResults={enhancedComparisonResults} 
                onReset={onReset} 
                appCount={appCount} 
              />;
    }
  };

  return (
    <div className="w-full">
      {/* Header Component */}
      <AnalysisHeader
        title="Analysis Results"
        appCount={appCount}
        totalComments={totalComments}
        isComparisonMode={isComparisonMode}
        onReset={onReset}
      />
      
      {/* Navigation Chips */}
      <AnalysisNavigation 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />
      
      {/* Content Card */}
      <Card className="shadow-sm mt-4">
        {renderContent()}
      </Card>
    </div>
  );
}
