export interface Comment {
  id: string;
  userName?: string;
  content: string;
  date: string;
  score: number;
  thumbsUp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  version?: string;
  intentions?: string[]; // Add this field for comment intentions
}

export interface AnalysisResult {
  comments: Comment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: {
    word: string;
    count: number;
  }[];
  intentions: {
    feature_request: Comment[];
    bug_report: Comment[];
    praise: Comment[];
    complaint: Comment[];
  };
}

// Add enhanced types
export interface FeatureRequestAnalysis {
  feature: string;
  count: number;
  examples: string[];
  averageRating: number;
}

export interface BugReportAnalysis {
  issue: string;
  count: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface UserSegmentAnalysis {
  newUsers: Comment[];
  powerUsers: Comment[];
  returningUsers: Comment[];
}

export interface CompetitiveMention {
  competitor: string;
  mentions: Comment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface EnhancedAnalysisResult extends AnalysisResult {
  featureRequests: FeatureRequestAnalysis[];
  bugReports: BugReportAnalysis[];
  userSegments: UserSegmentAnalysis;
  competitiveMentions: CompetitiveMention[];
}