/**
 * Review Analysis Engine
 * Advanced NLP-based analysis system for Play Store reviews
 */

import { PlayStoreReview } from './playstore.server';

// AFINN-based sentiment lexicon (simplified version)
const SENTIMENT_LEXICON: Record<string, number> = {
  // Positive words
  'good': 3, 'great': 4, 'awesome': 5, 'excellent': 5, 'amazing': 5, 
  'love': 4, 'perfect': 5, 'best': 5, 'helpful': 3, 'fantastic': 5, 
  'wonderful': 4, 'superb': 5, 'brilliant': 5, 'outstanding': 5,
  'easy': 2, 'nice': 3, 'better': 2, 'recommend': 4, 'worth': 3,
  'beautiful': 3, 'fast': 2, 'simple': 2, 'clean': 2, 'useful': 3,
  'happy': 3, 'enjoy': 3, 'fun': 3, 'cool': 3, 'impressive': 4,
  'smooth': 3, 'intuitive': 3, 'convenient': 3, 'reliable': 3,
  
  // Negative words
  'bad': -3, 'poor': -3, 'terrible': -5, 'awful': -5, 'horrible': -5, 
  'worst': -5, 'waste': -3, 'useless': -3, 'disappointed': -4, 
  'frustrating': -4, 'annoying': -3, 'slow': -2, 'crash': -4, 'bug': -3,
  'error': -3, 'issue': -2, 'problem': -2, 'difficult': -2, 'confusing': -3,
  'expensive': -2, 'hate': -4, 'boring': -3, 'ugly': -3, 'complicated': -3,
  'broken': -4, 'fail': -3, 'fails': -3, 'failed': -3, 'failure': -3,
  'glitch': -3, 'stuck': -3, 'freezes': -3, 'freeze': -3, 'froze': -3,
  'laggy': -3, 'lag': -3, 'lags': -3, 'ads': -2, 'advertisement': -2
};

/**
 * Processed comment with analysis results
 */
export interface AnalyzedComment {
  id: string;
  userName: string;
  content: string;
  score: number;
  thumbsUp: number;
  date: string;
  year: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  keywords: string[];
  intentions: string[];
  userType: 'new' | 'power' | 'returning' | 'unknown';
  featureRequests: string[];
  bugReports: string[];
  competitorMentions: string[];
  severity: 'low' | 'medium' | 'high';
}

/**
 * Sentiment analysis results
 */
export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  average: number;
}

/**
 * Keyword analysis results
 */
export interface KeywordAnalysis {
  word: string;
  count: number;
  sentiment: number;
  documents: number;
}

/**
 * Feature request analysis
 */
export interface FeatureRequestAnalysis {
  feature: string;
  count: number;
  examples: string[];
  averageRating: number;
  sentiment: number;
}

/**
 * Bug report analysis
 */
export interface BugReportAnalysis {
  issue: string;
  count: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
  affectedVersions?: string[];
}

/**
 * User segment analysis
 */
export interface UserSegmentAnalysis {
  newUsers: AnalyzedComment[];
  powerUsers: AnalyzedComment[];
  returningUsers: AnalyzedComment[];
  unknownUsers: AnalyzedComment[];
}

/**
 * Competitor mention analysis
 */
export interface CompetitorMentionAnalysis {
  competitor: string;
  mentions: AnalyzedComment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    average: number;
  };
}

/**
 * Complete analysis results
 */
export interface AnalysisResult {
  comments: AnalyzedComment[];
  sentiment: SentimentAnalysis;
  keywords: KeywordAnalysis[];
  intentions: {
    feature_request: AnalyzedComment[];
    bug_report: AnalyzedComment[];
    praise: AnalyzedComment[];
    complaint: AnalyzedComment[];
    question: AnalyzedComment[];
    comparison: AnalyzedComment[];
  };
  featureRequests: FeatureRequestAnalysis[];
  bugReports: BugReportAnalysis[];
  userSegments: UserSegmentAnalysis;
  competitorMentions: CompetitorMentionAnalysis[];
  trends: any; // Will be implemented in Step 4
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  minKeywordLength?: number;
  maxKeywords?: number;
  minKeywordFrequency?: number;
  sentimentThreshold?: number;
  maxExamples?: number;
  language?: string;
}

