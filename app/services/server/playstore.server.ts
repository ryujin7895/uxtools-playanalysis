/**
 * PlayStore Review Analysis System
 * A modern, efficient system for fetching and analyzing Google Play Store reviews
 */

// @ts-ignore
import gplay from 'google-play-scraper';

/**
 * Core data structures for the Play Store review analysis system
 */

/**
 * Raw review data from Google Play Store
 */
export interface PlayStoreReview {
  id: string;
  userName: string;
  userImage?: string;
  date: string;
  score: number;
  scoreText?: string;
  text: string;
  thumbsUp: number;
  url?: string;
  replyDate?: string;
  replyText?: string;
  version?: string;
  criterias?: Array<{
    criteria: string;
    rating: number;
  }>;
}

/**
 * Batch of reviews with pagination token
 */
export interface ReviewBatch {
  data: PlayStoreReview[];
  nextPaginationToken?: string;
}

/**
 * Date range options for filtering reviews
 */
export type DateRangeOption = '7days' | '30days' | '90days' | '1year' | 'all' | 'custom';

/**
 * Date range with start and end dates
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * App metadata from Google Play Store
 */
export interface AppMetadata {
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
  categories: string[];
  histogram: { [key: string]: number }; // Rating distribution (1-5)
  priceText: string;
  contentRating: string;
  adSupported: boolean;
  containsAds: boolean;
  recentChanges: string;
  similarApps: string[];
}

/**
 * Options for fetching reviews
 */
