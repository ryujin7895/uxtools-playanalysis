import { useState, useEffect } from 'react';
import { Card, Badge, Select, TextInput, Button } from 'flowbite-react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { AnalysisResult } from '~/types/analysis';

// Register ChartJS components
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

// Define interfaces for trend data
interface TrendPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  feature_requests?: number;
  bug_reports?: number;
}

interface TrendAnalysisProps {
  data: AnalysisResult;
}

// Time period options for filtering
type TimePeriod = 'weekly' | 'monthly' | 'yearly' | 'all';

// Chart colors for different sentiment types
const chartColors = {
  positive: { line: 'rgb(34, 197, 94)', fill: 'rgba(34, 197, 94, 0.1)' },   // Green
  negative: { line: 'rgb(239, 68, 68)', fill: 'rgba(239, 68, 68, 0.1)' },   // Red
  neutral: { line: 'rgb(59, 130, 246)', fill: 'rgba(59, 130, 246, 0.1)' },  // Blue
  total: { line: 'rgb(168, 85, 247)', fill: 'rgba(168, 85, 247, 0.1)' },    // Purple
  features: { line: 'rgb(249, 115, 22)', fill: 'rgba(249, 115, 22, 0.1)' }, // Orange
  bugs: { line: 'rgb(234, 88, 12)', fill: 'rgba(234, 88, 12, 0.1)' }        // Dark Orange
};

export default function TrendAnalysisChart({ data }: TrendAnalysisProps) {
  // States for filtering and chart data
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('weekly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filteredTrends, setFilteredTrends] = useState<TrendPoint[]>([]);
  const [visibleDatasets, setVisibleDatasets] = useState({
    positive: true,
    negative: true,
    neutral: true,
    total: true,
    features: false,
    bugs: false
  });

  // Check if trends data exists
  const hasTrendsData = data.trends && Array.isArray(data.trends) && data.trends.length > 0;
  
  // Filter trends based on selected time period and date range
  useEffect(() => {
    if (!hasTrendsData) return;
    
    let filtered = [...data.trends!];
    
    // Apply date filters if both dates are selected
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter(trend => {
        const trendDate = new Date(trend.date);
        return trendDate >= start && trendDate <= end;
      });
    }
    
    // Apply time period aggregation logic
    if (timePeriod !== 'all') {
      // Actual aggregation would go here based on time period
      // This is a simplified placeholder
      filtered = aggregateByTimePeriod(filtered, timePeriod);
    }
    
    setFilteredTrends(filtered);
  }, [data.trends, timePeriod, startDate, endDate]);

  // Function to aggregate data by time period
  const aggregateByTimePeriod = (data: TrendPoint[], period: TimePeriod): TrendPoint[] => {
    // In a real implementation, this would aggregate data points based on the selected period
    // For this example, we'll just return the original data
    return data;
  };

  // Reset date filters
  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setTimePeriod('weekly');
  };

  // Toggle visibility of datasets
  const toggleDataset = (dataset: keyof typeof visibleDatasets) => {
    setVisibleDatasets(prev => ({
      ...prev,
      [dataset]: !prev[dataset]
    }));
  };

  // Prepare chart data
  const chartData: ChartData<'line'> = {
    labels: filteredTrends.map(trend => new Date(trend.date).toLocaleDateString()),
    datasets: [
      // Only include datasets that are visible
      visibleDatasets.positive && {
        label: 'Positive',
        data: filteredTrends.map(trend => trend.positive),
        borderColor: chartColors.positive.line,
        backgroundColor: chartColors.positive.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.positive.line,
        borderWidth: 2
      },
      visibleDatasets.negative && {
        label: 'Negative',
        data: filteredTrends.map(trend => trend.negative),
        borderColor: chartColors.negative.line,
        backgroundColor: chartColors.negative.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.negative.line,
        borderWidth: 2
      },
      visibleDatasets.neutral && {
        label: 'Neutral',
        data: filteredTrends.map(trend => trend.neutral),
        borderColor: chartColors.neutral.line,
        backgroundColor: chartColors.neutral.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.neutral.line,
        borderWidth: 2
      },
      visibleDatasets.total && {
        label: 'Total',
        data: filteredTrends.map(trend => trend.total),
        borderColor: chartColors.total.line,
        backgroundColor: chartColors.total.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.total.line,
        borderWidth: 2
      },
      visibleDatasets.features && {
        label: 'Feature Requests',
        data: filteredTrends.map(trend => trend.feature_requests || 0),
        borderColor: chartColors.features.line,
        backgroundColor: chartColors.features.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.features.line,
        borderWidth: 2
      },
      visibleDatasets.bugs && {
        label: 'Bug Reports',
        data: filteredTrends.map(trend => trend.bug_reports || 0),
        borderColor: chartColors.bugs.line,
        backgroundColor: chartColors.bugs.fill,
        tension: 0.3,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: chartColors.bugs.line,
        borderWidth: 2
      }
    ].filter(Boolean) as any[] // Filter out falsy values from conditional rendering
  };

  // Chart options
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false, // We'll use custom badges instead
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 8,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          font: {
            size: 10
          },
          callback: function(value) {
            return value;
          }
        }
      }
    }
  };

  // If no trends data available, display a message
  if (!hasTrendsData) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-all">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
          Trend Analysis
        </h3>
        <div className="text-center py-8 text-gray-500">
          No trend data available for this analysis
        </div>
      </Card>
    );
  }

  // Badge component with clickable toggle functionality
  const DatasetBadge = ({ 
    color, 
    label, 
    datasetKey 
  }: { 
    color: string; 
    label: string; 
    datasetKey: keyof typeof visibleDatasets 
  }) => (
    <Badge 
      color={color as any} 
      className={`text-sm py-1.5 cursor-pointer transition-opacity ${!visibleDatasets[datasetKey] ? 'opacity-50' : 'opacity-100'}`}
      onClick={() => toggleDataset(datasetKey)}
    >
      {label}
    </Badge>
  );

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
        Trend Analysis
      </h3>
      
      {/* Badges for toggling datasets */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <DatasetBadge color="success" label="Positive Sentiment" datasetKey="positive" />
        <DatasetBadge color="failure" label="Negative Sentiment" datasetKey="negative" />
        <DatasetBadge color="info" label="Neutral Sentiment" datasetKey="neutral" />
        <DatasetBadge color="purple" label="Total Comments" datasetKey="total" />
        <DatasetBadge color="warning" label="Feature Requests" datasetKey="features" />
        <DatasetBadge color="orange" label="Bug Reports" datasetKey="bugs" />
      </div>
      
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <Select
          id="timeframe"
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          className="w-32"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="all">All Time</option>
        </Select>
        
        <div className="flex items-center gap-2">
          <TextInput
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36"
          />
          <span>to</span>
          <TextInput
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36"
          />
          <Button color="light" onClick={handleResetFilters}>Reset</Button>
        </div>
      </div>
      
      {/* Chart container */}
      <div className="h-[350px]">
        <Line data={chartData} options={chartOptions} />
      </div>
    </Card>
  );
}
