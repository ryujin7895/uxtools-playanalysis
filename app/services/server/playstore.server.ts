import type { AnalysisResult, Comment } from '~/types/analysis';

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

  static async fetchComments(appIdOrUrl: string, dateRange: string): Promise<AnalysisResult> {
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

      for (const review of allReviews) {
        const { sentiment, keywords } = this.analyzeComment(review.text);
        
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
      }

      // Sort keywords by frequency
      const sortedKeywords = Object.entries(keywordCount)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        comments: processedComments,
        sentiment: sentimentCounts,
        keywords: sortedKeywords,
        intentions
      };
    } catch (error) {
      console.error('Error fetching Play Store comments:', error);
      throw error;
    }
  }
}