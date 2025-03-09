/**
 * Play Store Review Analysis System
 * Unified API that connects all components with performance optimizations
 */

import { PlayStoreService, PlayStoreReview, AppMetadata, FetchReviewsOptions } from './playstore.server';
import { ReviewAnalysisService, AnalyzedComment, AnalysisResult, AnalysisOptions } from './analysis.server';
import { ClassificationService, ClassificationResult, ClassificationOptions } from './classification.server';
import { AggregationService, AggregatedResults, AggregationOptions } from './aggregation.server';

/**
 * Cache entry with expiration
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Cache configuration
 */
interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  fetchTime: number;
  analysisTime: number;
  classificationTime: number;
  aggregationTime: number;
  totalTime: number;
  reviewCount: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Analysis job status
 */
export type JobStatus = 'pending' | 'fetching' | 'analyzing' | 'classifying' | 'aggregating' | 'completed' | 'failed';

/**
 * Analysis job
 */
export interface AnalysisJob {
  id: string;
  appId: string;
  status: JobStatus;
  progress: number;
  error?: string;
  startTime: number;
  endTime?: number;
  options: PlayStoreAnalysisOptions;
  result?: AggregatedResults;
  metrics?: PerformanceMetrics;
}

/**
 * Combined options for the entire analysis pipeline
 */
export interface PlayStoreAnalysisOptions {
  fetch?: FetchReviewsOptions;
  analysis?: AnalysisOptions;
  classification?: ClassificationOptions;
  aggregation?: AggregationOptions;
  cache?: {
    enabled?: boolean;
    ttl?: number;
  };
  abortSignal?: AbortSignal;
}

/**
 * Play Store Analysis System
 */
export class PlayStoreAnalysisSystem {
  /**
   * Default cache configuration
   */
  private static readonly DEFAULT_CACHE_CONFIG: CacheConfig = {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 100
  };

  /**
   * Cache for reviews
   */
  private reviewCache: Map<string, CacheEntry<PlayStoreReview[]>> = new Map();

  /**
   * Cache for app metadata
   */
  private metadataCache: Map<string, CacheEntry<AppMetadata>> = new Map();

  /**
   * Cache for analysis results
   */
  private analysisCache: Map<string, CacheEntry<AggregatedResults>> = new Map();

  /**
   * Active jobs
   */
  private jobs: Map<string, AnalysisJob> = new Map();

  /**
   * Cache configuration
   */
  private cacheConfig: CacheConfig;

  /**
   * Performance metrics
   */
  private metrics: {
    cacheHits: number;
    cacheMisses: number;
  } = {
    cacheHits: 0,
    cacheMisses: 0
  };

