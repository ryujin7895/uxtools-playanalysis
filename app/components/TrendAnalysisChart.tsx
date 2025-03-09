import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Brush
} from "recharts";
import { format, parseISO, startOfDay, startOfWeek, startOfMonth, startOfQuarter, isSameDay, isSameWeek, isSameMonth, isSameQuarter } from "date-fns";
import type { AnalysisResult, Comment } from "~/types/analysis";

interface TrendDataPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  featureRequests: number;
  bugReports: number;
  rawDate?: string;
}

interface AppRelease {
  date: string;
  version: string;
  notes?: string;
}

interface TrendTimeframe {
  label: string;
  value: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  groupingFn: (date: Date) => Date;
  formatFn: (date: Date) => string;
  isSamePeriodFn: (date1: Date, date2: Date) => boolean;
}

interface TrendAnalysisProps {
  data: AnalysisResult;
}

function InsightItem({ change, appReleases }: {
  change: {
    period: string;
    metric: 'positive' | 'negative' | 'total' | 'featureRequests' | 'bugReports';
    change: number;
    isIncrease: boolean;
  },
  appReleases: AppRelease[];
}) {
  const getMetricLabel = (metric: 'positive' | 'negative' | 'total' | 'featureRequests' | 'bugReports') => {
    switch (metric) {
      case 'positive': return 'positive sentiment';
      case 'negative': return 'negative sentiment';
      case 'total': return 'comment volume';
      case 'featureRequests': return 'feature requests';
      case 'bugReports': return 'bug reports';
    }
  };
  
  const changeText = change.isIncrease ? 'increase' : 'decrease';
  const changeValue = Math.abs(change.change);
  const formattedChange = change.metric === 'positive' || change.metric === 'negative'
    ? `${(changeValue * 100).toFixed(1)}%`
    : `${(changeValue * 100).toFixed(1)}%`;
  
  const isNearRelease = appReleases.some(release => {
    const releaseDate = new Date(release.date);
    const periodDate = new Date(change.period);
    const diffTime = Math.abs(periodDate.getTime() - releaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14; // Within 2 weeks
  });
  
  return (
    <div className="flex items-start space-x-2">
      <div className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded-full ${
        change.isIncrease 
          ? (change.metric === 'negative' || change.metric === 'bugReports' ? 'bg-red-500' : 'bg-green-500')
          : (change.metric === 'negative' || change.metric === 'bugReports' ? 'bg-green-500' : 'bg-red-500')
      }`} />
      <p className="text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">{formattedChange} {changeText}</span> in {getMetricLabel(change.metric)} during {change.period}.
        {isNearRelease && (
          <span className="ml-1 text-blue-600 dark:text-blue-400">
            May be related to recent app update.
          </span>
        )}
      </p>
    </div>
  );
}

export default function TrendAnalysisChart({ data }: TrendAnalysisProps) {
  // State
  const [timeGranularity, setTimeGranularity] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [dateRange, setDateRange] = useState<{start: string | null, end: string | null}>({start: null, end: null});
  const [showAllTime, setShowAllTime] = useState(true);
  const [visibleMetrics, setVisibleMetrics] = useState({
    positive: true,
    negative: true,
    neutral: true,
    total: true,
    featureRequests: true,
    bugReports: true
  });

  // Extract comments from the data
  const comments = data.comments || [];
  
  // Extract intentions from the data
  const intentions = {
    feature_request: data.intentions?.feature_request || [],
    bug_report: data.intentions?.bug_report || [],
    praise: data.intentions?.praise || [],
    complaint: data.intentions?.complaint || []
  };
  
  // Mock app releases - in a real app, this would come from the API
  const appReleases: AppRelease[] = useMemo(() => {
    // Generate some mock releases based on the comments dates if available
    if (comments.length === 0) return [];
    
    const dates = comments.map(c => new Date(c.date)).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length === 0) return [];
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const totalDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create 1-3 releases depending on the date range
    const releases: AppRelease[] = [];
    
    if (totalDays > 30) {
      // Add a release at 1/3 of the way through
      const firstReleaseDate = new Date(firstDate.getTime() + (lastDate.getTime() - firstDate.getTime()) / 3);
      releases.push({
        date: firstReleaseDate.toISOString(),
        version: "1.1.0"
      });
      
      // Add another release at 2/3 of the way through
      if (totalDays > 60) {
        const secondReleaseDate = new Date(firstDate.getTime() + 2 * (lastDate.getTime() - firstDate.getTime()) / 3);
        releases.push({
          date: secondReleaseDate.toISOString(),
          version: "1.2.0"
        });
      }
    }
    
    return releases;
  }, [comments]);

  // Time granularity options
  const timeframeOptions: TrendTimeframe[] = useMemo(() => [
    { 
      label: 'Daily', 
      value: 'daily', 
      groupingFn: startOfDay,
      formatFn: (date) => format(date, 'MMM d, yyyy'),
      isSamePeriodFn: isSameDay
    },
    { 
      label: 'Weekly', 
      value: 'weekly', 
      groupingFn: startOfWeek,
      formatFn: (date) => `Week of ${format(date, 'MMM d, yyyy')}`,
      isSamePeriodFn: isSameWeek
    },
    { 
      label: 'Monthly', 
      value: 'monthly', 
      groupingFn: startOfMonth,
      formatFn: (date) => format(date, 'MMMM yyyy'),
      isSamePeriodFn: isSameMonth
    },
    { 
      label: 'Quarterly', 
      value: 'quarterly', 
      groupingFn: startOfQuarter,
      formatFn: (date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`,
      isSamePeriodFn: isSameQuarter
    }
  ], []);

  // Get current timeframe settings
  const currentTimeframe = useMemo(() => 
    timeframeOptions.find(t => t.value === timeGranularity) || timeframeOptions[1], 
    [timeGranularity, timeframeOptions]
  );

  // Process comments data for trend analysis
  const trendData = useMemo(() => {
    if (!comments || comments.length === 0) return [];
    
    // Group comments by time period
    const groupedData = new Map<string, TrendDataPoint>();
    
    comments.forEach(comment => {
      try {
        const commentDate = parseISO(comment.date);
        const periodStart = currentTimeframe.groupingFn(commentDate);
        const periodKey = format(periodStart, 'yyyy-MM-dd');
        
        if (!groupedData.has(periodKey)) {
          groupedData.set(periodKey, {
            date: currentTimeframe.formatFn(periodStart),
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0,
            featureRequests: 0,
            bugReports: 0,
            rawDate: periodKey
          });
        }
        
        const dataPoint = groupedData.get(periodKey)!;
        dataPoint.total += 1;
        
        // Count by sentiment
        if (comment.sentiment === 'positive') dataPoint.positive += 1;
        else if (comment.sentiment === 'negative') dataPoint.negative += 1;
        else dataPoint.neutral += 1;
        
        // Count intentions
        if (intentions.feature_request.some(c => c.id === comment.id)) {
          dataPoint.featureRequests += 1;
        }
        if (intentions.bug_report.some(c => c.id === comment.id)) {
          dataPoint.bugReports += 1;
        }
      } catch (error) {
        console.error("Error processing comment date:", error);
      }
    });
    
    // Convert to array and sort by date
    let result = Array.from(groupedData.entries())
      .map(([key, value]) => ({
        ...value,
        rawDate: key // Keep the raw date for sorting
      }))
      .sort((a, b) => a.rawDate!.localeCompare(b.rawDate!));
    
    // Apply date range filter if not showing all time
    if (!showAllTime && (dateRange.start || dateRange.end)) {
      result = result.filter(item => {
        const itemDate = new Date(item.rawDate!);
        let include = true;
        
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          include = include && itemDate >= startDate;
        }
        
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          include = include && itemDate <= endDate;
        }
        
        return include;
      });
    }
    
    return result;
  }, [comments, intentions, currentTimeframe, dateRange, showAllTime]);

  // Detect significant changes in the trend data
  const significantChanges = useMemo(() => {
    if (trendData.length < 2) return [];
    
    const changes: Array<{
      period: string;
      metric: 'positive' | 'negative' | 'total' | 'featureRequests' | 'bugReports';
      change: number;
      isIncrease: boolean;
    }> = [];
    const thresholds = {
      positive: 0.2, // 20% change
      negative: 0.2,
      total: 0.3,     // 30% change in volume
      featureRequests: 0.5, // 50% change
      bugReports: 0.5
    };
    
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const previous = trendData[i-1];
      
      // Skip periods with very low numbers to avoid false positives
      if (previous.total < 5) continue;
      
      const metrics = ['positive', 'negative', 'total', 'featureRequests', 'bugReports'] as const;
      
      for (const metric of metrics) {
        // For sentiment metrics, calculate the percentage change
        if (metric === 'positive' || metric === 'negative') {
          const currentPct = current[metric] / current.total;
          const previousPct = previous[metric] / previous.total;
          
          if (Math.abs(currentPct - previousPct) >= thresholds[metric]) {
            changes.push({
              period: current.date,
              metric,
              change: currentPct - previousPct,
              isIncrease: currentPct > previousPct
            });
          }
        } 
        // For count metrics, calculate the relative change
        else {
          if (previous[metric] === 0) continue; // Avoid division by zero
          
          const relativeChange = (current[metric] - previous[metric]) / previous[metric];
          
          if (Math.abs(relativeChange) >= thresholds[metric]) {
            changes.push({
              period: current.date,
              metric,
              change: relativeChange,
              isIncrease: relativeChange > 0
            });
          }
        }
      }
    }
    
    return changes;
  }, [trendData]);

  // Check if we have trend data
  const hasTrendsData = trendData.length > 0;

  // If no trends data available, display a message
  if (!hasTrendsData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trend Analysis</h2>
        <div className="text-center py-8 text-gray-500">
          No trend data available for this analysis. Try analyzing more comments.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Analysis</h2>
        <div className="flex items-center space-x-4">
          {/* Time Granularity Dropdown */}
          <div>
            <select
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              value={timeGranularity}
              onChange={(e) => setTimeGranularity(e.target.value as any)}
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range Controls */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              value={dateRange.start || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));
                setShowAllTime(false);
              }}
              disabled={showAllTime}
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              value={dateRange.end || ''}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));
                setShowAllTime(false);
              }}
              disabled={showAllTime}
            />
            <button
              className={`px-3 py-2 rounded-lg text-sm ${
                showAllTime 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
              }`}
              onClick={() => setShowAllTime(!showAllTime)}
            >
              All Time
            </button>
          </div>
        </div>
      </div>
      
      {/* Metrics Toggle */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.positive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, positive: !prev.positive }))}
        >
          Positive Sentiment
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.negative 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, negative: !prev.negative }))}
        >
          Negative Sentiment
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.neutral 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, neutral: !prev.neutral }))}
        >
          Neutral Sentiment
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.total 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, total: !prev.total }))}
        >
          Total Comments
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.featureRequests 
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, featureRequests: !prev.featureRequests }))}
        >
          Feature Requests
        </button>
        <button
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            visibleMetrics.bugReports 
              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' 
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
          onClick={() => setVisibleMetrics(prev => ({ ...prev, bugReports: !prev.bugReports }))}
        >
          Bug Reports
        </button>
      </div>
      
      {/* Chart */}
      <div className="h-80 mt-6">
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: '#E5E7EB',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                formatter={(value, name) => {
                  const formattedName = {
                    positive: 'Positive Sentiment',
                    negative: 'Negative Sentiment',
                    neutral: 'Neutral Sentiment',
                    total: 'Total Comments',
                    featureRequests: 'Feature Requests',
                    bugReports: 'Bug Reports'
                  }[name] || name;
                  
                  return [value, formattedName];
                }}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend 
                formatter={(value: string) => {
                  const formattedValues: Record<string, string> = {
                    positive: 'Positive Sentiment',
                    negative: 'Negative Sentiment',
                    neutral: 'Neutral Sentiment',
                    total: 'Total Comments',
                    featureRequests: 'Feature Requests',
                    bugReports: 'Bug Reports'
                  };
                  
                  return <span style={{ color: '#6B7280' }}>{formattedValues[value] || value}</span>;
                }}
              />
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#8884d8"
                fill="rgba(136, 132, 216, 0.1)"
              />
              
              {/* App Release Reference Lines */}
              {appReleases.map((release, index) => {
                // Find the closest data point to this release date
                const releaseDate = parseISO(release.date);
                let closestPoint = null;
                let minDiff = Infinity;
                
                for (const point of trendData) {
                  // This is a simplification - in a real app, you'd parse the date properly
                  const pointDate = new Date(point.rawDate || '');
                  const diff = Math.abs(pointDate.getTime() - releaseDate.getTime());
                  
                  if (diff < minDiff) {
                    minDiff = diff;
                    closestPoint = point;
                  }
                }
                
                if (!closestPoint) return null;
                
                return (
                  <ReferenceLine
                    key={index}
                    x={closestPoint.date}
                    stroke="#10B981"
                    strokeDasharray="3 3"
                    label={{
                      value: `v${release.version}`,
                      position: 'insideTopRight',
                      fill: '#10B981',
                      fontSize: 12
                    }}
                  />
                );
              })}
              
              {/* Significant Changes Highlights */}
              {significantChanges.map((change, index) => {
                // Find the data point for this period
                const point = trendData.find(p => p.date === change.period);
                if (!point) return null;
                
                // Determine color based on metric and direction
                let color;
                if (change.metric === 'positive') {
                  color = change.isIncrease ? '#10B981' : '#EF4444';
                } else if (change.metric === 'negative') {
                  color = change.isIncrease ? '#EF4444' : '#10B981';
                } else if (change.metric === 'total') {
                  color = '#3B82F6';
                } else if (change.metric === 'featureRequests') {
                  color = '#8B5CF6';
                } else if (change.metric === 'bugReports') {
                  color = '#F97316';
                }
                
                return (
                  <ReferenceArea
                    key={`${change.period}-${change.metric}-${index}`}
                    x1={point.date}
                    x2={point.date}
                    strokeOpacity={0.3}
                    fill={color}
                    fillOpacity={0.2}
                  />
                );
              })}
              
              {/* Chart Lines */}
              {visibleMetrics.positive && (
                <Line
                  type="monotone"
                  dataKey="positive"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#10B981' }}
                  activeDot={{ r: 6, fill: '#10B981' }}
                />
              )}
              {visibleMetrics.negative && (
                <Line
                  type="monotone"
                  dataKey="negative"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#EF4444' }}
                  activeDot={{ r: 6, fill: '#EF4444' }}
                />
              )}
              {visibleMetrics.neutral && (
                <Line
                  type="monotone"
                  dataKey="neutral"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F59E0B' }}
                  activeDot={{ r: 6, fill: '#F59E0B' }}
                />
              )}
              {visibleMetrics.total && (
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3B82F6' }}
                  activeDot={{ r: 6, fill: '#3B82F6' }}
                />
              )}
              {visibleMetrics.featureRequests && (
                <Line
                  type="monotone"
                  dataKey="featureRequests"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#8B5CF6' }}
                  activeDot={{ r: 6, fill: '#8B5CF6' }}
                />
              )}
              {visibleMetrics.bugReports && (
                <Line
                  type="monotone"
                  dataKey="bugReports"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F97316' }}
                  activeDot={{ r: 6, fill: '#F97316' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">
              Not enough data to display trends. Try analyzing more comments.
            </p>
          </div>
        )}
      </div>
      
      {/* Insights Panel */}
      {trendData.length > 0 && (
        <div className="mt-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Key Insights
          </h3>
          <div className="space-y-2">
            {significantChanges.length > 0 ? (
              significantChanges.slice(0, 3).map((change, index) => (
                <InsightItem key={index} change={change} appReleases={appReleases} />
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No significant changes detected in the current time period.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 