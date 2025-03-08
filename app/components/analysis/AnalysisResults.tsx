import { Card } from "flowbite-react";
import { useState } from "react";
import type { AnalysisResultsProps, EnhancedAnalysisResult } from "~/types/analysis";
import { AnalysisHeader } from "~/components/analysis/AnalysisHeader";
import { AnalysisNavigation } from "~/components/analysis/AnalysisNavigation";
import { AnalysisOverview } from "~/components/analysis/AnalysisOverview";
import { AnalysisComments } from "~/components/analysis/AnalysisComments";

export function AnalysisResults({ onReset, appCount, result, comparisonResults }: AnalysisResultsProps) {
  // State for view management
  const [currentView, setCurrentView] = useState<string>("overview");
  
  // Cast to enhanced type to safely access enhanced properties
  const enhancedResult = result as EnhancedAnalysisResult;
  const enhancedComparisonResults = comparisonResults as EnhancedAnalysisResult[] | undefined;
  
  const isComparisonMode = !!comparisonResults?.length;
  const totalComments = result.comments.length + (comparisonResults?.reduce((sum, r) => sum + r.comments.length, 0) || 0);
  
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
