/**
 * Feature Detection & Classification System
 * Advanced pattern recognition and classification for Play Store reviews
 */

import { AnalyzedComment } from './analysis.server';

/**
 * Feature cluster representing related feature requests
 */
export interface FeatureCluster {
  id: string;
  name: string;
  keywords: string[];
  requests: string[];
  examples: string[];
  count: number;
  averageRating: number;
  sentiment: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Bug cluster representing related bug reports
 */
export interface BugCluster {
  id: string;
  name: string;
  keywords: string[];
  reports: string[];
  examples: string[];
  count: number;
  severity: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  affectedVersions?: string[];
  status: 'new' | 'recurring' | 'increasing' | 'decreasing';
}

/**
 * Competitor analysis with detailed comparison
 */
export interface CompetitorAnalysis {
  competitor: string;
  mentions: number;
  sentiment: number;
  features: {
    better: string[];
    worse: string[];
  };
}

/**
 * Classification options
 */
export interface ClassificationOptions {
  clusterThreshold?: number;
  minClusterSize?: number;
  maxClusters?: number;
  featurePriorityThreshold?: {
    high: number;
    medium: number;
  };
  bugSeverityThreshold?: {
    high: number;
    medium: number;
  };
  maxExamples?: number;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  featureClusters: FeatureCluster[];
  bugClusters: BugCluster[];
  competitorAnalysis: CompetitorAnalysis[];
  recurringIssues: BugCluster[];
  topFeatureRequests: FeatureCluster[];
  criticalBugs: BugCluster[];
}

/**
 * Classification Service for advanced feature and bug detection
 */
export class ClassificationService {
  /**
   * Default classification options
   */
  private static readonly DEFAULT_OPTIONS: ClassificationOptions = {
    clusterThreshold: 0.6,
    minClusterSize: 2,
    maxClusters: 20,
    featurePriorityThreshold: {
      high: 10,
      medium: 5
    },
    bugSeverityThreshold: {
      high: 8,
      medium: 3
    },
    maxExamples: 3
  };

  /**
   * Calculate Jaccard similarity between two strings
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private static calculateJaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(w => w.length > 2));
    
    if (set1.size === 0 || set2.size === 0) return 0;
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * Calculate cosine similarity between two strings
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private static calculateCosineSimilarity(str1: string, str2: string): number {
    // Tokenize strings
    const tokens1 = str1.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const tokens2 = str2.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    
    // Create term frequency vectors
    const vector1: Record<string, number> = {};
    const vector2: Record<string, number> = {};
    
    // Build vectors
    for (const token of tokens1) {
      vector1[token] = (vector1[token] || 0) + 1;
    }
    
    for (const token of tokens2) {
      vector2[token] = (vector2[token] || 0) + 1;
    }
    
    // Get all unique terms
    const terms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (const term of terms) {
      const v1 = vector1[term] || 0;
      const v2 = vector2[term] || 0;
      
      dotProduct += v1 * v2;
      magnitude1 += v1 * v1;
      magnitude2 += v2 * v2;
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Calculate similarity between two strings
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    // Use both Jaccard and Cosine similarity and take the higher score
    const jaccardSim = this.calculateJaccardSimilarity(str1, str2);
    const cosineSim = this.calculateCosineSimilarity(str1, str2);
    return Math.max(jaccardSim, cosineSim);
  }

  /**
   * Cluster similar strings using hierarchical clustering
   * @param items Array of strings to cluster
   * @param allDocuments All documents for corpus comparison
   * @param threshold Similarity threshold for clustering
   * @returns Array of clusters
   */
  private static clusterSimilarItems(
    items: string[],
    allDocuments: string[],
    threshold: number
  ): string[][] {
    if (items.length === 0) return [];
    if (items.length === 1) return [items];
    
    // Calculate similarity matrix
    const similarityMatrix: number[][] = [];
    
    for (let i = 0; i < items.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < items.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1; // Same item
        } else if (j < i) {
          similarityMatrix[i][j] = similarityMatrix[j][i]; // Already calculated
        } else {
          // Calculate similarity
          similarityMatrix[i][j] = this.calculateSimilarity(items[i], items[j]);
        }
      }
    }
    
    // Initialize clusters with one item each
    const clusters: Set<number>[] = items.map((_, index) => new Set([index]));
    