/**
 * Review Analysis Service
 */
export class ReviewAnalysisService {
  /**
   * Default analysis options
   */
  private static readonly DEFAULT_OPTIONS: AnalysisOptions = {
    minKeywordLength: 4,
    maxKeywords: 50,
    minKeywordFrequency: 2,
    sentimentThreshold: 0.2,
    maxExamples: 3,
    language: 'English',
  };

  /**
   * Known competitors for detection
   */
  private static readonly COMPETITORS = [
    'facebook', 'instagram', 'tiktok', 'snapchat', 'twitter', 
    'whatsapp', 'messenger', 'signal', 'telegram', 'discord',
    'slack', 'teams', 'zoom', 'skype', 'wechat', 'line',
    'viber', 'pinterest', 'linkedin', 'youtube', 'netflix',
    'hulu', 'disney', 'prime', 'spotify', 'apple', 'google',
    'amazon', 'microsoft', 'samsung', 'huawei', 'xiaomi'
  ];

  /**
   * Tokenize text into words
   * @param text Text to tokenize
   * @returns Array of tokens
   */
  private static tokenize(text: string): string[] {
    // Simple tokenization by splitting on non-word characters
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Analyze sentiment of text
   * @param text Text to analyze
   * @returns Sentiment score and category
   */
  private static analyzeSentiment(text: string): { score: number; category: 'positive' | 'negative' | 'neutral' } {
    const tokens = this.tokenize(text.toLowerCase());
    let score = 0;
    let wordCount = 0;
    
    // Calculate sentiment score based on lexicon
    for (const token of tokens) {
      if (token in SENTIMENT_LEXICON) {
        score += SENTIMENT_LEXICON[token];
        wordCount++;
      }
    }
    
    // Normalize score
    const normalizedScore = wordCount > 0 ? score / wordCount : 0;
    
    // Determine sentiment category based on score
    let category: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (normalizedScore > 0.2) category = 'positive';
    else if (normalizedScore < -0.2) category = 'negative';
    
    return { score: normalizedScore, category };
  }

  /**
   * Extract keywords from text using TF-IDF-like approach
   * @param text Text to analyze
   * @param allDocuments All documents for corpus comparison
   * @param options Analysis options
   * @returns Array of keywords
   */
  private static extractKeywords(
    text: string, 
    allDocuments: string[],
    options: AnalysisOptions
  ): string[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const tokens = this.tokenize(text);
    const wordFreq: Record<string, number> = {};
    
    // Calculate term frequency
    for (const token of tokens) {
      if (token.length >= (opts.minKeywordLength || 4)) {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      }
    }
    
    // Calculate document frequency
    const docFreq: Record<string, number> = {};
    for (const word in wordFreq) {
      docFreq[word] = 0;
      for (const doc of allDocuments) {
        if (doc.toLowerCase().includes(word)) {
          docFreq[word]++;
        }
      }
    }
    
    // Calculate TF-IDF
    const tfidf: Array<{term: string, score: number}> = [];
    const docCount = allDocuments.length || 1;
    
    for (const word in wordFreq) {
      // Skip common words
      if (docFreq[word] > docCount * 0.5) continue;
      
      const tf = wordFreq[word] / tokens.length;
      const idf = Math.log(docCount / (docFreq[word] || 1));
      const score = tf * idf;
      
      tfidf.push({ term: word, score });
    }
    
    // Sort by score and return top terms
    return tfidf
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.term);
  }

