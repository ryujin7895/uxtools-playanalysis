import { useState } from "react";
import { SingleAppAnalysis } from "~/components/analysis/SingleAppAnalysis";
import { AnalysisResults } from "~/components/analysis/AnalysisResults";
import type { AnalysisResult } from "~/types/analysis";

export default function Analysis() {
  const [appInput, setAppInput] = useState({ id: 1, value: "", error: "" });
  const [dateRange, setDateRange] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleInputChange = (value: string) => {
    let error = "";
    if (!value) {
      error = "App ID or URL is required";
    } else if (!value.includes("com.") && !value.includes("play.google.com")) {
      error = "Invalid App ID or Play Store URL";
    }
    setAppInput({ ...appInput, value, error });
  };

  const handleAddApp = () => {
    // This will be implemented later for comparison mode
  };

  const handleReset = () => {
    setAppInput({ id: 1, value: "", error: "" });
    setDateRange("");
    setAnalysisResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {!analysisResult ? (
        <SingleAppAnalysis
          appInput={appInput}
          onInputChange={handleInputChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onAddApp={handleAddApp}
          onAnalysisComplete={setAnalysisResult}
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