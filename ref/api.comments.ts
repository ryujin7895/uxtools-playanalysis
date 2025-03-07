import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import gplay from "google-play-scraper";
import natural from "natural";

interface PlayStoreReview {
  id: string;
  userName: string;
  text: string;
  score: number;
  thumbsUp: number;
  date: string;
}

interface Comment {
  id: string;
  userName: string;
  content: string;
  score: number;
  thumbsUp: number;
  date: string;
  year: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface AnalysisResult {
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

export const action: ActionFunction = async ({ request }) => {
  console.log('API endpoint called with method:', request.method);

  // Add CORS headers
  const headers = new Headers({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers });
  }

  if (request.method !== "POST") {
    console.log('Invalid method:', request.method);
    return json(
      { error: "Method not allowed" },
      { status: 405, headers }
    );
  }

  try {
    const formData = await request.formData();
    const url = formData.get("url") as string;
    const year = formData.get("year") as string;
    const searchTerm = formData.get("searchTerm") as string;

    console.log('Received form data:', { url, year, searchTerm });

    if (!url) {
      console.log('URL is missing');
      return json(
        { error: "URL is required" },
        { status: 400, headers }
      );
    }

    // Extract app ID from URL
    const appId = url.split("id=")[1]?.split("&")[0];
    if (!appId) {
      console.log('Invalid Play Store URL:', url);
      return json(
        { error: "Invalid Play Store URL" },
        { status: 400, headers }
      );
    }

    console.log('Fetching reviews for app ID:', appId);

    // Fetch comments with pagination
    let allReviews: PlayStoreReview[] = [];
    let nextPaginationToken: string | undefined = undefined;
    const maxReviews = 5000;
    let batchNumber = 0;
    let reachedEnd = false;

    console.log('Starting to fetch reviews (target limit:', maxReviews, ')');
    
    do {
      batchNumber++;
      console.log(`Fetching batch #${batchNumber}...`);
      
      try {
        const reviewBatch: { data: PlayStoreReview[]; nextPaginationToken?: string } = await gplay.reviews({
          appId,
          sort: gplay.sort.NEWEST,
          num: 150, // Increased batch size to 150
          paginate: true,
          nextPaginationToken,
        });

        if (!reviewBatch || !reviewBatch.data || reviewBatch.data.length === 0) {
          console.log('No more reviews available in this batch');
          reachedEnd = true;
          break;
        }

        allReviews = allReviews.concat(reviewBatch.data);
        nextPaginationToken = reviewBatch.nextPaginationToken;
        
        const progress = Math.min((allReviews.length / maxReviews) * 100, 100).toFixed(1);
        console.log(`Batch #${batchNumber}: Got ${reviewBatch.data.length} reviews. Total: ${allReviews.length} (${progress}%)`);
        console.log('Has next page token:', !!nextPaginationToken);
        
        // Stop if we've reached the maximum number of reviews
        if (allReviews.length >= maxReviews) {
          console.log(`Reached maximum review limit of ${maxReviews}`);
          break;
        }

        // Stop if we don't have a next page token
        if (!nextPaginationToken) {
          console.log('No next page token available - reached end of reviews');
          reachedEnd = true;
          break;
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error in batch #${batchNumber}:`, error);
        reachedEnd = true;
        break;
      }
    } while (!reachedEnd);

    if (allReviews.length === 0) {
      console.log('No reviews found for app ID:', appId);
      throw new Error("No reviews found");
    }

    console.log(`Completed fetching reviews. Total retrieved: ${allReviews.length}`);
    if (reachedEnd) {
      console.log('Reached natural end of available reviews');
    }

    // Process and filter comments
    const processedComments: Comment[] = allReviews
      .map((comment: PlayStoreReview) => {
        const reviewDate = new Date(comment.date || new Date());
        const content = comment.text || "";
        
        // Calculate sentiment for this comment
        const analyzer = new natural.SentimentAnalyzer("English", natural.PorterStemmer, "afinn");
        const sentimentScore = analyzer.getSentiment(content.split(" "));
        const sentiment = sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';

        return {
          id: comment.id || String(Math.random()),
          userName: comment.userName || "Anonymous",
          content,
          score: comment.score || 0,
          thumbsUp: comment.thumbsUp || 0,
          date: reviewDate.toISOString(),
          year: reviewDate.getFullYear(),
          sentiment,
        };
      })
      .filter((comment: Comment) => {
        const matchesYear = year === "all" || comment.year.toString() === year;
        const matchesSearch = !searchTerm || 
          comment.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        console.log(`Comment from year ${comment.year}, matches year filter: ${matchesYear}, matches search: ${matchesSearch}`);
        
        return matchesYear && matchesSearch;
      });

    console.log(`After filtering: ${processedComments.length} comments match criteria`);

    // Update sentiment counts based on pre-calculated sentiments
    const sentiment = {
      positive: processedComments.filter(c => c.sentiment === 'positive' as const).length,
      negative: processedComments.filter(c => c.sentiment === 'negative' as const).length,
      neutral: processedComments.filter(c => c.sentiment === 'neutral' as const).length,
    };

    // Keyword Extraction
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();
    processedComments.forEach((comment: Comment) => {
      tfidf.addDocument(comment.content);
    });

    const keywords = new Set<string>();
    const keywordCounts: { [key: string]: number } = {};

    processedComments.forEach((comment: Comment) => {
      const words = comment.content.toLowerCase().split(/\W+/);
      words.forEach((word) => {
        if (word.length > 3) {
          keywords.add(word);
          keywordCounts[word] = (keywordCounts[word] || 0) + 1;
        }
      });
    });

    const sortedKeywords = Array.from(keywords)
      .map((word) => ({
        word,
        count: keywordCounts[word],
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Intention Analysis
    const intentions = {
      feature_request: [] as Comment[],
      bug_report: [] as Comment[],
      praise: [] as Comment[],
      complaint: [] as Comment[],
    };

    const intentionKeywords = {
      feature_request: ["add", "would be nice", "should have", "need", "missing"],
      bug_report: ["bug", "crash", "error", "issue", "problem", "not working"],
      praise: ["great", "awesome", "love", "excellent", "perfect", "amazing"],
      complaint: ["bad", "terrible", "poor", "waste", "disappointed", "awful"],
    };

    processedComments.forEach((comment: Comment) => {
      const content = comment.content.toLowerCase();
      
      for (const [intention, keywords] of Object.entries(intentionKeywords)) {
        if (keywords.some((keyword) => content.includes(keyword))) {
          intentions[intention as keyof typeof intentions].push(comment);
        }
      }
    });

    const result: AnalysisResult = {
      comments: processedComments,
      sentiment,
      keywords: sortedKeywords,
      intentions,
    };

    return json(result, { headers });
  } catch (error) {
    console.error("Error analyzing comments:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to analyze comments" },
      { status: 500, headers }
    );
  }
}; 