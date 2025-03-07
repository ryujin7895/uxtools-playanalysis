import { Card, Button, Badge } from "flowbite-react";
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { AnalysisResult } from "~/types/analysis";

interface AnalysisResultsProps {
  onReset: () => void;
  appCount: number;
  result: AnalysisResult;
  comparisonResults?: AnalysisResult[];
}

export function AnalysisResults({ onReset, appCount, result, comparisonResults }: AnalysisResultsProps) {
  const isComparisonMode = !!comparisonResults?.length;
  const totalComments = result.comments.length + (comparisonResults?.reduce((sum, r) => sum + r.comments.length, 0) || 0);

  return (
    <Card className="w-full shadow-sm rounded-2xl">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Analysis Results
            {isComparisonMode && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-blue-900 dark:text-blue-300">
                Comparison Mode
              </span>
            )}
          </h2>
          <Button color="light" onClick={onReset} className="flex items-center shadow-sm hover:shadow transition-shadow">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{new Date().toLocaleDateString()}</span>
          <span>•</span>
          <Badge color="gray" className="px-2.5 py-0.5">
            {appCount} {appCount > 1 ? 'apps' : 'app'}
          </Badge>
          <span>•</span>
          <span>{totalComments} comments analyzed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary App Sentiment Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {isComparisonMode ? 'Primary App' : ''} Sentiment Analysis
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Positive</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full" 
                    style={{ width: `${(result.sentiment.positive / result.comments.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm">{result.sentiment.positive}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Negative</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full" 
                    style={{ width: `${(result.sentiment.negative / result.comments.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm">{result.sentiment.negative}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Neutral</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                  <div 
                    className="bg-gray-500 h-2.5 rounded-full" 
                    style={{ width: `${(result.sentiment.neutral / result.comments.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm">{result.sentiment.neutral}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Apps Sentiment Analysis */}
        {comparisonResults?.map((compResult, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-lg font-semibold">
              Comparison App {index + 1} Sentiment Analysis
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Positive</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: `${(compResult.sentiment.positive / compResult.comments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{compResult.sentiment.positive}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Negative</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-red-500 h-2.5 rounded-full" 
                      style={{ width: `${(compResult.sentiment.negative / compResult.comments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{compResult.sentiment.negative}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Neutral</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                    <div 
                      className="bg-gray-500 h-2.5 rounded-full" 
                      style={{ width: `${(compResult.sentiment.neutral / compResult.comments.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{compResult.sentiment.neutral}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Keywords */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Top Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {result.keywords.map(({ word, count }) => (
              <Badge key={word} color="info" className="text-sm">
                {word} ({count})
              </Badge>
            ))}
          </div>
        </div>

        {/* User Intentions */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">User Intentions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.intentions.feature_request.length}
                </div>
                <div className="text-sm text-gray-500">Feature Requests</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.intentions.bug_report.length}
                </div>
                <div className="text-sm text-gray-500">Bug Reports</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.intentions.praise.length}
                </div>
                <div className="text-sm text-gray-500">Praise</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.intentions.complaint.length}
                </div>
                <div className="text-sm text-gray-500">Complaints</div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Comments */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold">Recent Comments</h3>
          <div className="space-y-4">
            {result.comments.slice(0, 5).map(comment => (
              <Card key={comment.id}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="font-medium">{comment.userName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(comment.date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    color={
                      comment.sentiment === 'positive'
                        ? 'success'
                        : comment.sentiment === 'negative'
                        ? 'failure'
                        : 'gray'
                    }
                  >
                    {comment.sentiment}
                  </Badge>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-300">{comment.content}</p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Rating: {comment.score}/5</span>
                  <span>• {comment.thumbsUp} likes</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
