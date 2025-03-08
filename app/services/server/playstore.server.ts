import type { AnalysisResult, Comment } from '~/types/analysis';
import { generateTrendData } from '~/utils/trendAnalysis';

// @ts-ignore
const gplayModule = require('google-play-scraper');
const gplay = gplayModule.default;

// Simple sentiment word lists
const POSITIVE_WORDS = new Set([
  'good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'perfect', 'best',
  'helpful', 'fantastic', 'wonderful', 'superb', 'brilliant', 'outstanding'
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'waste', 'useless',
  'disappointed', 'frustrating', 'annoying', 'slow', 'crash', 'bug'
]);

interface PlayStoreReview {
  id: string;
  userName: string;
  text: string;
  score: number;
  thumbsUp: number;
  date: string;
}

interface ReviewBatch {
  data: PlayStoreReview[];
  nextPaginationToken?: string;
}

interface AppMetadata {
  title: string;
  description: string;
  summary: string;
  installs: string;
  minInstalls: number;
  score: number;
  ratings: number;
  reviews: number;
  price: number;
  free: boolean;
  currency: string;
  size: string;
  androidVersion: string;
  developer: string;
  developerEmail: string;
  developerWebsite: string;
  updated: Date;
  version: string;
  genre: string;
  genreId: string;
  familyGenre: string;
  familyGenreId: string;
  categories: string[];
  histogram: { [key: string]: number }; // Rating distribution (1-5)
  priceText: string;
  contentRating: string;
  adSupported: boolean;
  containsAds: boolean;
  recentChanges: string;
  similarApps: string[];
}

interface EnhancedAnalysisResult extends AnalysisResult {
  featureRequests: FeatureRequestAnalysis[];
  bugReports: BugReportAnalysis[];
  userSegments: UserSegmentAnalysis;
  competitiveMentions: CompetitiveMention[];
  trends: any; // Add trends to the result
}

interface FeatureRequestAnalysis {
  feature: string;
  count: number;
  examples: string[];
  averageRating: number;
}

interface BugReportAnalysis {
  issue: string;
  count: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}

interface UserSegmentAnalysis {
  newUsers: Comment[];
  powerUsers: Comment[];
  returningUsers: Comment[];
}

interface CompetitiveMention {
  competitor: string;
  mentions: Comment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export class PlayStoreService {
  private static extractAppId(input: string): string {
    if (input.includes('id=')) {
      return input.split('id=')[1]?.split('&')[0] || '';
    }
    return input;
  }

  private static parseDateRange(dateRange: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      case 'custom':
        // Handle custom date range - for now defaulting to 30 days
        startDate.setDate(endDate.getDate() - 30);
        break;
      default:
        // Default to 30 days if invalid value
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private static isCommentInDateRange(commentDate: Date, startDate: Date, endDate: Date): boolean {
    return commentDate >= startDate && commentDate <= endDate;
  }

  private static analyzeComment(text: string): { sentiment: Comment['sentiment']; keywords: string[] } {
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (POSITIVE_WORDS.has(word)) positiveCount++;
      if (NEGATIVE_WORDS.has(word)) negativeCount++;
    });

    let sentiment: Comment['sentiment'] = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    // Simple keyword extraction - just use words that appear
    const keywords = Array.from(new Set(words));

    return { sentiment, keywords };
  }