  /**
   * Detect user type based on text patterns
   * @param text Review text
   * @returns User type
   */
  private static detectUserType(text: string): 'new' | 'power' | 'returning' | 'unknown' {
    const lowerText = text.toLowerCase();
    
    // New user patterns
    const newUserPatterns = [
      'just downloaded', 'first time', 'new to this', 'recently started',
      'just started', 'just installed', 'new user', 'beginner', 'just got',
      'just beginning', 'just trying', 'first day', 'first week'
    ];
    
    // Power user patterns
    const powerUserPatterns = [
      'long time user', 'been using for years', 'daily user', 'power user', 
      'premium user', 'pro user', 'expert', 'advanced user', 'loyal user',
      'using since', 'for years', 'heavy user', 'regular user', 'paid user'
    ];
    
    // Returning user patterns
    const returningUserPatterns = [
      'came back', 'returned to', 'giving another try', 'reinstalled',
      'trying again', 'back after', 'returned after', 'coming back',
      'second chance', 'redownloaded', 'resubscribed'
    ];
    
    // Check patterns with more context awareness
    if (newUserPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'new';
    } else if (powerUserPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'power';
    } else if (returningUserPatterns.some(pattern => lowerText.includes(pattern))) {
      return 'returning';
    }
    
    return 'unknown';
  }

  /**
   * Detect intentions in text
   * @param text Review text
   * @param sentiment Sentiment analysis result
   * @returns Array of intentions
   */
  private static detectIntentions(
    text: string, 
    sentiment: { score: number; category: 'positive' | 'negative' | 'neutral' }
  ): string[] {
    const lowerText = text.toLowerCase();
    const intentions: string[] = [];
    
    // More comprehensive intention patterns
    const patterns = {
      feature_request: [
        'add', 'would be nice', 'should have', 'need', 'missing', 'please add',
        'would love', 'wish it had', 'could use', 'hope you add', 'suggestion',
        'feature request', 'would be great if', 'please implement', 'consider adding'
      ],
      bug_report: [
        'bug', 'crash', 'error', 'issue', 'problem', 'not working', 'fix',
        'broken', 'glitch', 'freezes', 'stuck', 'doesn\'t work', 'fails',
        'doesn\'t load', 'force close', 'keeps stopping', 'won\'t open'
      ],
      praise: [
        'great', 'awesome', 'love', 'excellent', 'perfect', 'amazing',
        'fantastic', 'wonderful', 'best', 'good', 'helpful', 'useful',
        'impressive', 'outstanding', 'superb', 'brilliant', 'terrific'
      ],
      complaint: [
        'bad', 'terrible', 'poor', 'waste', 'disappointed', 'awful',
        'horrible', 'useless', 'frustrating', 'annoying', 'worst',
        'hate', 'sucks', 'garbage', 'rubbish', 'pathetic', 'joke'
      ],
      question: [
        'how do i', 'how to', 'can you', 'is there', 'does it', 'will it',
        'when will', 'why is', 'where is', 'what is', '?'
      ],
      comparison: [
        'better than', 'worse than', 'compared to', 'similar to', 'like',
        'unlike', 'preferred', 'instead of', 'alternative', 'competitor',
        'competition', 'other apps', 'other games', 'rivals'
      ]
    };
    
    // Check for each intention type
    Object.entries(patterns).forEach(([intention, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        intentions.push(intention);
      }
    });
    
    // If no specific intention is detected, categorize based on sentiment
    if (intentions.length === 0) {
      if (sentiment.category === 'positive') intentions.push('praise');
      else if (sentiment.category === 'negative') intentions.push('complaint');
    }
    
    return intentions;
  }

