import { ReactNode } from 'react';

export interface ViewOption {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface Comment {
  id: string;
  content: string;
  date: string;
  score: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  userName?: string;
  version?: string;
  thumbsUp: number;
  intentions?: string[];
}

export interface AnalysisResult {
  comments: Comment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  intentions: {
    feature_request: Comment[];
    bug_report: Comment[];
    praise: Comment[];
    complaint: Comment[];
  };
  keywords: {
    word: string;
    count: number;
  }[];
  trends?: {
    date: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
  }[];
}

export interface EnhancedAnalysisResult extends AnalysisResult {
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

export interface AnalysisResultsProps {
  onReset: () => void;
  appCount: number;
  result: AnalysisResult | EnhancedAnalysisResult;
  comparisonResults?: (AnalysisResult | EnhancedAnalysisResult)[];
}

export interface EnhancedAnalysisProps extends AnalysisResultsProps {
  result: EnhancedAnalysisResult;
  comparisonResults?: EnhancedAnalysisResult[];
}