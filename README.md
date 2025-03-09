# Play Store Analysis System

A comprehensive system for analyzing Google Play Store reviews with advanced NLP techniques, feature request detection, bug classification, and trend analysis.

## Features

- **Efficient Data Fetching**: Retrieve up to 5000+ reviews with pagination and retry logic
- **Advanced Sentiment Analysis**: NLP-based sentiment analysis using the natural library
- **Feature Request Detection**: Identify and cluster feature requests using pattern recognition
- **Bug Classification**: Detect and categorize bugs with severity assessment
- **Competitor Analysis**: Identify competitor mentions and analyze sentiment
- **Trend Detection**: Track sentiment, feature requests, and bugs over time
- **Performance Optimization**: Caching system for improved performance
- **Comprehensive API**: Unified API with job management and progress tracking

## Architecture

The system consists of several modules:

1. **PlayStoreService** - Core data fetching from Google Play Store
2. **ReviewAnalysisService** - Advanced NLP-based analysis
3. **ClassificationService** - Feature and bug classification
4. **AggregationService** - Data aggregation and trend detection
5. **PlayStoreAnalysisSystem** - Unified API with caching and job management

## Getting Started

### Prerequisites

- Node.js 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Usage

```typescript
import { playStoreAnalysis } from '~/services/server';

// Analyze an app
const job = await playStoreAnalysis.analyzeApp('com.example.app');

// Get job status
const status = playStoreAnalysis.getJobStatus(job.id);

// When job is completed, access the results
if (status.status === 'completed') {
  const results = status.result;
  // Use results...
}
```

See the [Migration Guide](MIGRATION_GUIDE.md) for more detailed usage examples.

## API Reference

### PlayStoreAnalysisSystem

- `analyzeApp(appIdOrUrl, options)` - Start an analysis job
- `getJobStatus(jobId)` - Get the status of a job
- `cancelJob(jobId)` - Cancel a job
- `fetchAppMetadata(appIdOrUrl)` - Fetch app metadata
- `fetchReviews(options)` - Fetch app reviews
- `clearCache(type)` - Clear the cache
- `getCacheStats()` - Get cache statistics

### PlayStoreService

- `fetchReviews(options)` - Fetch reviews from Google Play Store
- `fetchAppMetadata(appIdOrUrl)` - Fetch app metadata from Google Play Store

### ReviewAnalysisService

- `analyzeReviews(reviews, options)` - Analyze reviews with NLP techniques
- `analyzeReview(review, allReviewTexts, options)` - Analyze a single review

### ClassificationService

- `classifyReviews(comments, appVersions, options)` - Classify reviews into features and bugs
- `classifyFeatureRequests(comments, options)` - Classify feature requests
- `classifyBugReports(comments, appVersions, options)` - Classify bug reports
- `analyzeCompetitors(comments)` - Analyze competitor mentions

### AggregationService

- `aggregateResults(comments, analysis, classification, options)` - Aggregate analysis results

## License

MIT