    // Hierarchical clustering
    while (clusters.length > 1) {
      let maxSimilarity = -1;
      let mergeI = -1;
      let mergeJ = -1;
      
      // Find the two most similar clusters
      for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          // Calculate average similarity between clusters
          let totalSim = 0;
          let count = 0;
          
          for (const itemI of clusters[i]) {
            for (const itemJ of clusters[j]) {
              totalSim += similarityMatrix[itemI][itemJ];
              count++;
            }
          }
          
          const avgSim = totalSim / count;
          
          if (avgSim > maxSimilarity) {
            maxSimilarity = avgSim;
            mergeI = i;
            mergeJ = j;
          }
        }
      }
      
      // If similarity is below threshold, stop clustering
      if (maxSimilarity < threshold) break;
      
      // Merge the two most similar clusters
      for (const item of clusters[mergeJ]) {
        clusters[mergeI].add(item);
      }
      
      // Remove the merged cluster
      clusters.splice(mergeJ, 1);
    }
    
    // Convert cluster indices back to strings
    return clusters.map(cluster => 
      Array.from(cluster).map(index => items[index])
    );
  }

  /**
   * Extract keywords from a cluster of similar items
   * @param cluster Cluster of similar items
   * @param allDocuments All documents for corpus comparison
   * @returns Array of keywords
   */
  private static extractClusterKeywords(cluster: string[], allDocuments: string[]): string[] {
    // Combine all items in the cluster
    const combinedText = cluster.join(' ');
    
    // Tokenize and count word frequencies
    const wordFreq: Record<string, number> = {};
    const words = combinedText.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
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
      
      const tf = wordFreq[word] / words.length;
      const idf = Math.log(docCount / (docFreq[word] || 1));
      const score = tf * idf;
      
      tfidf.push({ term: word, score });
    }
    
    // Get the most important terms
    return tfidf
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.term);
  }

  /**
   * Generate a name for a cluster based on its keywords and items
   * @param cluster Cluster of similar items
   * @param keywords Keywords extracted from the cluster
   * @returns Cluster name
   */
  private static generateClusterName(cluster: string[], keywords: string[]): string {
    // Find the shortest item in the cluster that contains the most keywords
    let bestItem = cluster[0];
    let bestScore = 0;
    
    for (const item of cluster) {
      const lowerItem = item.toLowerCase();
      const score = keywords.reduce((count, keyword) => 
        lowerItem.includes(keyword.toLowerCase()) ? count + 1 : count, 0
      ) / item.length; // Normalize by length to prefer shorter items
      
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }
    
    // Truncate if too long
    return bestItem.length > 50 ? bestItem.substring(0, 50) + '...' : bestItem;
  }

  /**
   * Determine feature priority based on count and sentiment
   * @param count Number of requests
   * @param sentiment Average sentiment
   * @param thresholds Priority thresholds
   * @returns Priority level
   */
  private static determineFeaturePriority(
    count: number,
    sentiment: number,
    thresholds: { high: number; medium: number }
  ): 'low' | 'medium' | 'high' {
    // High priority if many requests or high sentiment
    if (count >= thresholds.high || sentiment >= 4.5) {
      return 'high';
    }
    
    // Medium priority if moderate requests or good sentiment
    if (count >= thresholds.medium || sentiment >= 3.5) {
      return 'medium';
    }
    
    // Low priority otherwise
    return 'low';
  }

  /**
   * Determine bug impact based on count, severity, and ratings
   * @param count Number of reports
   * @param severity Bug severity
   * @param ratings Array of ratings
   * @param thresholds Severity thresholds
   * @returns Impact level
   */
  private static determineBugImpact(
    count: number,
    severity: 'low' | 'medium' | 'high',
    ratings: number[],
    thresholds: { high: number; medium: number }
  ): 'low' | 'medium' | 'high' {
    // Calculate average rating
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    
    // High impact if many reports, high severity, or very low ratings
    if (count >= thresholds.high || severity === 'high' || avgRating <= 1.5) {
      return 'high';
    }
    
    // Medium impact if moderate reports, medium severity, or low ratings
    if (count >= thresholds.medium || severity === 'medium' || avgRating <= 3) {
      return 'medium';
    }
    
    // Low impact otherwise
    return 'low';
  }

  /**
   * Detect affected versions for a bug
   * @param reports Bug reports
   * @param versions Array of app versions
   * @returns Array of affected versions
   */
  private static detectAffectedVersions(reports: string[], versions: string[]): string[] {
    const affectedVersions = new Set<string>();
    
    // Look for version numbers in reports
    for (const report of reports) {
      for (const version of versions) {
        if (report.includes(version)) {
          affectedVersions.add(version);
        }
      }
    }
    
    return Array.from(affectedVersions);
  }

  /**
   * Determine bug status based on trend
   * @param counts Bug counts over time
   * @returns Bug status
   */
  private static determineBugStatus(counts: number[]): 'new' | 'recurring' | 'increasing' | 'decreasing' {
    if (counts.length <= 1) return 'new';
    
    // Check if bug is new (only in most recent period)
    if (counts.slice(1).every(count => count === 0)) {
      return 'new';
    }
    
    // Check if bug is increasing
    let increasing = true;
    for (let i = 1; i < counts.length; i++) {
      if (counts[i - 1] <= counts[i]) {
        increasing = false;
        break;
      }
    }
    if (increasing) return 'increasing';
    
    // Check if bug is decreasing
    let decreasing = true;
    for (let i = 1; i < counts.length; i++) {
      if (counts[i - 1] >= counts[i]) {
        decreasing = false;
        break;
      }
    }
    if (decreasing) return 'decreasing';
    
    // Otherwise it's recurring
    return 'recurring';
  }

  /**
   * Classify feature requests into clusters
   * @param comments Analyzed comments
   * @param options Classification options
   * @returns Array of feature clusters
   */
  public static classifyFeatureRequests(
    comments: AnalyzedComment[],
    options: ClassificationOptions = {}
  ): FeatureCluster[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Extract all feature requests
    const allFeatureRequests: string[] = [];
    const requestToComments = new Map<string, AnalyzedComment[]>();
    
    comments.forEach(comment => {
      comment.featureRequests.forEach(request => {
        allFeatureRequests.push(request);
        
        if (!requestToComments.has(request)) {
          requestToComments.set(request, []);
        }
        
        requestToComments.get(request)!.push(comment);
      });
    });
    
    // Get all review texts for corpus analysis
    const allTexts = comments.map(comment => comment.content);
    
    // Cluster similar feature requests
    const clusters = this.clusterSimilarItems(
      allFeatureRequests,
      allTexts,
      opts.clusterThreshold || 0.6
    );
    
    // Filter clusters by size and limit total number
    const validClusters = clusters
      .filter(cluster => cluster.length >= (opts.minClusterSize || 2))
      .sort((a, b) => b.length - a.length)
      .slice(0, opts.maxClusters || 20);
    
    // Process each cluster
    return validClusters.map((cluster, index) => {
      // Extract keywords for this cluster
      const keywords = this.extractClusterKeywords(cluster, allTexts);
      
      // Generate a name for the cluster
      const name = this.generateClusterName(cluster, keywords);
      
      // Collect all comments associated with this cluster
      const clusterComments: AnalyzedComment[] = [];
      cluster.forEach(request => {
        const comments = requestToComments.get(request) || [];
        clusterComments.push(...comments);
      });
      
      // Remove duplicates
      const uniqueComments = Array.from(
        new Map(clusterComments.map(comment => [comment.id, comment])).values()
      );
      
      // Calculate average rating
      const ratings = uniqueComments.map(comment => comment.score);
      const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      
      // Calculate sentiment
      const sentiment = uniqueComments.reduce((sum, comment) => {
        return sum + (comment.sentiment === 'positive' ? 1 : 
                     comment.sentiment === 'negative' ? -1 : 0);
      }, 0) / uniqueComments.length;
      
      // Select examples
      const examples = uniqueComments
        .sort((a, b) => b.score - a.score) // Sort by highest rating
        .slice(0, opts.maxExamples || 3)
        .map(comment => comment.content);
      
      // Determine priority
      const priority = this.determineFeaturePriority(
        uniqueComments.length,
        averageRating,
        opts.featurePriorityThreshold || { high: 10, medium: 5 }
      );
      
      return {
        id: `feature-${index}`,
        name,
        keywords,
        requests: cluster,
        examples,
        count: uniqueComments.length,
        averageRating,
        sentiment,
        priority
      };
    });
  }

  /**
   * Classify bug reports into clusters
   * @param comments Analyzed comments
   * @param appVersions Array of app versions
   * @param options Classification options
   * @returns Array of bug clusters
   */
  public static classifyBugReports(
    comments: AnalyzedComment[],
    appVersions: string[] = [],
    options: ClassificationOptions = {}
  ): BugCluster[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    // Extract all bug reports
    const allBugReports: string[] = [];
    const reportToComments = new Map<string, AnalyzedComment[]>();
    
    comments.forEach(comment => {
      comment.bugReports.forEach(report => {
        allBugReports.push(report);
        
        if (!reportToComments.has(report)) {
          reportToComments.set(report, []);
        }
        
        reportToComments.get(report)!.push(comment);
      });
    });
    
    // Get all review texts for corpus analysis
    const allTexts = comments.map(comment => comment.content);
    
    // Cluster similar bug reports
    const clusters = this.clusterSimilarItems(
      allBugReports,
      allTexts,
      opts.clusterThreshold || 0.6
    );
    
    // Filter clusters by size and limit total number
    const validClusters = clusters
      .filter(cluster => cluster.length >= (opts.minClusterSize || 2))
      .sort((a, b) => b.length - a.length)
      .slice(0, opts.maxClusters || 20);
    
    // Process each cluster
    return validClusters.map((cluster, index) => {
      // Extract keywords for this cluster
      const keywords = this.extractClusterKeywords(cluster, allTexts);
      
      // Generate a name for the cluster
      const name = this.generateClusterName(cluster, keywords);
      
      // Collect all comments associated with this cluster
      const clusterComments: AnalyzedComment[] = [];
      cluster.forEach(report => {
        const comments = reportToComments.get(report) || [];
        clusterComments.push(...comments);
      });
      
      // Remove duplicates
      const uniqueComments = Array.from(
        new Map(clusterComments.map(comment => [comment.id, comment])).values()
      );
      
      // Get ratings
      const ratings = uniqueComments.map(comment => comment.score);
      
      // Determine severity (use the highest severity from any comment)
      const severity = uniqueComments.some(comment => comment.severity === 'high') ? 'high' :
                      uniqueComments.some(comment => comment.severity === 'medium') ? 'medium' : 'low';
      
      // Determine impact
      const impact = this.determineBugImpact(
        uniqueComments.length,
        severity,
        ratings,
        opts.bugSeverityThreshold || { high: 8, medium: 3 }
      );
      
      // Select examples
      const examples = uniqueComments
        .sort((a, b) => a.score - b.score) // Sort by lowest rating for bugs
        .slice(0, opts.maxExamples || 3)
        .map(comment => comment.content);
      
      // Detect affected versions
      const affectedVersions = appVersions.length > 0 ?
        this.detectAffectedVersions(cluster, appVersions) : undefined;
      
      // Determine status (simplified for now)
      const status = 'new'; // Will be enhanced in Step 4 with trend data
      
      return {
        id: `bug-${index}`,
        name,
        keywords,
        reports: cluster,
        examples,
        count: uniqueComments.length,
        severity,
        impact,
        affectedVersions,
        status
      };
    });
  }

  /**
   * Perform complete classification of reviews
   * @param comments Analyzed comments
   * @param appVersions Array of app versions
   * @param options Classification options
   * @returns Classification result
   */
  public static classifyReviews(
    comments: AnalyzedComment[],
    appVersions: string[] = [],
    options: ClassificationOptions = {}
  ): ClassificationResult {
    // Classify feature requests
    const featureClusters = this.classifyFeatureRequests(comments, options);
    
    // Classify bug reports
    const bugClusters = this.classifyBugReports(comments, appVersions, options);
    
    // Identify recurring issues (simplified for now)
    const recurringIssues = bugClusters.filter(bug => bug.status === 'recurring');
    
    // Identify top feature requests
    const topFeatureRequests = featureClusters
      .filter(feature => feature.priority === 'high')
      .sort((a, b) => b.count - a.count);
    
    // Identify critical bugs
    const criticalBugs = bugClusters
      .filter(bug => bug.impact === 'high')
      .sort((a, b) => b.count - a.count);
    
    return {
      featureClusters,
      bugClusters,
      competitorAnalysis: [],
      recurringIssues,
      topFeatureRequests,
      criticalBugs
    };
  }
} 