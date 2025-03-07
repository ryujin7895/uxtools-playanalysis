import { Card, Button, Badge, Accordion } from "flowbite-react";
import { ArrowPathIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import type { AnalysisResult, Comment } from "~/types/analysis";

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

  // Helper function to check if result has enhanced data
  const hasEnhancedData = (res: AnalysisResult | EnhancedAnalysisResult): boolean => {
    const enhanced = res as EnhancedAnalysisResult;
    return !!(enhanced.featureRequests || enhanced.bugReports || 
              enhanced.userSegments || enhanced.competitiveMentions);
  };

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

        {/* Enhanced Analysis Sections - only show if data exists */}
        {hasEnhancedData(result) && (
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold">Advanced Analysis</h3>
            
            {/* Feature Requests Analysis */}
            {enhancedResult.featureRequests && enhancedResult.featureRequests.length > 0 && (
              <Accordion>
                <Accordion.Panel>
                  <Accordion.Title>
                    Feature Requests ({enhancedResult.featureRequests.length})
                  </Accordion.Title>
                  <Accordion.Content>
                    <div className="space-y-4">
                      {enhancedResult.featureRequests.slice(0, 5).map((item, idx) => (
                        <Card key={idx} className="overflow-hidden">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.feature}</h4>
                            <Badge color="blue">
                              {item.count} {item.count === 1 ? 'mention' : 'mentions'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">Avg. rating: {item.averageRating.toFixed(1)}/5</div>
                          {item.examples.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm font-medium">Example comment:</div>
                              <p className="text-sm italic text-gray-600 mt-1 border-l-2 border-gray-200 pl-3">
                                "{item.examples[0]}"
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            )}
            
            {/* Bug Reports Analysis */}
            {enhancedResult.bugReports && enhancedResult.bugReports.length > 0 && (
              <Accordion>
                <Accordion.Panel>
                  <Accordion.Title>
                    Bug Reports ({enhancedResult.bugReports.length})
                  </Accordion.Title>
                  <Accordion.Content>
                    <div className="space-y-4">
                      {enhancedResult.bugReports.slice(0, 5).map((item, idx) => (
                        <Card key={idx} className="overflow-hidden">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{item.issue}</h4>
                            <Badge color={item.severity === 'high' ? 'failure' : item.severity === 'medium' ? 'warning' : 'gray'}>
                              {item.severity} severity
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{item.count} {item.count === 1 ? 'report' : 'reports'}</div>
                          {item.examples.length > 0 && (
                            <div className="mt-2">
                              <div className="text-sm font-medium">Example report:</div>
                              <p className="text-sm italic text-gray-600 mt-1 border-l-2 border-gray-200 pl-3">
                                "{item.examples[0]}"
                              </p>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            )}
            
            {/* User Segments Analysis */}
            {enhancedResult.userSegments && (
              <Accordion>
                <Accordion.Panel>
                  <Accordion.Title>
                    User Segments Analysis
                  </Accordion.Title>
                  <Accordion.Content>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <h4 className="text-center font-medium">New Users</h4>
                        <div className="text-center text-2xl font-bold text-blue-600">
                          {enhancedResult.userSegments.newUsers.length}
                        </div>
                      </Card>
                      <Card>
                        <h4 className="text-center font-medium">Power Users</h4>
                        <div className="text-center text-2xl font-bold text-purple-600">
                          {enhancedResult.userSegments.powerUsers.length}
                        </div>
                      </Card>
                      <Card>
                        <h4 className="text-center font-medium">Returning Users</h4>
                        <div className="text-center text-2xl font-bold text-green-600">
                          {enhancedResult.userSegments.returningUsers.length}
                        </div>
                      </Card>
                    </div>
                  </Accordion.Content>
                </Accordion.Panel>
              </Accordion>
            )}
          </div>
        )}

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
