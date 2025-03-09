import { useState } from "react";
import { SingleAppAnalysis } from "~/components/analysis/SingleAppAnalysis";
import { AnalysisResults } from "~/components/analysis/AnalysisResults";
import type { AnalysisResult } from "~/types/analysis";
import { useNavigation } from "@remix-run/react";

export default function Analysis() {
  const [appInput, setAppInput] = useState({ id: 1, value: "", error: "" });
  const [dateRange, setDateRange] = useState("30days");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const navigation = useNavigation();
  const isAnalyzing = navigation.state === "submitting";

  const handleInputChange = (value: string) => {
    // Simple validation
    let error = "";
    if (!value.trim()) {
      error = "App ID or URL is required";
    } else if (!/^[a-zA-Z0-9._]+$/.test(value) && 
               !/https:\/\/play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/.test(value)) {
      error = "Enter a valid App ID or Play Store URL";
    }
    
    setAppInput({ ...appInput, value, error });
  };

  const handleAddApp = () => {
    // This would normally add another app for comparison
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setAppInput({ id: 1, value: "", error: "" });
  };

  return (
    <div className="container mx-auto p-4">
      {!analysisResult ? (
        <SingleAppAnalysis
          appInput={appInput}
          onInputChange={handleInputChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onAddApp={handleAddApp}
          isAnalyzing={isAnalyzing}
        />
      ) : (
        <AnalysisResults
          onReset={handleReset}
          appCount={1}
          result={analysisResult}
        />
      )}
    </div>
  );
} 