export interface FetchReviewsOptions {
  appIdOrUrl: string;
  dateRange?: DateRangeOption;
  customDateRange?: DateRange;
  maxReviews?: number;
  batchSize?: number;
  delayBetweenBatches?: number;
  retryAttempts?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * PlayStore Service for fetching and analyzing reviews
 */
export class PlayStoreService {
  /**
   * Default options for fetching reviews
   */
  private static readonly DEFAULT_OPTIONS: Partial<FetchReviewsOptions> = {
    dateRange: '30days',
    maxReviews: 5000,
    batchSize: 150,
    delayBetweenBatches: 500,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  /**
   * Extract app ID from URL or return the ID directly
   * @param input App ID or URL
   * @returns Extracted app ID
   */
  public static extractAppId(input: string): string {
    if (input.includes('id=')) {
      const match = input.match(/id=([^&]+)/);
      return match ? match[1] : '';
    }
    return input;
  }

  /**
   * Parse date range string into start and end dates
   * @param dateRange Date range option
   * @param customDateRange Optional custom date range
   * @returns Date range with start and end dates
   */
  public static parseDateRange(
    dateRange: DateRangeOption,
    customDateRange?: DateRange
  ): DateRange {
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
        if (customDateRange) {
          return customDateRange;
        }
        // Default to 30 days if custom range not provided
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Check if a comment date is within the specified date range
   * @param commentDate Comment date
   * @param dateRange Date range to check against
   * @returns True if comment is within date range
   */
  public static isCommentInDateRange(
    commentDate: Date,
    dateRange: DateRange
  ): boolean {
    return commentDate >= dateRange.startDate && commentDate <= dateRange.endDate;
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after delay
   */
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch reviews with retry logic and rate limiting
   * @param options Options for fetching reviews
   * @returns Promise with array of reviews
   */
  public static async fetchReviews(
    options: FetchReviewsOptions
  ): Promise<PlayStoreReview[]> {
    // Merge default options with provided options
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Extract app ID from URL if needed
    const appId = this.extractAppId(opts.appIdOrUrl);
    if (!appId) {
      throw new Error('Invalid app ID or URL');
    }

    // Parse date range
    const dateRange = this.parseDateRange(
      opts.dateRange || '30days',
      opts.customDateRange
    );

    // Languages to fetch reviews in - start with English and Indonesian as primary languages
    const languages = ['en', 'id']; 
    
    // Initialize variables for pagination
    let allReviews: PlayStoreReview[] = [];
    let reachedEnd = false;
    let totalBatchNumber = 0;
    
    // Set to track review IDs to avoid duplicates across languages
    const reviewIds = new Set<string>();

    console.log(`Starting to fetch reviews for app ID: ${appId} (limit: ${opts.maxReviews})`);
    
    // Fetch reviews for each language
    for (const lang of languages) {
      if (opts.maxReviews && allReviews.length >= opts.maxReviews) {
        console.log(`Reached maximum review limit of ${opts.maxReviews}`);
        break;
      }
      
      console.log(`Fetching reviews in language: ${lang}`);
      
      let nextPaginationToken: string | undefined = undefined;
      let batchNumber = 0;
      let consecutiveEmptyBatches = 0;
      const MAX_EMPTY_BATCHES = 3; // Stop after 3 consecutive empty batches
      let languageReachedEnd = false;
      
      // Fetch reviews in batches with pagination for this language
      do {
        batchNumber++;
        totalBatchNumber++;
        console.log(`Fetching batch #${batchNumber} for language ${lang}...`);

        // Retry logic for handling transient errors
        let retryCount = 0;
        let reviewBatch: ReviewBatch | null = null;

        while (retryCount <= (opts.retryAttempts || 0)) {
          try {
            // Check if operation was aborted
            if (opts.signal?.aborted) {
              throw new Error('Operation aborted');
            }

            // Fetch batch of reviews
            reviewBatch = await gplay.reviews({
          appId,
              sort: gplay.sort.NEWEST,
              num: opts.batchSize,
          paginate: true,
          nextPaginationToken,
              lang,
              throttle: 10, // Rate limiting to avoid 503 errors
            });

            // Break retry loop if successful
            break;
          } catch (error) {
            retryCount++;
            console.error(`Error in batch #${batchNumber} for language ${lang} (attempt ${retryCount}):`, error);

            // If we've reached max retries, throw the error
            if (retryCount > (opts.retryAttempts || 0)) {
              throw error;
            }

            // Exponential backoff for retries
            const backoffDelay = (opts.retryDelay || 1000) * Math.pow(2, retryCount - 1);
            console.log(`Retrying in ${backoffDelay}ms...`);
            await this.delay(backoffDelay);
          }
        }

        // Check if we got valid results
        if (!reviewBatch || !reviewBatch.data || reviewBatch.data.length === 0) {
          console.log(`No more reviews available in this batch for language ${lang}`);
          consecutiveEmptyBatches++;
          
          // If we've had too many consecutive empty batches, stop
          if (consecutiveEmptyBatches >= MAX_EMPTY_BATCHES) {
            console.log(`Received ${MAX_EMPTY_BATCHES} consecutive empty batches for language ${lang}. Stopping.`);
            languageReachedEnd = true;
            break;
          }
          
          // Try the next batch if we still have a pagination token
          if (reviewBatch && reviewBatch.nextPaginationToken) {
            nextPaginationToken = reviewBatch.nextPaginationToken;
            await this.delay(opts.delayBetweenBatches || 500);
            continue;
          } else {
            languageReachedEnd = true;
          break;
          }
        }

        // Reset consecutive empty batches counter since we got reviews
        consecutiveEmptyBatches = 0;

        // Filter reviews by date and deduplicate
        const filteredBatch = reviewBatch.data.filter(review => {
          // Check if review is within date range
          const reviewDate = new Date(review.date);
          const inDateRange = this.isCommentInDateRange(reviewDate, dateRange);
          
          // Check if we've already seen this review ID (to avoid duplicates across languages)
          const isDuplicate = reviewIds.has(review.id);
          
          // If it's a new review in the date range, add its ID to our set
          if (inDateRange && !isDuplicate) {
            reviewIds.add(review.id);
            return true;
          }
          
          return false;
        });
        
        // Log how many duplicates we found
        const duplicatesFound = reviewBatch.data.length - filteredBatch.length;
        if (duplicatesFound > 0) {
          console.log(`Found ${duplicatesFound} duplicate or out-of-range reviews in this batch`);
        }

        // Add filtered reviews to the collection
        allReviews = allReviews.concat(filteredBatch);
        nextPaginationToken = reviewBatch.nextPaginationToken;

        // Log progress
        const progress = Math.min((allReviews.length / (opts.maxReviews || 5000)) * 100, 100).toFixed(1);
        console.log(`Batch #${batchNumber} for language ${lang}: Got ${filteredBatch.length} reviews. Total: ${allReviews.length} (${progress}%)`);
        console.log('Has next page token:', !!nextPaginationToken);

        // Stop if we've reached the maximum number of reviews
        if (opts.maxReviews && allReviews.length >= opts.maxReviews) {
          console.log(`Reached maximum review limit of ${opts.maxReviews}`);
          reachedEnd = true;
          break;
        }

        // Stop if we don't have a next page token
        if (!nextPaginationToken) {
          console.log(`No next page token available for language ${lang} - reached end of reviews`);
          languageReachedEnd = true;
          break;
        }
        
        // Stop if we're getting empty batches (even if we have a next token)
        if (filteredBatch.length === 0) {
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= MAX_EMPTY_BATCHES) {
            console.log(`Received ${MAX_EMPTY_BATCHES} consecutive empty batches for language ${lang}. Stopping despite having a next token.`);
            languageReachedEnd = true;
            break;
          }
        }

        // Add a delay between requests to avoid rate limiting
        await this.delay(opts.delayBetweenBatches || 500);
      } while (!languageReachedEnd);
      
      console.log(`Completed fetching reviews for language ${lang}. Total retrieved so far: ${allReviews.length}`);
      
      // Add a longer delay between languages to avoid rate limiting
      await this.delay((opts.delayBetweenBatches || 500) * 2);
    }

    console.log(`Completed fetching reviews in all languages. Total retrieved: ${allReviews.length}`);
    
    // We've already deduplicated during fetching, so no need to do it again
    console.log(`Final review count: ${allReviews.length} unique reviews`);
    
    return allReviews;
  }

  /**
   * Fetch app metadata from Google Play Store
   * @param appIdOrUrl App ID or URL
   * @returns Promise with app metadata
   */
  public static async fetchAppMetadata(appIdOrUrl: string): Promise<AppMetadata> {
    const appId = this.extractAppId(appIdOrUrl);
    if (!appId) {
      throw new Error('Invalid app ID or URL');
    }

    try {
      const metadata = await gplay.app({ appId });
      return metadata as unknown as AppMetadata;
    } catch (error) {
      console.error('Error fetching app metadata:', error);
      throw error;
    }
  }
}