import type { Comment } from '~/types/analysis';

interface TrendPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  total: number;
}

/**
 * Generates trend data from comments
 * @param comments Array of comments with date and sentiment information
 * @param numberOfPoints Number of data points to generate (default: 6)
 * @returns Array of trend points with sentiment counts
 */
export function generateTrendData(comments: Comment[], numberOfPoints: number = 6): TrendPoint[] {
  // Sort comments by date (oldest first)
  const sortedComments = [...comments].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedComments.length === 0) {
    return [];
  }
  
  const startDate = new Date(sortedComments[0].date);
  const endDate = new Date(sortedComments[sortedComments.length - 1].date);
  const timeRange = endDate.getTime() - startDate.getTime();
  
  // If we have fewer than 2 days of data, return empty array
  if (timeRange < 86400000) { // 86400000 = 24 hours in milliseconds
    return [];
  }
  
  // Create time segments
  const segmentSize = timeRange / numberOfPoints;
  const segments: TrendPoint[] = [];
  
  for (let i = 0; i < numberOfPoints; i++) {
    const segmentStart = new Date(startDate.getTime() + i * segmentSize);
    const segmentEnd = new Date(startDate.getTime() + (i + 1) * segmentSize);
    
    // Filter comments in this segment
    const segmentComments = sortedComments.filter(comment => {
      const commentDate = new Date(comment.date);
      return commentDate >= segmentStart && commentDate < segmentEnd;
    });
    
    // Count sentiments
    const positive = segmentComments.filter(comment => comment.sentiment === 'positive').length;
    const negative = segmentComments.filter(comment => comment.sentiment === 'negative').length;
    const neutral = segmentComments.filter(comment => comment.sentiment === 'neutral').length;
    const total = segmentComments.length;
    
    segments.push({
      date: segmentStart.toISOString().split('T')[0], // YYYY-MM-DD format
      positive,
      negative,
      neutral,
      total
    });
  }
  
  return segments;
}
