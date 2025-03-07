export interface Comment {
  id: string;
  userName: string;
  content: string;
  score: number;
  thumbsUp: number;
  date: string;
  year: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface AnalysisResult {
  comments: Comment[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: Array<{
    word: string;
    count: number;
  }>;
  intentions: {
    feature_request: Comment[];
    bug_report: Comment[];
    praise: Comment[];
    complaint: Comment[];
  };
} 