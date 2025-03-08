import { Card, Badge } from "flowbite-react";
import { 
  ChartPieIcon, 
  ChatBubbleLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { EnhancedAnalysisProps, AnalysisResult, EnhancedAnalysisResult } from "~/types/analysis";

export function AnalysisOverview({ result, comparisonResults }: EnhancedAnalysisProps) {
  const enhancedResult = result as EnhancedAnalysisResult;
  const enhancedComparisonResults = comparisonResults as EnhancedAnalysisResult[] | undefined;
  
  const isComparisonMode = !!comparisonResults?.length;

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

  return (
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
  );
}
