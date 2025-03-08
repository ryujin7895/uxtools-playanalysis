import { Card, Badge } from "flowbite-react";
import { 
  ChartPieIcon, 
  ChatBubbleLeftIcon
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
} from 'chart.js';
import type { EnhancedAnalysisProps, AnalysisResult, EnhancedAnalysisResult } from "~/types/analysis";

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
  <Card className="shadow-sm">
    <div className="text-center">
      <div className={`text-2xl font-bold text-${color}-600`}>
        {count}
      </div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  </Card>
);

const SentimentCard = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className="text-center">
    <div className={`text-2xl font-bold text-${color}-600`}>
      {count}
    </div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

const SentimentDistribution = ({ data }: { data: AnalysisResult }) => (
  <Card className="shadow-sm p-4">
    <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
    <div className="flex justify-around">
      <SentimentCard label="Positive" count={data.sentiment.positive} color="green" />
      <SentimentCard label="Neutral" count={data.sentiment.neutral} color="yellow" />
      <SentimentCard label="Negative" count={data.sentiment.negative} color="red" />
    </div>
  </Card>
);

const chartColors = [
  { line: 'rgb(37, 99, 235)', fill: 'rgba(37, 99, 235, 0.1)' },   // Blue
  { line: 'rgb(234, 88, 12)', fill: 'rgba(234, 88, 12, 0.1)' },   // Orange
  { line: 'rgb(22, 163, 74)', fill: 'rgba(22, 163, 74, 0.1)' },   // Green
  { line: 'rgb(217, 70, 239)', fill: 'rgba(217, 70, 239, 0.1)' }  // Purple
];

const TrendAnalysis = ({ data }: { data: AnalysisResult }) => {
  // Check if trends data exists
  const hasTrendsData = data.trends && Array.isArray(data.trends) && data.trends.length > 0;
  
  // If we don't have trends data, don't render anything
  if (!hasTrendsData) return null;
  
  const chartData: ChartData<'line'> = {
    labels: data.trends!.map(trend => new Date(trend.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Positive Sentiment',
        data: data.trends!.map(trend => trend.positive),
        borderColor: chartColors[2].line,
        backgroundColor: chartColors[2].fill,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors[2].line,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 2
      },
      {
        label: 'Negative Sentiment',
        data: data.trends!.map(trend => trend.negative),
        borderColor: chartColors[1].line,
        backgroundColor: chartColors[1].fill,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors[1].line,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 2
      },
      {
        label: 'Neutral Sentiment',
        data: data.trends!.map(trend => trend.neutral),
        borderColor: chartColors[0].line,
        backgroundColor: chartColors[0].fill,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors[0].line,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 2
      },
      {
        label: 'Total Comments',
        data: data.trends!.map(trend => trend.total),
        borderColor: chartColors[3].line,
        backgroundColor: chartColors[3].fill,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: chartColors[3].line,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        borderWidth: 2
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          padding: 10
        }
      },
      y: {
        beginAtZero: true,
        border: {
          display: false
        },
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          padding: 10,
          callback: function(value) {
            return value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <Card className="mt-6">
      <div>
        <h3 className="text-lg font-medium mb-1 text-gray-800 dark:text-white">
          Trend Analysis
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Review volume trends over time
        </p>

        <div className="h-[400px]">
          <Line data={chartData} options={options} />
        </div>
      </div>
    </Card>
  );
};

export function AnalysisOverview({ result, comparisonResults }: EnhancedAnalysisProps) {
  const enhancedResult = result as EnhancedAnalysisResult;
  const enhancedComparisonResults = comparisonResults as EnhancedAnalysisResult[] | undefined;
  
  const isComparisonMode = !!comparisonResults?.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Sentiment Analysis */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard title="Feature Requests" count={result.intentions.feature_request.length} color="blue" />
          <SummaryCard title="Bug Reports" count={result.intentions.bug_report.length} color="red" />
          <SummaryCard title="Praise" count={result.intentions.praise.length} color="green" />
          <SummaryCard title="Complaints" count={result.intentions.complaint.length} color="yellow" />
        </div>

        {/* Primary App Sentiment Analysis */}
        <SentimentDistribution data={result} />

        {/* Comparison Apps Sentiment Analysis */}
        {comparisonResults?.map((compResult, index) => (
          <Card key={index} className="shadow-sm">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <ChartPieIcon className="w-5 h-5 mr-2 text-blue-600" />
              Comparison App {index + 1} Sentiment Analysis
            </h3>
            <SentimentDistribution data={compResult} />
          </Card>
        ))}
      </div>

      {/* Right Column - Keywords and Trend Analysis */}
      <div className="space-y-6">
        <Card className="shadow-sm">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <ChatBubbleLeftIcon className="w-5 h-5 mr-2 text-blue-600" />
            Top Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map(({ word, count }) => (
              <Badge key={word} color="info" className="text-sm py-1.5">
                {word} ({count})
              </Badge>
            ))}
          </div>
        </Card>

        {/* Only render Trend Analysis if data is available */}
        {result.trends && result.trends.length > 0 && (
          <TrendAnalysis data={result} />
        )}
      </div>
    </div>
  );
}