  /**
   * Extract feature requests using advanced pattern matching
   * @param text Review text
   * @returns Array of feature requests
   */
  private static extractFeatureRequests(text: string): string[] {
    const featureRequests: string[] = [];
    
    // Advanced regex patterns for feature requests
    const featureRequestPatterns = [
      /wish(?:ed)? (?:it |there was |you |they |had |for )(.{3,50})/i,
      /need(?:s)? (?:to |a |an |more )(.{3,50})/i,
      /add(?:ing)? (.{3,50}) would/i,
      /please (?:add|include) (.{3,50})/i,
      /would (?:be nice|love|like) (?:to have |if (?:you |there was |it had ))(.{3,50})/i,
      /(?:missing|lacks) (.{3,50})/i,
      /(?:should|could) (?:add|include|implement) (.{3,50})/i,
      /(?:want|looking for) (.{3,50})/i,
      /hope (?:you|they) (?:add|include|implement) (.{3,50})/i,
      /suggestion(?:s)?: (.{3,50})/i
    ];
    
    // Apply each pattern and collect matches
    featureRequestPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const feature = match[1].trim();
        // Avoid duplicates and very short features
        if (feature.length > 3 && !featureRequests.includes(feature)) {
          featureRequests.push(feature);
        }
      }
    });
    
    return featureRequests;
  }

  /**
   * Extract bug reports using advanced pattern matching
   * @param text Review text
   * @returns Array of bug reports
   */
  private static extractBugReports(text: string): string[] {
    const bugReports: string[] = [];
    
    // Advanced regex patterns for bug reports
    const bugPatterns = [
      /(?:crash|bug|error|issue|problem)(?:es|s)? (?:with|when|during) (.{3,50})/i,
      /(?:doesn't|does not|won't|will not|can't|cannot) (.{3,50})/i,
      /(?:broken|not working|fails|failed) (.{3,50})/i,
      /(?:keeps|constantly) (?:crashing|freezing|stopping) (?:when|during|after) (.{3,50})/i,
      /(?:glitch|bug) (?:in|with) (.{3,50})/i,
      /(?:unable|impossible) to (.{3,50})/i,
      /(?:stuck|freezes) (?:on|at|when|during) (.{3,50})/i,
      /(?:force|keeps) (?:closing|stopping) (?:when|during|after) (.{3,50})/i,
      /(?:problem|issue) (?:with|when) (.{3,50})/i,
      /(?:not|doesn't) (?:load|open|function|work) (?:when|properly|correctly) (.{3,50})?/i
    ];
    
    // Apply each pattern and collect matches
    bugPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        const bug = match[1].trim();
        // Avoid duplicates and very short bug reports
        if (bug.length > 3 && !bugReports.includes(bug)) {
          bugReports.push(bug);
        }
      }
    });
    
    return bugReports;
  }

  /**
   * Detect competitor mentions
   * @param text Review text
   * @returns Array of competitor names
   */
  private static detectCompetitorMentions(text: string): string[] {
    const lowerText = text.toLowerCase();
    
    // Find all competitors mentioned in the text
    return this.COMPETITORS.filter(competitor => 
      lowerText.includes(competitor)
    );
  }

  /**
   * Determine severity of a bug report
   * @param text Bug report text
   * @param score Review score
   * @returns Severity level
   */
  private static determineBugSeverity(text: string, score: number): 'low' | 'medium' | 'high' {
    const lowerText = text.toLowerCase();
    
    // High severity indicators
    const highSeverityTerms = [
      'crash', 'freeze', 'unusable', 'broken', 'lost data', 'corrupt',
      'security', 'privacy', 'payment', 'money', 'charge', 'stuck',
      'can\'t login', 'can\'t access', 'deleted', 'wiped', 'reset'
    ];
    
    // Medium severity indicators
    const mediumSeverityTerms = [
      'slow', 'lag', 'delay', 'glitch', 'bug', 'issue', 'problem',
      'doesn\'t work', 'not working', 'error', 'failed'
    ];
    
    // Check for high severity terms
    if (highSeverityTerms.some(term => lowerText.includes(term)) || score <= 1) {
      return 'high';
    }
    
    // Check for medium severity terms
    if (mediumSeverityTerms.some(term => lowerText.includes(term)) || score <= 3) {
      return 'medium';
    }
    
    // Default to low severity
    return 'low';
  }

  /**
   * Analyze a single review
   * @param review Raw review data
   * @param allReviewTexts All review texts for corpus comparison
   * @param options Analysis options
   * @returns Analyzed comment
   */
  public static analyzeReview(
    review: PlayStoreReview,
    allReviewTexts: string[],
    options: AnalysisOptions = {}
  ): AnalyzedComment {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const content = review.text || '';
    const reviewDate = new Date(review.date);
    
    // Perform sentiment analysis
    const sentiment = this.analyzeSentiment(content);
    
    // Extract keywords
    const keywords = this.extractKeywords(content, allReviewTexts, opts);
    
    // Detect user type
    const userType = this.detectUserType(content);
    
    // Detect intentions
    const intentions = this.detectIntentions(content, sentiment);
    
    // Extract feature requests
    const featureRequests = this.extractFeatureRequests(content);
    
    // Extract bug reports
    const bugReports = this.extractBugReports(content);
    
    // Detect competitor mentions
    const competitorMentions = this.detectCompetitorMentions(content);
    
    // Determine bug severity
    const severity = this.determineBugSeverity(content, review.score);
    
    // Create analyzed comment
    return {
      id: review.id,
      userName: review.userName || 'Anonymous',
      content,
      score: review.score,
      thumbsUp: review.thumbsUp || 0,
      date: reviewDate.toISOString(),
      year: reviewDate.getFullYear(),
      sentiment: sentiment.category,
      keywords,
      intentions,
      userType,
      featureRequests,
      bugReports,
      competitorMentions,
      severity
    };
  }

  /**
   * Analyze a collection of reviews
   * @param reviews Array of raw reviews
   * @param options Analysis options
   * @returns Complete analysis results
   */
  public static analyzeReviews(
    reviews: PlayStoreReview[],
    options: AnalysisOptions = {}
  ): AnalysisResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Extract all review texts for corpus analysis
    const allReviewTexts = reviews.map(review => review.text || '');
    
    // Analyze each review
    const analyzedComments = reviews.map(review => 
      this.analyzeReview(review, allReviewTexts, opts)
    );
    
    // Calculate sentiment statistics
    const sentiment = {
      positive: analyzedComments.filter(c => c.sentiment === 'positive').length,
      negative: analyzedComments.filter(c => c.sentiment === 'negative').length,
      neutral: analyzedComments.filter(c => c.sentiment === 'neutral').length,
      average: analyzedComments.reduce((sum, c) => sum + c.score, 0) / analyzedComments.length
    };
    
    // Extract and count keywords across all reviews
    const keywordMap = new Map<string, { count: number; sentiment: number; documents: number }>();
    
    analyzedComments.forEach(comment => {
      // Track unique keywords per document
      const uniqueKeywords = new Set<string>();
      
      comment.keywords.forEach(keyword => {
        uniqueKeywords.add(keyword);
        
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, { count: 0, sentiment: 0, documents: 0 });
        }
        
        const keywordData = keywordMap.get(keyword)!;
        keywordData.count++;
        keywordData.sentiment += comment.score;
      });
      
      // Increment document count for each unique keyword
      uniqueKeywords.forEach(keyword => {
        const keywordData = keywordMap.get(keyword)!;
        keywordData.documents++;
      });
    });
    
    // Convert keyword map to sorted array
    const keywords = Array.from(keywordMap.entries())
      .map(([word, data]) => ({
        word,
        count: data.count,
        sentiment: data.sentiment / data.count,
        documents: data.documents
      }))
      .filter(keyword => keyword.count >= (opts.minKeywordFrequency || 2))
      .sort((a, b) => b.count - a.count)
      .slice(0, opts.maxKeywords || 50);
    
    // Categorize comments by intention
    const intentions = {
      feature_request: analyzedComments.filter(c => c.intentions.includes('feature_request')),
      bug_report: analyzedComments.filter(c => c.intentions.includes('bug_report')),
      praise: analyzedComments.filter(c => c.intentions.includes('praise')),
      complaint: analyzedComments.filter(c => c.intentions.includes('complaint')),
      question: analyzedComments.filter(c => c.intentions.includes('question')),
      comparison: analyzedComments.filter(c => c.intentions.includes('comparison'))
    };
    
    // Analyze feature requests
    const featureRequestMap = new Map<string, { 
      count: number; 
      examples: string[]; 
      ratings: number[];
      sentiment: number;
    }>();
    
    analyzedComments.forEach(comment => {
      comment.featureRequests.forEach(feature => {
        if (!featureRequestMap.has(feature)) {
          featureRequestMap.set(feature, { 
            count: 0, 
            examples: [], 
            ratings: [],
            sentiment: 0
          });
        }
        
        const data = featureRequestMap.get(feature)!;
        data.count++;
        
        if (data.examples.length < (opts.maxExamples || 3)) {
          data.examples.push(comment.content);
        }
        
        data.ratings.push(comment.score);
        data.sentiment += comment.score;
      });
    });
    
    // Convert feature request map to sorted array
    const featureRequests = Array.from(featureRequestMap.entries())
      .map(([feature, data]) => ({
        feature,
        count: data.count,
        examples: data.examples,
        averageRating: data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length,
        sentiment: data.sentiment / data.count
      }))
      .sort((a, b) => b.count - a.count);
    
    // Analyze bug reports
    const bugReportMap = new Map<string, { 
      count: number; 
      examples: string[]; 
      severity: { low: number; medium: number; high: number };
      ratings: number[];
    }>();
    
    analyzedComments.forEach(comment => {
      comment.bugReports.forEach(issue => {
        if (!bugReportMap.has(issue)) {
          bugReportMap.set(issue, { 
            count: 0, 
            examples: [], 
            severity: { low: 0, medium: 0, high: 0 },
            ratings: []
          });
        }
        
        const data = bugReportMap.get(issue)!;
        data.count++;
        
        if (data.examples.length < (opts.maxExamples || 3)) {
          data.examples.push(comment.content);
        }
        
        data.severity[comment.severity]++;
        data.ratings.push(comment.score);
      });
    });
    
    // Convert bug report map to sorted array
    const bugReports = Array.from(bugReportMap.entries())
      .map(([issue, data]) => {
        // Determine overall severity based on counts
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (data.severity.high > 0) {
          severity = 'high';
        } else if (data.severity.medium > data.severity.low) {
          severity = 'medium';
        }
        
        return {
          issue,
          count: data.count,
          examples: data.examples,
          severity
        };
      })
      .sort((a, b) => b.count - a.count);
    
    // Categorize by user segment
    const userSegments = {
      newUsers: analyzedComments.filter(c => c.userType === 'new'),
      powerUsers: analyzedComments.filter(c => c.userType === 'power'),
      returningUsers: analyzedComments.filter(c => c.userType === 'returning'),
      unknownUsers: analyzedComments.filter(c => c.userType === 'unknown')
    };
    
    // Analyze competitor mentions
    const competitorMentionMap = new Map<string, {
      mentions: AnalyzedComment[];
      positive: number;
      negative: number;
      neutral: number;
      total: number;
    }>();
    
    analyzedComments.forEach(comment => {
      comment.competitorMentions.forEach(competitor => {
        if (!competitorMentionMap.has(competitor)) {
          competitorMentionMap.set(competitor, {
            mentions: [],
            positive: 0,
            negative: 0,
            neutral: 0,
            total: 0
          });
        }
        
        const data = competitorMentionMap.get(competitor)!;
        data.mentions.push(comment);
        data.total++;
        
        if (comment.sentiment === 'positive') data.positive++;
        else if (comment.sentiment === 'negative') data.negative++;
        else data.neutral++;
      });
    });
    
    // Convert competitor mention map to sorted array
    const competitorMentions = Array.from(competitorMentionMap.entries())
      .map(([competitor, data]) => ({
        competitor,
        mentions: data.mentions,
        sentiment: {
          positive: data.positive,
          negative: data.negative,
          neutral: data.neutral,
          average: (data.positive * 5 + data.neutral * 3 + data.negative * 1) / data.total
        }
      }))
      .sort((a, b) => b.mentions.length - a.mentions.length);
    
    // Return complete analysis results
    return {
      comments: analyzedComments,
      sentiment,
      keywords,
      intentions,
      featureRequests,
      bugReports,
      userSegments,
      competitorMentions,
      trends: {} // Will be implemented in Step 4
    };
  }
} 