  /**
   * Constructor
   * @param cacheConfig Cache configuration
   */
  constructor(cacheConfig?: Partial<CacheConfig>) {
    this.cacheConfig = { ...PlayStoreAnalysisSystem.DEFAULT_CACHE_CONFIG, ...cacheConfig };
    
    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000); // Clean up every hour
  }

  /**
   * Generate a unique cache key
   * @param appId App ID
   * @param options Analysis options
   * @returns Cache key
   */
  private generateCacheKey(appId: string, options?: PlayStoreAnalysisOptions): string {
    const optionsString = options ? JSON.stringify(options) : '';
    return `${appId}:${optionsString}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    // Clean up review cache
    for (const [key, entry] of this.reviewCache.entries()) {
      if (entry.expiresAt < now) {
        this.reviewCache.delete(key);
      }
    }
    
    // Clean up metadata cache
    for (const [key, entry] of this.metadataCache.entries()) {
      if (entry.expiresAt < now) {
        this.metadataCache.delete(key);
      }
    }
    
    // Clean up analysis cache
    for (const [key, entry] of this.analysisCache.entries()) {
      if (entry.expiresAt < now) {
        this.analysisCache.delete(key);
      }
    }
    
    // Enforce max size limits
    if (this.reviewCache.size > this.cacheConfig.maxSize) {
      const entriesToDelete = Array.from(this.reviewCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.reviewCache.size - this.cacheConfig.maxSize);
      
      for (const [key] of entriesToDelete) {
        this.reviewCache.delete(key);
      }
    }
    
    if (this.metadataCache.size > this.cacheConfig.maxSize) {
      const entriesToDelete = Array.from(this.metadataCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.metadataCache.size - this.cacheConfig.maxSize);
      
      for (const [key] of entriesToDelete) {
        this.metadataCache.delete(key);
      }
    }
    
    if (this.analysisCache.size > this.cacheConfig.maxSize) {
      const entriesToDelete = Array.from(this.analysisCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.analysisCache.size - this.cacheConfig.maxSize);
      
      for (const [key] of entriesToDelete) {
        this.analysisCache.delete(key);
      }
    }
  }

  /**
   * Get cached data or fetch it
   * @param cache Cache map
   * @param key Cache key
   * @param fetchFn Function to fetch data if not cached
   * @param options Cache options
   * @returns Cached or fetched data
   */
  private async getOrFetch<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    fetchFn: () => Promise<T>,
    options?: { enabled?: boolean; ttl?: number }
  ): Promise<T> {
    const cacheEnabled = options?.enabled !== undefined ? options.enabled : this.cacheConfig.enabled;
    const cacheTtl = options?.ttl || this.cacheConfig.ttl;
    
    // Check cache if enabled
    if (cacheEnabled && cache.has(key)) {
      const entry = cache.get(key)!;
      const now = Date.now();
      
      if (entry.expiresAt > now) {
        this.metrics.cacheHits++;
        return entry.data;
      }
    }
    
    // Cache miss or disabled
    this.metrics.cacheMisses++;
    
    // Fetch data
    const data = await fetchFn();
    
    // Cache result if enabled
    if (cacheEnabled) {
      const now = Date.now();
      cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + cacheTtl
      });
    }
    
    return data;
  }

  /**
   * Generate a unique job ID
   * @returns Job ID
   */
  private generateJobId(): string {
    return `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Update job status and progress
   * @param jobId Job ID
   * @param status Job status
   * @param progress Job progress
   * @param error Error message
   */
  private updateJobStatus(
    jobId: string,
    status: JobStatus,
    progress: number,
    error?: string
  ): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    job.status = status;
    job.progress = progress;
    
    if (error) {
      job.error = error;
    }
    
    if (status === 'completed' || status === 'failed') {
      job.endTime = Date.now();
    }
  }

  /**
   * Fetch app metadata
   * @param appIdOrUrl App ID or URL
   * @param options Cache options
   * @returns App metadata
   */
  public async fetchAppMetadata(
    appIdOrUrl: string,
    options?: { cache?: { enabled?: boolean; ttl?: number } }
  ): Promise<AppMetadata> {
    const appId = PlayStoreService.extractAppId(appIdOrUrl);
    const cacheKey = `metadata:${appId}`;
    
    return this.getOrFetch(
      this.metadataCache,
      cacheKey,
      () => PlayStoreService.fetchAppMetadata(appId),
      options?.cache
    );
  }

  /**
   * Fetch app reviews
   * @param options Fetch options
   * @returns Array of reviews
   */
  public async fetchReviews(
    options: FetchReviewsOptions & { cache?: { enabled?: boolean; ttl?: number } }
  ): Promise<PlayStoreReview[]> {
    const appId = PlayStoreService.extractAppId(options.appIdOrUrl);
    const cacheKey = `reviews:${appId}:${JSON.stringify(options)}`;
    
    return this.getOrFetch(
      this.reviewCache,
      cacheKey,
      () => PlayStoreService.fetchReviews(options),
      options.cache
    );
  }

  /**
   * Analyze app reviews
   * @param appIdOrUrl App ID or URL
   * @param options Analysis options
   * @returns Analysis job
   */
  public async analyzeApp(
    appIdOrUrl: string,
    options: PlayStoreAnalysisOptions = {}
  ): Promise<AnalysisJob> {
    const appId = PlayStoreService.extractAppId(appIdOrUrl);
    const jobId = this.generateJobId();
    
    // Create job
    const job: AnalysisJob = {
      id: jobId,
      appId,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      options
    };
    
    this.jobs.set(jobId, job);
    
    // Check cache for existing analysis
    const cacheKey = this.generateCacheKey(appId, options);
    const cacheEnabled = options.cache?.enabled !== undefined ? options.cache.enabled : this.cacheConfig.enabled;
    
    if (cacheEnabled && this.analysisCache.has(cacheKey)) {
      const entry = this.analysisCache.get(cacheKey)!;
      const now = Date.now();
      
      if (entry.expiresAt > now) {
        this.metrics.cacheHits++;
        
        // Update job with cached result
        job.status = 'completed';
        job.progress = 100;
        job.endTime = Date.now();
        job.result = entry.data;
        job.metrics = {
          fetchTime: 0,
          analysisTime: 0,
          classificationTime: 0,
          aggregationTime: 0,
          totalTime: 0,
          reviewCount: 0,
          cacheHits: 1,
          cacheMisses: 0
        };
        
        return job;
      }
    }
    
    // Start analysis in background
    this.runAnalysis(job).catch(error => {
      console.error(`Error in analysis job ${jobId}:`, error);
      this.updateJobStatus(jobId, 'failed', 0, error.message);
    });
    
    return job;
  }

  /**
   * Run analysis job
   * @param job Analysis job
   */
  private async runAnalysis(job: AnalysisJob): Promise<void> {
    const { appId, options } = job;
    const metrics: PerformanceMetrics = {
      fetchTime: 0,
      analysisTime: 0,
      classificationTime: 0,
      aggregationTime: 0,
      totalTime: 0,
      reviewCount: 0,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses
    };
    
    const startTime = Date.now();
    
    try {
      // 1. Fetch app metadata and reviews
      this.updateJobStatus(job.id, 'fetching', 10);
      
      const fetchStartTime = Date.now();
      
      // Fetch app metadata
      const appMetadata = await this.fetchAppMetadata(appId, {
        cache: options.cache
      });
      
      // Fetch reviews
      const fetchOptions: FetchReviewsOptions = {
        appIdOrUrl: appId,
        ...options.fetch,
        signal: options.abortSignal
      };
      
      const reviews = await this.fetchReviews({
        ...fetchOptions,
        cache: options.cache
      });
      
      console.log(`Analysis job ${job.id}: Fetched ${reviews.length} reviews for app ${appId}`);
      
      metrics.fetchTime = Date.now() - fetchStartTime;
      metrics.reviewCount = reviews.length;
      
      // Check if operation was aborted
      if (options.abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }
      
      // 2. Analyze reviews
      this.updateJobStatus(job.id, 'analyzing', 30);
      
      const analysisStartTime = Date.now();
      
      const analysisOptions: AnalysisOptions = {
        ...options.analysis
      };
      
      // Check if we have reviews to analyze
      if (reviews.length === 0) {
        console.log(`Analysis job ${job.id}: No reviews to analyze`);
        // Create an empty analysis result
        const emptyAnalysis: AggregatedResults = {
          summary: {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {
              '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
              average: 0,
              total: 0
            },
            sentimentDistribution: {
              positive: 0,
              negative: 0,
              neutral: 0
            },
            userSegmentDistribution: {
              newUsers: 0,
              powerUsers: 0,
              returningUsers: 0,
              unknownUsers: 0,
              total: 0
            }
          },
          trends: {
            overall: {
              timePeriod: 'week',
              dataPoints: [],
              trend: 'stable',
              percentChange: 0
            },
            features: [],
            bugs: []
          },
          topFeatures: [],
          criticalBugs: [],
          competitorInsights: [],
          insights: [],
          exportData: {
            csv: '',
            json: ''
          }
        };
        
        // Update job with empty result
        job.result = emptyAnalysis;
        job.metrics = metrics;
        
        // Mark job as completed
        this.updateJobStatus(job.id, 'completed', 100);
        return;
      }
      
      console.log(`Analysis job ${job.id}: Analyzing ${reviews.length} reviews`);
      const analysis = ReviewAnalysisService.analyzeReviews(reviews, analysisOptions);
      console.log(`Analysis job ${job.id}: Analysis complete, processed ${analysis.comments.length} comments`);
      
      metrics.analysisTime = Date.now() - analysisStartTime;
      
      // Check if operation was aborted
      if (options.abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }
      
      // 3. Classify reviews
      this.updateJobStatus(job.id, 'classifying', 60);
      
      const classificationStartTime = Date.now();
      
      const classificationOptions: ClassificationOptions = {
        ...options.classification
      };
      
      console.log(`Analysis job ${job.id}: Classifying ${analysis.comments.length} comments`);
      const classification = ClassificationService.classifyReviews(
        analysis.comments,
        [appMetadata.version],
        classificationOptions
      );
      console.log(`Analysis job ${job.id}: Classification complete`);
      
      metrics.classificationTime = Date.now() - classificationStartTime;
      
      // Check if operation was aborted
      if (options.abortSignal?.aborted) {
        throw new Error('Operation aborted');
      }
      
      // 4. Aggregate results
      this.updateJobStatus(job.id, 'aggregating', 90);
      
      const aggregationStartTime = Date.now();
      
      const aggregationOptions: AggregationOptions = {
        ...options.aggregation
      };
      
      console.log(`Analysis job ${job.id}: Aggregating results`);
      const aggregatedResults = AggregationService.aggregateResults(
        analysis.comments,
        analysis,
        classification,
        aggregationOptions
      );
      console.log(`Analysis job ${job.id}: Aggregation complete, final result has ${aggregatedResults.summary.totalReviews} reviews`);
      
      metrics.aggregationTime = Date.now() - aggregationStartTime;
      
      // Calculate total time
      metrics.totalTime = Date.now() - startTime;
      
      // Update job with result
      job.result = aggregatedResults;
      job.metrics = metrics;
      
      // Cache result
      const cacheKey = this.generateCacheKey(appId, options);
      const cacheEnabled = options.cache?.enabled !== undefined ? options.cache.enabled : this.cacheConfig.enabled;
      const cacheTtl = options.cache?.ttl || this.cacheConfig.ttl;
      
      if (cacheEnabled) {
        const now = Date.now();
        this.analysisCache.set(cacheKey, {
          data: aggregatedResults,
          timestamp: now,
          expiresAt: now + cacheTtl
        });
      }
      
      // Mark job as completed
      this.updateJobStatus(job.id, 'completed', 100);
    } catch (error) {
      console.error(`Error in analysis job ${job.id}:`, error);
      this.updateJobStatus(job.id, 'failed', 0, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get job status
   * @param jobId Job ID
   * @returns Job status or null if not found
   */
  public getJobStatus(jobId: string): AnalysisJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel job
   * @param jobId Job ID
   * @returns True if job was cancelled
   */
  public cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    // Mark job as failed
    job.status = 'failed';
    job.error = 'Job cancelled by user';
    job.endTime = Date.now();
    
    return true;
  }

  /**
   * Clear cache
   * @param type Cache type to clear (all, reviews, metadata, analysis)
   */
  public clearCache(type: 'all' | 'reviews' | 'metadata' | 'analysis' = 'all'): void {
    if (type === 'all' || type === 'reviews') {
      this.reviewCache.clear();
    }
    
    if (type === 'all' || type === 'metadata') {
      this.metadataCache.clear();
    }
    
    if (type === 'all' || type === 'analysis') {
      this.analysisCache.clear();
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getCacheStats(): {
    reviewCache: number;
    metadataCache: number;
    analysisCache: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = total > 0 ? this.metrics.cacheHits / total : 0;
    
    return {
      reviewCache: this.reviewCache.size,
      metadataCache: this.metadataCache.size,
      analysisCache: this.analysisCache.size,
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      hitRate
    };
  }
}

// Export singleton instance
export const playStoreAnalysis = new PlayStoreAnalysisSystem();

// Export all components for direct access
export * from './playstore.server';
export * from './analysis.server';
export * from './classification.server';
export * from './aggregation.server'; 