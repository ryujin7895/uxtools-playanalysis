# Play Store Analysis System Migration Guide

## Overview

We've implemented a new Play Store Analysis System that replaces the old implementation. The new system provides:

- More efficient data fetching with pagination and retry logic
- Advanced sentiment analysis using NLP techniques
- Intelligent feature request and bug detection
- Comprehensive data aggregation and trend analysis
- Performance optimizations with caching

## Architecture

The new system consists of several modules:

1. **PlayStoreService** (`playstore.server.ts`) - Core data fetching from Google Play Store
2. **ReviewAnalysisService** (`analysis.server.ts`) - Advanced NLP-based analysis
3. **ClassificationService** (`classification.server.ts`) - Feature and bug classification
4. **AggregationService** (`aggregation.server.ts`) - Data aggregation and trend detection
5. **PlayStoreAnalysisSystem** (`index.ts`) - Unified API with caching and job management

## How to Use

### Basic Usage

```typescript
import { playStoreAnalysis } from '~/services/server';

// Analyze an app
const job = await playStoreAnalysis.analyzeApp('com.example.app', {
  fetch: {
    dateRange: '30days',
    maxReviews: 1000
  }
});

// Get job status
const status = playStoreAnalysis.getJobStatus(job.id);

// When job is completed, access the results
if (status.status === 'completed') {
  const results = status.result;
  // Use results...
}
```

### API Endpoint

Use the new API endpoint for frontend components:

```typescript
// GET request for metadata
fetch('/api/playstore?action=metadata&appId=com.example.app')
  .then(response => response.json())
  .then(data => {
    // Use metadata...
  });

// POST request for analysis
const formData = new FormData();
formData.append('action', 'analyze');
formData.append('appIdOrUrl', 'com.example.app');
formData.append('dateRange', '30days');

fetch('/api/playstore', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    // Get job ID
    const jobId = data.job.id;
    
    // Poll for job completion
    const checkStatus = () => {
      fetch(`/api/playstore?action=job-status&jobId=${jobId}`)
        .then(response => response.json())
        .then(data => {
          if (data.job.status === 'completed') {
            // Use results...
            const results = data.job.result;
          } else if (data.job.status === 'failed') {
            // Handle error...
          } else {
            // Continue polling
            setTimeout(checkStatus, 1000);
          }
        });
    };
    
    checkStatus();
  });
```

## Migration Steps

If you're using the old implementation, follow these steps to migrate:

1. Replace imports:
   ```typescript
   // Old
   import { PlayStoreService } from '~/services/server/playstore.server';
   
   // New
   import { playStoreAnalysis } from '~/services/server';
   ```

2. Replace direct method calls:
   ```typescript
   // Old
   const results = await PlayStoreService.fetchComments(appId, dateRange);
   
   // New
   const job = await playStoreAnalysis.analyzeApp(appId, {
     fetch: { dateRange }
   });
   
   // Wait for job completion
   let currentJob = playStoreAnalysis.getJobStatus(job.id);
   while (currentJob && currentJob.status !== 'completed' && currentJob.status !== 'failed') {
     await new Promise(resolve => setTimeout(resolve, 500));
     currentJob = playStoreAnalysis.getJobStatus(job.id);
   }
   
   const results = currentJob.result;
   ```

3. Update form submissions:
   ```typescript
   // Old
   <Form method="post">
     <input type="hidden" name="appIds[]" value={appId} />
     <input type="hidden" name="dateRange" value={dateRange} />
     <button type="submit">Analyze</button>
   </Form>
   
   // New
   <Form method="post">
     <input type="hidden" name="appId" value={appId} />
     <input type="hidden" name="dateRange" value={dateRange} />
     <button type="submit">Analyze</button>
   </Form>
   ```

## Result Structure

The new system provides more comprehensive results:

```typescript
interface AggregatedResults {
  summary: {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: RatingDistribution;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    userSegmentDistribution: UserSegmentDistribution;
  };
  trends: {
    overall: TrendAnalysis;
    features: FeatureTrend[];
    bugs: BugTrend[];
  };
  topFeatures: FeatureCluster[];
  criticalBugs: BugCluster[];
  competitorInsights: Array<{
    competitor: string;
    mentions: number;
    sentiment: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  insights: Insight[];
  exportData: {
    csv: string;
    json: string;
  };
}
```

## Advanced Usage

### Custom Analysis Options

```typescript
const job = await playStoreAnalysis.analyzeApp('com.example.app', {
  fetch: {
    dateRange: '90days',
    maxReviews: 2000,
    retryAttempts: 5
  },
  analysis: {
    minKeywordLength: 5,
    maxKeywords: 100
  },
  classification: {
    clusterThreshold: 0.7,
    maxClusters: 30
  },
  aggregation: {
    timePeriod: 'week',
    maxDataPoints: 24
  },
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  }
});
```

### Direct Service Access

For more control, you can access the individual services directly:

```typescript
import { 
  PlayStoreService, 
  ReviewAnalysisService, 
  ClassificationService, 
  AggregationService 
} from '~/services/server';

// Fetch reviews
const reviews = await PlayStoreService.fetchReviews({
  appIdOrUrl: 'com.example.app',
  dateRange: '30days'
});

// Analyze reviews
const analysis = ReviewAnalysisService.analyzeReviews(reviews);

// Classify reviews
const classification = ClassificationService.classifyReviews(
  analysis.comments,
  ['1.0.0', '1.1.0'] // App versions
);

// Aggregate results
const results = AggregationService.aggregateResults(
  analysis.comments,
  analysis,
  classification
);
```

## Caching

The system includes built-in caching to improve performance:

```typescript
// Clear cache
playStoreAnalysis.clearCache('all'); // 'all', 'reviews', 'metadata', or 'analysis'

// Get cache statistics
const stats = playStoreAnalysis.getCacheStats();
```

## Performance Considerations

- For large datasets, consider limiting the number of reviews:
  ```typescript
  const job = await playStoreAnalysis.analyzeApp('com.example.app', {
    fetch: {
      maxReviews: 1000 // Default is 5000
    }
  });
  ```

- Use the caching system to avoid redundant fetches:
  ```typescript
  const job = await playStoreAnalysis.analyzeApp('com.example.app', {
    cache: {
      enabled: true,
      ttl: 3600000 // 1 hour
    }
  });
  ```

- For time-sensitive operations, use the abort signal:
  ```typescript
  const controller = new AbortController();
  
  const job = await playStoreAnalysis.analyzeApp('com.example.app', {
    abortSignal: controller.signal
  });
  
  // Cancel the operation if it takes too long
  setTimeout(() => controller.abort(), 30000);
  ``` 