import { Card, Badge, Progress, Select, TextInput, Button } from "flowbite-react";
import { 
  ChartPieIcon, 
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Filler
} from 'chart.js/auto';
import type { EnhancedAnalysisProps, AnalysisResult, EnhancedAnalysisResult } from "~/types/analysis";
import { useState } from "react";
// Import the new TrendAnalysisChart component
import TrendAnalysisChart from "../TrendAnalysisChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SummaryCard = ({ title, count, color }: { title: string; count: number; color: string }) => (
  <Card className="shadow-sm hover:shadow-md transition-shadow">
    <div className="text-center">
      <div className={`text-2xl font-bold text-${color}-600`}>
        {count}
      </div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  </Card>
);

// Redesigned SentimentCard with progress bar for better visual representation
const SentimentCard = ({ label, count, color, total }: { label: string; count: number; color: string; total: number }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{count} ({percentage}%)</span>
      </div>
      <Progress
        progress={percentage}
        color={color as "success" | "warning" | "failure"}
        size="sm"
        className="mb-2"
      />
    </div>
  );
};

const SentimentDistribution = ({ data }: { data: AnalysisResult }) => {
  const total = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative;
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <ChartPieIcon className="w-5 h-5 mr-2 text-blue-600" />
        Sentiment Distribution
      </h3>
      <div className="space-y-2">
        <SentimentCard label="Positive" count={data.sentiment.positive} color="success" total={total} />
        <SentimentCard label="Neutral" count={data.sentiment.neutral} color="warning" total={total} />
        <SentimentCard label="Negative" count={data.sentiment.negative} color="failure" total={total} />
      </div>
    </Card>
  );
};

// Collapsible card component for future content sections
const CollapsibleCard = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <div 
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold flex items-center">
          {icon}
          {title}
        </h3>
        {isExpanded ? 
          <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : 
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        }
      </div>
      
      {isExpanded && children}
    </Card>
  );
};

export function AnalysisOverview({ result }: EnhancedAnalysisProps) {
  const enhancedResult = result as EnhancedAnalysisResult;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard title="Feature Requests" count={result.intentions.feature_request.length} color="blue" />
        <SummaryCard title="Bug Reports" count={result.intentions.bug_report.length} color="red" />
        <SummaryCard title="Praise" count={result.intentions.praise.length} color="green" />
        <SummaryCard title="Complaints" count={result.intentions.complaint.length} color="yellow" />
      </div>

      {/* Replace the old TrendAnalysis component with the new TrendAnalysisChart */}
      {result.trends && result.trends.length > 0 && (
        <TrendAnalysisChart data={result} />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Sentiment Analysis */}
        <div className="lg:col-span-8 space-y-6">
          {/* Primary App Sentiment Analysis */}
          <SentimentDistribution data={result} />
        </div>

        {/* Right Column - Keywords */}
        <div className="lg:col-span-4 space-y-6">
          <CollapsibleCard
            title="Top Keywords"
            icon={<ChatBubbleLeftIcon className="w-5 h-5 mr-2 text-blue-600" />}
          >
            <div className="flex flex-wrap gap-2">
              {result.keywords.map(({ word, count }) => (
                <Badge key={word} color="info" className="text-sm py-1.5">
                  {word} ({count})
                </Badge>
              ))}
            </div>
          </CollapsibleCard>
        </div>
      </div>
    </div>
  );
}
