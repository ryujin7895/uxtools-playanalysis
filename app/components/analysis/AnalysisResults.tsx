import { Card, Button, Badge } from "flowbite-react";
import { 
  ChartBarIcon, 
  ChartPieIcon, 
  ChatBubbleLeftIcon, 
  UserGroupIcon,
  FunnelIcon,
  HandThumbUpIcon,
  StarIcon as StarIconOutline
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import type { AnalysisResult, Comment } from "~/types/analysis";
import { useEffect, useRef, useState, useMemo } from "react";
import { AnalysisHeader } from "~/components/analysis/AnalysisHeader";
import { AnalysisContent, TabItem } from "~/components/analysis/AnalysisContent";

// Add interfaces to handle the enhanced data
interface EnhancedAnalysisProps extends AnalysisResultsProps {
  result: EnhancedAnalysisResult;
  comparisonResults?: EnhancedAnalysisResult[];
}

interface EnhancedAnalysisResult extends AnalysisResult {
  featureRequests?: {
    feature: string;
    count: number;
    examples: string[];
    averageRating: number;
  }[];
  bugReports?: {
    issue: string;
    count: number;
    examples: string[];
    severity: 'low' | 'medium' | 'high';
  }[];
  userSegments?: {
    newUsers: Comment[];
    powerUsers: Comment[];
    returningUsers: Comment[];
  };
  competitiveMentions?: {
    competitor: string;
    mentions: Comment[];
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }[];
}

interface AnalysisResultsProps {
  onReset: () => void;
  appCount: number;
  result: AnalysisResult | EnhancedAnalysisResult;
  comparisonResults?: (AnalysisResult | EnhancedAnalysisResult)[];
}

export function AnalysisResults({ onReset, appCount, result, comparisonResults }: AnalysisResultsProps) {
  // Cast to enhanced type to safely access enhanced properties
  const enhancedResult = result as EnhancedAnalysisResult;
  const enhancedComparisonResults = comparisonResults as EnhancedAnalysisResult[] | undefined;
  
  const isComparisonMode = !!comparisonResults?.length;
  const totalComments = result.comments.length + (comparisonResults?.reduce((sum, r) => sum + r.comments.length, 0) || 0);
  
  // Add state for comments filtering
  const [commentFilter, setCommentFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [sortOrder, setSortOrder] = useState<'recent' | 'rating'>('recent');

  // Helper function to check if result has enhanced data
  const hasEnhancedData = (res: AnalysisResult | EnhancedAnalysisResult): boolean => {
    const enhanced = res as EnhancedAnalysisResult;
    return !!(enhanced.featureRequests || enhanced.bugReports || 
              enhanced.userSegments || enhanced.competitiveMentions);
  };

  // Helper for rendering sentiment bars
  const renderSentimentBars = (data: AnalysisResult) => (
    <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Positive</span>
        </div>
        <div className="flex items-center">
          <div className="w-48 md:w-64 bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${(data.sentiment.positive / data.comments.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium w-12 text-right">{data.sentiment.positive}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Negative</span>
        </div>
        <div className="flex items-center">
          <div className="w-48 md:w-64 bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-red-500 h-2.5 rounded-full" 
              style={{ width: `${(data.sentiment.negative / data.comments.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium w-12 text-right">{data.sentiment.negative}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
          <span>Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-48 md:w-64 bg-gray-200 rounded-full h-2.5 mr-2">
            <div 
              className="bg-gray-500 h-2.5 rounded-full" 
              style={{ width: `${(data.sentiment.neutral / data.comments.length) * 100}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium w-12 text-right">{data.sentiment.neutral}</span>
        </div>
      </div>
    </div>
  );

  // Function to render star rating
  const renderStarRating = (score: number) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= score) {
        // Full star
        stars.push(<StarIcon key={i} className="w-4 h-4 text-yellow-400" />);
      } else {
        // Empty star
        stars.push(<StarIconOutline key={i} className="w-4 h-4 text-gray-300" />);
      }
    }
    
    return <div className="flex">{stars}</div>;
  };
  
  // Filter and sort comments
  const filteredComments = useMemo(() => {
    let filtered = [...result.comments];
    
    // Apply sentiment filter
    if (commentFilter !== 'all') {
      filtered = filtered.filter(comment => comment.sentiment === commentFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOrder === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.score - a.score;
      }
    });
    
    return filtered.slice(0, 10); // Only show first 10 comments
  }, [result.comments, commentFilter, sortOrder]);

  // Create the tab content components
  const overviewTab = useMemo(() => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Sentiment Analysis */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {result.intentions.feature_request.length}
              </div>
              <div className="text-sm text-gray-500">Feature Requests</div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {result.intentions.bug_report.length}
              </div>
              <div className="text-sm text-gray-500">Bug Reports</div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {result.intentions.praise.length}
              </div>
              <div className="text-sm text-gray-500">Praise</div>
            </div>
          </Card>
          <Card className="shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {result.intentions.complaint.length}
              </div>
              <div className="text-sm text-gray-500">Complaints</div>
            </div>
          </Card>
        </div>

        {/* Primary App Sentiment Analysis */}
        <Card className="shadow-sm">
          <h3 className="text-lg font-semibold flex items-center mb-4">
            <ChartPieIcon className="w-5 h-5 mr-2 text-blue-600" />
            {isComparisonMode ? 'Primary App' : ''} Sentiment Analysis
          </h3>
          {renderSentimentBars(result)}
        </Card>

        {/* Comparison Apps Sentiment Analysis */}
        {comparisonResults?.map((compResult, index) => (
          <Card key={index} className="shadow-sm">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <ChartPieIcon className="w-5 h-5 mr-2 text-blue-600" />
              Comparison App {index + 1} Sentiment Analysis
            </h3>
            {renderSentimentBars(compResult)}
          </Card>
        ))}
      </div>

      {/* Right Column - Keywords and Enhanced Stats */}
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

        {/* Enhanced Stats Cards if available */}
        {enhancedResult.userSegments && (
          <Card className="shadow-sm">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
              User Segments
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>New Users</span>
                <Badge color="blue">
                  {enhancedResult.userSegments.newUsers.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Power Users</span>
                <Badge color="purple">
                  {enhancedResult.userSegments.powerUsers.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Returning Users</span>
                <Badge color="green">
                  {enhancedResult.userSegments.returningUsers.length}
                </Badge>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  ), [result, comparisonResults, isComparisonMode]);

  const commentsTab = useMemo(() => (
    <div className="space-y-6">
      {/* Comments Filter Options - Enhanced */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center">
          <FunnelIcon className="w-4 h-4 mr-1 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Filter:</span>
          <Badge 
            color={commentFilter === 'all' ? 'info' : 'gray'} 
            className="cursor-pointer mr-1"
            onClick={() => setCommentFilter('all')}
          >
            All
          </Badge>
          <Badge 
            color={commentFilter === 'positive' ? 'success' : 'gray'} 
            className="cursor-pointer mr-1"
            onClick={() => setCommentFilter('positive')}
          >
            Positive
          </Badge>
          <Badge 
            color={commentFilter === 'negative' ? 'failure' : 'gray'} 
            className="cursor-pointer mr-1"
            onClick={() => setCommentFilter('negative')}
          >
            Negative
          </Badge>
          <Badge 
            color={commentFilter === 'neutral' ? 'purple' : 'gray'} 
            className="cursor-pointer"
            onClick={() => setCommentFilter('neutral')}
          >
            Neutral
          </Badge>
        </div>
        
        <div className="ml-auto flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
              color={sortOrder === 'recent' ? 'blue' : 'gray'}
              size="xs"
              className="rounded-r-none"
              onClick={() => setSortOrder('recent')}
            >
              Most Recent
            </Button>
            <Button
              color={sortOrder === 'rating' ? 'blue' : 'gray'}
              size="xs"
              className="rounded-l-none"
              onClick={() => setSortOrder('rating')}
            >
              Highest Rating
            </Button>
          </div>
        </div>
      </div>

      {/* Comments List - Enhanced with visual elements */}
      <div className="space-y-4">
        {filteredComments.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ChatBubbleLeftIcon className="w-10 h-10 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">No comments match your filter</p>
          </div>
        ) : (
          filteredComments.map(comment => (
            <Card 
              key={comment.id} 
              className="shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-shadow"
              style={{ 
                borderLeftColor: comment.sentiment === 'positive'
                  ? '#10b981' // green-500
                  : comment.sentiment === 'negative'
                  ? '#ef4444' // red-500
                  : '#9ca3af' // gray-400
              }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-medium">{comment.userName || 'Anonymous User'}</div>
                  <div className="flex items-center text-sm text-gray-500">
                    <time dateTime={comment.date}>
                      {new Date(comment.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </time>
                    {comment.version && (
                      <>
                        <span className="mx-1">•</span>
                        <span>v{comment.version}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge
                    color={
                      comment.sentiment === 'positive'
                        ? 'success'
                        : comment.sentiment === 'negative'
                        ? 'failure'
                        : 'purple'
                    }
                    className="capitalize"
                  >
                    {comment.sentiment}
                  </Badge>
                  <div className="mt-2 flex items-center">
                    {renderStarRating(comment.score)}
                  </div>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center text-sm text-gray-500">
                <HandThumbUpIcon className="w-4 h-4 mr-1" />
                <span>{comment.thumbsUp} {comment.thumbsUp === 1 ? 'like' : 'likes'}</span>
                {comment.intentions && comment.intentions.length > 0 && (
                  <div className="ml-auto">
                    {comment.intentions.map(intention => (
                      <Badge key={intention} color="light" className="ml-1 text-xs">
                        {intention.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination - Enhanced */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-500">
          Showing {filteredComments.length} of {
            commentFilter === 'all' 
              ? result.comments.length 
              : result.comments.filter(c => c.sentiment === commentFilter).length
          } comments
        </div>
        <Button.Group>
          <Button color="gray">Previous</Button>
          <Button color="blue">1</Button>
          <Button color="gray">2</Button>
          <Button color="gray">3</Button>
          <Button color="gray">Next</Button>
        </Button.Group>
      </div>
    </div>
  ), [result.comments, commentFilter, sortOrder, filteredComments]);
  
  // Define tabs for the content component
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview",
      icon: <ChartPieIcon className="w-4 h-4" />,
      content: overviewTab
    },
    {
      id: "comments",
      label: "Recent Comments",
      icon: <ChatBubbleLeftIcon className="w-4 h-4" />,
      content: commentsTab
    }
  ];

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
      
      {/* Content Component with Tabs */}
      <AnalysisContent tabs={tabs} />
    </div>
  );
}
