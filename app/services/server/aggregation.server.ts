/**
 * Data Aggregation & Results Generation
 * Transform raw analysis into actionable insights with trend detection
 */

import { AnalyzedComment, AnalysisResult } from './analysis.server';
import { ClassificationResult, FeatureCluster, BugCluster } from './classification.server';

/**
 * Time period for trend analysis
 */
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Data point for trend analysis
 */
export interface TrendDataPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
  average: number;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  timePeriod: TimePeriod;
  dataPoints: TrendDataPoint[];
  trend: 'improving' | 'declining' | 'stable';
  percentChange: number;
}

/**
 * Rating distribution
 */
export interface RatingDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  average: number;
  total: number;
}

/**
 * Feature trend data
 */
export interface FeatureTrend {
  feature: string;
  periods: Array<{
    date: string;
    count: number;
    sentiment: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Bug trend data
 */
export interface BugTrend {
  bug: string;
  periods: Array<{
    date: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  status: 'new' | 'recurring' | 'increasing' | 'decreasing';
}

/**
 * User segment distribution
 */
export interface UserSegmentDistribution {
  newUsers: number;
  powerUsers: number;
  returningUsers: number;
  unknownUsers: number;
  total: number;
}

/**
 * Insight with actionable recommendation
 */
export interface Insight {
  id: string;
  type: 'feature' | 'bug' | 'sentiment' | 'competitor' | 'user';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  data?: any;
  recommendation?: string;
}

/**
 * Aggregated results
 */
export interface AggregatedResults {
  summary: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: RatingDistribution;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    userSegmentDistribution: UserSegmentDistribution;
  };
  trends: {
    overall: TrendAnalysis;
    features: FeatureTrend[];
    bugs: BugTrend[];
  };
  topFeatures: FeatureCluster[];
  criticalBugs: BugCluster[];
  competitorInsights: Array<{
    competitor: string;
    mentions: number;
    sentiment: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  insights: Insight[];
  exportData: {
    csv: string;
    json: string;
  };
}

/**
 * Aggregation options
 */
export interface AggregationOptions {
  timePeriod?: TimePeriod;
  maxDataPoints?: number;
  maxInsights?: number;
  maxFeatures?: number;
  maxBugs?: number;
  includeExportData?: boolean;
}

/**
 * Data Aggregation Service
 */
export class AggregationService {
  /**
   * Default aggregation options
   */
  private static readonly DEFAULT_OPTIONS: AggregationOptions = {
    timePeriod: 'week',
    maxDataPoints: 12,
    maxInsights: 10,
    maxFeatures: 5,
    maxBugs: 5,
    includeExportData: true
  };

  /**
   * Group comments by time period
   * @param comments Array of analyzed comments
   * @param timePeriod Time period for grouping
   * @param maxDataPoints Maximum number of data points
   * @returns Map of date strings to comments
   */
  private static groupCommentsByTimePeriod(
    comments: AnalyzedComment[],
    timePeriod: TimePeriod,
    maxDataPoints: number
  ): Map<string, AnalyzedComment[]> {
    const groupedComments = new Map<string, AnalyzedComment[]>();
    
    // Sort comments by date (newest first)
    const sortedComments = [...comments].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Determine date format and grouping function
    let formatDate: (date: Date) => string;
    let getNextPeriodStart: (date: Date) => Date;
    
    switch (timePeriod) {
      case 'day':
        formatDate = (date: Date) => date.toISOString().split('T')[0];
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setDate(date.getDate() - 1);
          return next;
        };
        break;
      case 'week':
        formatDate = (date: Date) => {
          const startOfWeek = new Date(date);
          const day = date.getDay();
          const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          startOfWeek.setDate(diff);
          return startOfWeek.toISOString().split('T')[0];
        };
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setDate(date.getDate() - 7);
          return next;
        };
        break;
      case 'month':
        formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setMonth(date.getMonth() - 1);
          return next;
        };
        break;
      case 'quarter':
        formatDate = (date: Date) => {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `${date.getFullYear()}-Q${quarter}`;
        };
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setMonth(date.getMonth() - 3);
          return next;
        };
        break;
      case 'year':
        formatDate = (date: Date) => `${date.getFullYear()}`;
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setFullYear(date.getFullYear() - 1);
          return next;
        };
        break;
      default:
        formatDate = (date: Date) => date.toISOString().split('T')[0];
        getNextPeriodStart = (date: Date) => {
          const next = new Date(date);
          next.setDate(date.getDate() - 1);
          return next;
        };
    }
    
    // Generate periods
    const periods: string[] = [];
    let currentDate = new Date();
    
    for (let i = 0; i < maxDataPoints; i++) {
      const periodKey = formatDate(currentDate);
      periods.push(periodKey);
      groupedComments.set(periodKey, []);
      currentDate = getNextPeriodStart(currentDate);
    }
    
    // Group comments by period
    for (const comment of sortedComments) {
      const commentDate = new Date(comment.date);
      const periodKey = formatDate(commentDate);
      
      if (groupedComments.has(periodKey)) {
        groupedComments.get(periodKey)!.push(comment);
      }
    }
    
    return groupedComments;
  }

  /**
   * Generate trend data points from grouped comments
   * @param groupedComments Map of date strings to comments
   * @returns Array of trend data points
   */
  private static generateTrendDataPoints(
    groupedComments: Map<string, AnalyzedComment[]>
  ): TrendDataPoint[] {
    const dataPoints: TrendDataPoint[] = [];
    
    // Sort periods chronologically
    const sortedPeriods = Array.from(groupedComments.keys()).sort();
    
    for (const period of sortedPeriods) {
      const comments = groupedComments.get(period) || [];
      const positive = comments.filter(c => c.sentiment === 'positive').length;
      const negative = comments.filter(c => c.sentiment === 'negative').length;
      const neutral = comments.filter(c => c.sentiment === 'neutral').length;
      const total = comments.length;
      
      // Calculate average rating
      const average = total > 0 
        ? comments.reduce((sum, c) => sum + c.score, 0) / total 
        : 0;
      
      dataPoints.push({
        date: period,
        positive,
        negative,
        neutral,
        total,
        average
      });
    }
    
    return dataPoints;
  }

  /**
   * Analyze trend direction and calculate percent change
   * @param dataPoints Array of trend data points
   * @returns Trend analysis
   */
  private static analyzeTrend(dataPoints: TrendDataPoint[]): { trend: 'improving' | 'declining' | 'stable'; percentChange: number } {
    if (dataPoints.length < 2) {
      return { trend: 'stable', percentChange: 0 };
    }
    
    // Calculate weighted average for first and last half of the data
    const midpoint = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, midpoint);
    const secondHalf = dataPoints.slice(midpoint);
    
    // Calculate weighted averages (more recent periods have higher weight)
    let firstHalfSum = 0;
    let firstHalfWeightSum = 0;
    let secondHalfSum = 0;
    let secondHalfWeightSum = 0;
    
    firstHalf.forEach((point, index) => {
      const weight = index + 1;
      firstHalfSum += point.average * weight;
      firstHalfWeightSum += weight;
    });
    
    secondHalf.forEach((point, index) => {
      const weight = index + 1;
      secondHalfSum += point.average * weight;
      secondHalfWeightSum += weight;
    });
    
    const firstHalfAvg = firstHalfSum / firstHalfWeightSum;
    const secondHalfAvg = secondHalfSum / secondHalfWeightSum;
    
    // Calculate percent change
    const percentChange = firstHalfAvg !== 0 
      ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 
      : 0;
    
    // Determine trend direction
    let trend: 'improving' | 'declining' | 'stable';
    
    if (percentChange > 5) {
      trend = 'improving';
    } else if (percentChange < -5) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }
    
    return { trend, percentChange };
  }

  /**
   * Generate feature trends
   * @param featureClusters Array of feature clusters
   * @param groupedComments Map of date strings to comments
   * @returns Array of feature trends
   */
  private static generateFeatureTrends(
    featureClusters: FeatureCluster[],
    groupedComments: Map<string, AnalyzedComment[]>
  ): FeatureTrend[] {
    const featureTrends: FeatureTrend[] = [];
    
    // Sort periods chronologically
    const sortedPeriods = Array.from(groupedComments.keys()).sort();
    
    for (const cluster of featureClusters) {
      const periods: Array<{ date: string; count: number; sentiment: number }> = [];
      
      for (const period of sortedPeriods) {
        const comments = groupedComments.get(period) || [];
        
        // Count comments that mention any of the feature requests in this cluster
        let count = 0;
        let sentimentSum = 0;
        
        for (const comment of comments) {
          for (const request of comment.featureRequests) {
            if (cluster.requests.includes(request)) {
              count++;
              sentimentSum += comment.score;
              break; // Count each comment only once
            }
          }
        }
        
        periods.push({
          date: period,
          count,
          sentiment: count > 0 ? sentimentSum / count : 0
        });
      }
      
      // Determine trend
      const counts = periods.map(p => p.count);
      const trend = this.determineTrend(counts);
      
      featureTrends.push({
        feature: cluster.name,
        periods,
        trend
      });
    }
    
    return featureTrends;
  }

  /**
   * Generate bug trends
   * @param bugClusters Array of bug clusters
   * @param groupedComments Map of date strings to comments
   * @returns Array of bug trends
   */
  private static generateBugTrends(
    bugClusters: BugCluster[],
    groupedComments: Map<string, AnalyzedComment[]>
  ): BugTrend[] {
    const bugTrends: BugTrend[] = [];
    
    // Sort periods chronologically
    const sortedPeriods = Array.from(groupedComments.keys()).sort();
    
    for (const cluster of bugClusters) {
      const periods: Array<{ date: string; count: number; severity: 'low' | 'medium' | 'high' }> = [];
      
      for (const period of sortedPeriods) {
        const comments = groupedComments.get(period) || [];
        
        // Count comments that mention any of the bug reports in this cluster
        let count = 0;
        let highSeverity = 0;
        let mediumSeverity = 0;
        
        for (const comment of comments) {
          for (const report of comment.bugReports) {
            if (cluster.reports.includes(report)) {
              count++;
              
              if (comment.severity === 'high') highSeverity++;
              else if (comment.severity === 'medium') mediumSeverity++;
              
              break; // Count each comment only once
            }
          }
        }
        
        // Determine severity for this period
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (highSeverity > 0) severity = 'high';
        else if (mediumSeverity > 0) severity = 'medium';
        
        periods.push({
          date: period,
          count,
          severity
        });
      }
      
      // Determine trend
      const counts = periods.map(p => p.count);
      const trend = this.determineTrend(counts);
      
      // Determine status
      const status = this.determineBugStatus(counts);
      
      bugTrends.push({
        bug: cluster.name,
        periods,
        trend,
        status
      });
    }
    
    return bugTrends;
  }

  /**
   * Determine trend direction from counts
   * @param counts Array of counts
   * @returns Trend direction
   */
  private static determineTrend(counts: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (counts.length < 2) return 'stable';
    
    // Calculate weighted average for first and last half
    const midpoint = Math.floor(counts.length / 2);
    const firstHalf = counts.slice(0, midpoint);
    const secondHalf = counts.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length;
    
    // Determine trend direction
    if (secondHalfAvg > firstHalfAvg * 1.2) {
      return 'increasing';
    } else if (secondHalfAvg < firstHalfAvg * 0.8) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Determine bug status from counts
   * @param counts Array of counts
   * @returns Bug status
   */
  private static determineBugStatus(counts: number[]): 'new' | 'recurring' | 'increasing' | 'decreasing' {
    if (counts.length <= 1) return 'new';
    
    // Check if bug is new (only in most recent period)
    if (counts[0] > 0 && counts.slice(1).every(count => count === 0)) {
      return 'new';
    }
    
    // Check if bug is increasing
    if (this.determineTrend(counts) === 'increasing') {
      return 'increasing';
    }
    
    // Check if bug is decreasing
    if (this.determineTrend(counts) === 'decreasing') {
      return 'decreasing';
    }
    
    // Otherwise it's recurring
    return 'recurring';
  }

  /**
   * Calculate rating distribution
   * @param comments Array of analyzed comments
   * @returns Rating distribution
   */
  private static calculateRatingDistribution(comments: AnalyzedComment[]): RatingDistribution {
    const distribution = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      average: 0,
      total: comments.length
    };
    
    let sum = 0;
    
    for (const comment of comments) {
      const rating = Math.round(comment.score);
      const validRating = Math.min(Math.max(rating, 1), 5);
      
      const ratingKey = String(validRating) as keyof Pick<RatingDistribution, '1' | '2' | '3' | '4' | '5'>;
      distribution[ratingKey]++;
      
      sum += comment.score;
    }
    
    distribution.average = comments.length > 0 ? sum / comments.length : 0;
    
    return distribution;
  }

  /**
   * Calculate user segment distribution
   * @param comments Array of analyzed comments
   * @returns User segment distribution
   */
  private static calculateUserSegmentDistribution(comments: AnalyzedComment[]): UserSegmentDistribution {
    const distribution = {
      newUsers: 0,
      powerUsers: 0,
      returningUsers: 0,
      unknownUsers: 0,
      total: comments.length
    };
    
    for (const comment of comments) {
      switch (comment.userType) {
        case 'new':
          distribution.newUsers++;
          break;
        case 'power':
          distribution.powerUsers++;
          break;
        case 'returning':
          distribution.returningUsers++;
          break;
        default:
          distribution.unknownUsers++;
      }
    }
    
    return distribution;
  }

  /**
   * Generate insights from analysis and classification
   * @param analysis Analysis result
   * @param classification Classification result
   * @param trendAnalysis Trend analysis
   * @param maxInsights Maximum number of insights
   * @returns Array of insights
   */
  private static generateInsights(
    analysis: AnalysisResult,
    classification: ClassificationResult,
    trendAnalysis: TrendAnalysis,
    maxInsights: number
  ): Insight[] {
    const insights: Insight[] = [];
    
    // Sentiment trend insight
    if (trendAnalysis.trend !== 'stable') {
      insights.push({
        id: 'sentiment-trend',
        type: 'sentiment',
        title: `Overall sentiment is ${trendAnalysis.trend}`,
        description: `The overall sentiment has ${trendAnalysis.trend === 'improving' ? 'increased' : 'decreased'} by ${Math.abs(trendAnalysis.percentChange).toFixed(1)}% over the analyzed period.`,
        priority: Math.abs(trendAnalysis.percentChange) > 15 ? 'high' : 'medium',
        data: trendAnalysis,
        recommendation: trendAnalysis.trend === 'improving' 
          ? 'Continue the positive momentum by maintaining recent improvements.'
          : 'Investigate the causes of declining sentiment and address user concerns.'
      });
    }
    
    // Top feature requests
    classification.topFeatureRequests.slice(0, 3).forEach((feature, index) => {
      insights.push({
        id: `feature-${index}`,
        type: 'feature',
        title: `High demand for: ${feature.name}`,
        description: `${feature.count} users have requested this feature with an average rating of ${feature.averageRating.toFixed(1)}.`,
        priority: feature.priority,
        data: feature,
        recommendation: `Consider prioritizing the development of this feature to improve user satisfaction.`
      });
    });
    
    // Critical bugs
    classification.criticalBugs.slice(0, 3).forEach((bug, index) => {
      insights.push({
        id: `bug-${index}`,
        type: 'bug',
        title: `Critical issue: ${bug.name}`,
        description: `${bug.count} users have reported this issue with ${bug.severity} severity.`,
        priority: 'high',
        data: bug,
        recommendation: `Prioritize fixing this issue to improve user experience and ratings.`
      });
    });
    
    // Competitor insights
    classification.competitorAnalysis.slice(0, 2).forEach((competitor, index) => {
      if (competitor.mentions >= 5) {
        insights.push({
          id: `competitor-${index}`,
          type: 'competitor',
          title: `Users comparing with ${competitor.competitor}`,
          description: `${competitor.mentions} users mentioned ${competitor.competitor} in their reviews.`,
          priority: competitor.mentions > 20 ? 'high' : 'medium',
          data: competitor,
          recommendation: competitor.sentiment > 3.5
            ? `Analyze what users prefer about your app compared to ${competitor.competitor}.`
            : `Investigate features from ${competitor.competitor} that users prefer.`
        });
      }
    });
    
    // User segment insights
    const userSegments = analysis.userSegments;
    if (userSegments.newUsers.length > userSegments.powerUsers.length * 2) {
      insights.push({
        id: 'user-new',
        type: 'user',
        title: 'High proportion of new users',
        description: `${userSegments.newUsers.length} new users compared to ${userSegments.powerUsers.length} power users.`,
        priority: 'medium',
        recommendation: 'Focus on improving onboarding and first-time user experience.'
      });
    } else if (userSegments.powerUsers.length > userSegments.newUsers.length * 2) {
      insights.push({
        id: 'user-power',
        type: 'user',
        title: 'Strong base of power users',
        description: `${userSegments.powerUsers.length} power users compared to ${userSegments.newUsers.length} new users.`,
        priority: 'medium',
        recommendation: 'Consider adding advanced features to retain power users while improving acquisition.'
      });
    }
    
    // Sort insights by priority and limit
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, maxInsights);
  }

  /**
   * Generate export data in CSV and JSON formats
   * @param comments Analyzed comments
   * @param analysis Analysis results
   * @param classification Classification results
   * @returns Export data in CSV and JSON formats
   */
  private static generateExportData(
    comments: AnalyzedComment[],
    analysis: AnalysisResult,
    classification: ClassificationResult
  ): { csv: string; json: string } {
    // Generate CSV
    const csvHeader = 'ID,User,Date,Score,Sentiment,Content,Intentions,Keywords\n';
    const csvRows = comments.map(comment => {
      const intentions = comment.intentions.join(';');
      const keywords = comment.keywords.join(';');
      const content = comment.content.replace(/"/g, '""').replace(/,/g, '","');
      
      return `"${comment.id}","${comment.userName}","${comment.date}",${comment.score},"${comment.sentiment}","${content}","${intentions}","${keywords}"`;
    });
    
    const csv = csvHeader + csvRows.join('\n');
    
    // Generate JSON
    const jsonData = {
      summary: {
        totalReviews: comments.length,
        sentiment: analysis.sentiment,
        topKeywords: analysis.keywords.slice(0, 20),
        topFeatures: classification.topFeatureRequests.slice(0, 10),
        topBugs: classification.criticalBugs.slice(0, 10)
      },
      reviews: comments.map(comment => ({
        id: comment.id,
        userName: comment.userName,
        date: comment.date,
        score: comment.score,
        sentiment: comment.sentiment,
        content: comment.content,
        intentions: comment.intentions,
        keywords: comment.keywords,
        thumbsUp: comment.thumbsUp
      }))
    };
    
    const json = JSON.stringify(jsonData);
    
    return { csv, json };
  }

  /**
   * Aggregate analysis and classification results
   * @param comments Array of analyzed comments
   * @param analysis Analysis result
   * @param classification Classification result
   * @param options Aggregation options
   * @returns Aggregated results
   */
  public static aggregateResults(
    comments: AnalyzedComment[],
    analysis: AnalysisResult,
    classification: ClassificationResult,
    options: AggregationOptions = {}
  ): AggregatedResults {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Group comments by time period
    const groupedComments = this.groupCommentsByTimePeriod(
      comments,
      opts.timePeriod || 'week',
      opts.maxDataPoints || 12
    );
    
    // Generate trend data points
    const trendDataPoints = this.generateTrendDataPoints(groupedComments);
    
    // Analyze overall trend
    const { trend, percentChange } = this.analyzeTrend(trendDataPoints);
    
    // Generate feature trends
    const featureTrends = this.generateFeatureTrends(
      classification.topFeatureRequests,
      groupedComments
    );
    
    // Generate bug trends
    const bugTrends = this.generateBugTrends(
      classification.criticalBugs,
      groupedComments
    );
    
    // Calculate rating distribution
    const ratingDistribution = this.calculateRatingDistribution(comments);
    
    // Calculate user segment distribution
    const userSegmentDistribution = this.calculateUserSegmentDistribution(comments);
    
    // Generate insights
    const insights = this.generateInsights(
      analysis,
      classification,
      { timePeriod: opts.timePeriod || 'week', dataPoints: trendDataPoints, trend, percentChange },
      opts.maxInsights || 10
    );
    
    // Generate export data if requested
    const exportData = opts.includeExportData
      ? this.generateExportData(comments, analysis, classification)
      : { csv: '', json: '' };
    
    // Compile competitor insights
    const competitorInsights = classification.competitorAnalysis.map(competitor => ({
      competitor: competitor.competitor,
      mentions: competitor.mentions,
      sentiment: competitor.sentiment,
      strengths: competitor.features.better,
      weaknesses: competitor.features.worse
    }));
    
    // Return aggregated results
    return {
      summary: {
        totalReviews: comments.length,
        averageRating: ratingDistribution.average,
        ratingDistribution,
        sentimentDistribution: {
          positive: analysis.sentiment.positive,
          negative: analysis.sentiment.negative,
          neutral: analysis.sentiment.neutral
        },
        userSegmentDistribution
      },
      trends: {
        overall: {
          timePeriod: opts.timePeriod || 'week',
          dataPoints: trendDataPoints,
          trend,
          percentChange
        },
        features: featureTrends.slice(0, opts.maxFeatures || 5),
        bugs: bugTrends.slice(0, opts.maxBugs || 5)
      },
      topFeatures: classification.topFeatureRequests.slice(0, opts.maxFeatures || 5),
      criticalBugs: classification.criticalBugs.slice(0, opts.maxBugs || 5),
      competitorInsights,
      insights,
      exportData
    };
  }
} 