  private static analyzeCommentEnhanced(text: string, score: number): {
    sentiment: Comment['sentiment']; 
    keywords: string[];
    featureRequests: string[];
    bugReports: string[];
    competitorMentions: string[];
    userType: 'new' | 'power' | 'returning' | 'unknown';
  } {
    // Existing sentiment analysis
    const { sentiment, keywords } = this.analyzeComment(text);
    
    // Feature request detection
    const featureRequestPatterns = [
      /wish(?:ed)? (?:it |there was |you |they |had |for )(.{3,50})/i,
      /need(?:s)? (?:to |a |an |more )(.{3,50})/i,
      /add(?:ing)? (.{3,50}) would/i,
      /please (?:add|include) (.{3,50})/i
    ];
    
    // Bug detection
    const bugPatterns = [
      /(?:crash|bug|error|issue|problem)(?:es|s)? (?:with|when|during) (.{3,50})/i,
      /(?:doesn't|does not|won't|will not|can't|cannot) (.{3,50})/i,
      /(?:broken|not working|fails|failed) (.{3,50})/i
    ];
    
    // Popular competitors to detect
    const competitors = ['facebook', 'instagram', 'tiktok', 'snapchat', 'twitter', 'whatsapp', 'messenger', 'signal', 'telegram'];
    
    // User type detection
    const newUserPatterns = ['just downloaded', 'first time', 'new to this', 'recently started'];
    const powerUserPatterns = ['long time user', 'been using for years', 'daily user', 'power user', 'premium user'];
    const returningUserPatterns = ['came back', 'returned to', 'giving another try', 'reinstalled'];
    
    // Extract feature requests
    const featureRequests: string[] = [];
    featureRequestPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) featureRequests.push(match[1].trim());
    });
    
    // Extract bug reports
    const bugReports: string[] = [];
    bugPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) bugReports.push(match[1].trim());
    });
    
    // Detect competitor mentions
    const competitorMentions = competitors.filter(competitor => 
      text.toLowerCase().includes(competitor)
    );
    
    // Determine user type
    let userType: 'new' | 'power' | 'returning' | 'unknown' = 'unknown';
    if (newUserPatterns.some(pattern => text.toLowerCase().includes(pattern))) {
      userType = 'new';
    } else if (powerUserPatterns.some(pattern => text.toLowerCase().includes(pattern))) {
      userType = 'power';
    } else if (returningUserPatterns.some(pattern => text.toLowerCase().includes(pattern))) {
      userType = 'returning';
    }
    
    return {
      sentiment,
      keywords,
      featureRequests,
      bugReports,
      competitorMentions,
      userType
    };
  }

  private static categorizeIntention(text: string, sentiment: Comment['sentiment']): string[] {
    const intentions: string[] = [];
    const lowerText = text.toLowerCase();

    const patterns = {
      feature_request: ['add', 'would be nice', 'should have', 'need', 'missing', 'please add'],
      bug_report: ['bug', 'crash', 'error', 'issue', 'problem', 'not working', 'fix'],
      praise: ['great', 'awesome', 'love', 'excellent', 'perfect', 'amazing'],
      complaint: ['bad', 'terrible', 'poor', 'waste', 'disappointed', 'awful']
    };

    Object.entries(patterns).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        intentions.push(category);
      }
    });

    // If no specific intention is detected, categorize based on sentiment
    if (intentions.length === 0) {
      if (sentiment === 'positive') intentions.push('praise');
      else if (sentiment === 'negative') intentions.push('complaint');
    }

    return intentions;
  }

  static async fetchComments(appIdOrUrl: string, dateRange: string): Promise<EnhancedAnalysisResult> {
    const appId = this.extractAppId(appIdOrUrl);
    const { startDate, endDate } = this.parseDateRange(dateRange);
    
    let allReviews: PlayStoreReview[] = [];
    let nextPaginationToken: string | undefined;
    const maxReviews = 5000;
    let reachedEnd = false;

    try {
      console.log('==================== DEBUG LOGS ====================');
      console.log('gplayModule:', gplayModule);
      console.log('gplayModule type:', typeof gplayModule);
      console.log('gplayModule keys:', Object.keys(gplayModule));
      console.log('gplay (default):', gplay);
      console.log('gplay type:', typeof gplay);
      console.log('gplay keys:', gplay ? Object.keys(gplay) : 'null');
      console.log('=================================================');
      
      do {
        const reviewBatch = await gplay.reviews({
          appId,
          sort: 2, // NEWEST
          num: 150,
          paginate: true,
          nextPaginationToken,
        }) as ReviewBatch;

        if (!reviewBatch?.data?.length) {
          reachedEnd = true;
          break;
        }

        const filteredReviews = reviewBatch.data.filter((review: PlayStoreReview) => {
          const reviewDate = new Date(review.date);
          return this.isCommentInDateRange(reviewDate, startDate, endDate);
        });

        allReviews = allReviews.concat(filteredReviews);
        nextPaginationToken = reviewBatch.nextPaginationToken;

        if (allReviews.length >= maxReviews || !nextPaginationToken) {
          reachedEnd = true;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } while (!reachedEnd);

      // Process comments with sentiment and keyword analysis
      const keywordCount: { [key: string]: number } = {};
      const processedComments: Comment[] = [];
      const intentions = {
        feature_request: [] as Comment[],
        bug_report: [] as Comment[],
        praise: [] as Comment[],
        complaint: [] as Comment[]
      };
      let sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

      // New data structures for enhanced analysis
      const featureRequestMap: Map<string, {count: number, examples: string[], ratings: number[]}> = new Map();
      const bugReportMap: Map<string, {count: number, examples: string[], ratings: number[]}> = new Map();
      const competitorMentionsMap: Map<string, {mentions: Comment[], positive: number, negative: number, neutral: number}> = new Map();
      const userSegments = {
        newUsers: [] as Comment[],
        powerUsers: [] as Comment[],
        returningUsers: [] as Comment[]
      };

      for (const review of allReviews) {
        // Use enhanced analysis
        const enhancedAnalysis = this.analyzeCommentEnhanced(review.text, review.score);
        
        // Original sentiment & keyword processing
        const { sentiment, keywords } = enhancedAnalysis;
        
        // Count sentiment
        sentimentCounts[sentiment]++;

        // Count keywords
        keywords.forEach(word => {
          keywordCount[word] = (keywordCount[word] || 0) + 1;
        });

        const comment: Comment = {
          id: review.id,
          userName: review.userName,
          content: review.text,
          score: review.score,
          thumbsUp: review.thumbsUp,
          date: new Date(review.date).toISOString(),
          year: new Date(review.date).getFullYear(),
          sentiment
        };

        processedComments.push(comment);

        // Categorize intentions
        const commentIntentions = this.categorizeIntention(review.text, sentiment);
        commentIntentions.forEach(intention => {
          if (intention in intentions) {
            intentions[intention as keyof typeof intentions].push(comment);
          }
        });
        
        // Track user segments
        if (enhancedAnalysis.userType === 'new') userSegments.newUsers.push(comment);
        if (enhancedAnalysis.userType === 'power') userSegments.powerUsers.push(comment);
        if (enhancedAnalysis.userType === 'returning') userSegments.returningUsers.push(comment);
        
        // Track feature requests
        enhancedAnalysis.featureRequests.forEach(feature => {
          if (!featureRequestMap.has(feature)) {
            featureRequestMap.set(feature, {count: 0, examples: [], ratings: []});
          }
          const featureData = featureRequestMap.get(feature)!;
          featureData.count++;
          if (featureData.examples.length < 3) featureData.examples.push(review.text);
          featureData.ratings.push(review.score);
        });
        
        // Track bug reports
        enhancedAnalysis.bugReports.forEach(bug => {
          if (!bugReportMap.has(bug)) {
            bugReportMap.set(bug, {count: 0, examples: [], ratings: []});
          }
          const bugData = bugReportMap.get(bug)!;
          bugData.count++;
          if (bugData.examples.length < 3) bugData.examples.push(review.text);
          bugData.ratings.push(review.score);
        });
        
        // Track competitor mentions
        enhancedAnalysis.competitorMentions.forEach(competitor => {
          if (!competitorMentionsMap.has(competitor)) {
            competitorMentionsMap.set(competitor, {
              mentions: [],
              positive: 0,
              negative: 0,
              neutral: 0
            });
          }
          
          const mentionData = competitorMentionsMap.get(competitor)!;
          mentionData.mentions.push(comment);
          if (comment.sentiment === 'positive') mentionData.positive++;
          else if (comment.sentiment === 'negative') mentionData.negative++;
          else mentionData.neutral++;
        });
      }

      // Sort keywords by frequency
      const sortedKeywords = Object.entries(keywordCount)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
        
      // Process the collected data
      const featureRequests = Array.from(featureRequestMap.entries())
        .map(([feature, data]) => ({
          feature,
          count: data.count,
          examples: data.examples,
          averageRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
        }))
        .sort((a, b) => b.count - a.count);
      
      const bugReports = Array.from(bugReportMap.entries())
        .map(([issue, data]) => ({
          issue,
          count: data.count,
          examples: data.examples,
          severity: data.count > 10 ? 'high' as const : data.count > 3 ? 'medium' as const : 'low' as const
        }))
        .sort((a, b) => b.count - a.count);
        
      const competitiveMentions = Array.from(competitorMentionsMap.entries())
        .map(([competitor, data]) => ({
          competitor,
          mentions: data.mentions,
          sentiment: {
            positive: data.positive,
            negative: data.negative,
            neutral: data.neutral
          }
        }))
        .sort((a, b) => b.mentions.length - a.mentions.length);

      // Generate trend data using the utility function
      const trends = generateTrendData(processedComments, 6);

      return {
        comments: processedComments,
        sentiment: sentimentCounts,
        keywords: sortedKeywords,
        intentions,
        featureRequests,
        bugReports,
        userSegments,
        competitiveMentions,
        trends // Add trend data to the result
      };
    } catch (error) {
      console.error('Error fetching Play Store comments:', error);
      throw error;
    }
  }

  static async fetchAppMetadata(appIdOrUrl: string): Promise<AppMetadata> {
    const appId = this.extractAppId(appIdOrUrl);
    try {
      return await gplay.app({ appId });
    } catch (error) {
      console.error('Error fetching app metadata:', error);
      throw error;
    }
  }

  static async fetchCompetitorData(appIdOrUrl: string): Promise<any[]> {
    const appId = this.extractAppId(appIdOrUrl);
    try {
      // Get similar apps
      const appData = await gplay.app({ appId });
      const similarApps = appData.similarApps || [];
      
      // Fetch details for each similar app
      const competitorData = await Promise.all(
        similarApps.slice(0, 5).map(async (similarAppId: string) => {
          try {
            const data = await gplay.app({ appId: similarAppId });
            return {
              id: similarAppId,
              title: data.title,
              score: data.score,
              ratings: data.ratings,
              installs: data.installs,
              minInstalls: data.minInstalls,
              price: data.price,
              free: data.free,
              updated: data.updated,
              version: data.version
            };
          } catch {
            return null;
          }
        })
      );
      
      return competitorData.filter(Boolean);
    } catch (error) {
      console.error('Error fetching competitor data:', error);
      throw error;
    }
  }

  static async analyzeVersionImpact(appIdOrUrl: string): Promise<any> {
    const appId = this.extractAppId(appIdOrUrl);
    try {
      const reviews = await this.fetchComments(appIdOrUrl, '90days');
      const appInfo = await this.fetchAppMetadata(appIdOrUrl);
      
      // Group reviews by approximate version
      const reviewsByDate = reviews.comments.reduce((acc: any, review) => {
        const reviewDate = new Date(review.date).toISOString().split('T')[0];
        acc[reviewDate] = acc[reviewDate] || [];
        acc[reviewDate].push(review);
        return acc;
      }, {});
      
      // Analyze sentiment changes over time
      const sentimentByDate = Object.entries(reviewsByDate).map(([date, dailyReviews]) => {
        const reviews = dailyReviews as Comment[];
        const sentimentCounts = {
          date,
          positive: reviews.filter(r => r.sentiment === 'positive').length,
          negative: reviews.filter(r => r.sentiment === 'negative').length, 
          neutral: reviews.filter(r => r.sentiment === 'neutral').length,
          total: reviews.length,
          averageScore: reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length
        };
        return sentimentCounts;
      });
      
      // Ensure trends data format is consistent with our TrendAnalysis component
      const trends = sentimentByDate
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(item => ({
          date: item.date,
          positive: item.positive,
          negative: item.negative,
          neutral: item.neutral,
          total: item.total
        }));
      
      return {
        currentVersion: appInfo.version,
        recentChanges: appInfo.recentChanges,
        sentimentTrend: sentimentByDate.sort((a, b) => a.date.localeCompare(b.date)),
        trends // Add trends in the format expected by TrendAnalysis component
      };
    } catch (error) {
      console.error('Error analyzing version impact:', error);
      throw error;
    }
  }
}