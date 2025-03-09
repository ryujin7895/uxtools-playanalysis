import { json } from '@remix-run/node';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { playStoreAnalysis } from '~/services/server';

/**
 * API endpoint for Play Store analysis
 */
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const appId = url.searchParams.get('appId');
  const jobId = url.searchParams.get('jobId');
  
  // Add CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  
  try {
    switch (action) {
      case 'metadata': {
        if (!appId) {
          return json({ error: 'App ID is required' }, { status: 400, headers });
        }
        
        const metadata = await playStoreAnalysis.fetchAppMetadata(appId);
        return json({ metadata }, { headers });
      }
      
      case 'job-status': {
        if (!jobId) {
          return json({ error: 'Job ID is required' }, { status: 400, headers });
        }
        
        const job = playStoreAnalysis.getJobStatus(jobId);
        if (!job) {
          return json({ error: 'Job not found' }, { status: 404, headers });
        }
        
        return json({ job }, { headers });
      }
      
      case 'cache-stats': {
        const stats = playStoreAnalysis.getCacheStats();
        return json({ stats }, { headers });
      }
      
      default:
        return json({ error: 'Invalid action' }, { status: 400, headers });
    }
  } catch (error) {
    console.error('API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers }
    );
  }
};

/**
 * API endpoint for Play Store analysis (POST)
 */
export const action: ActionFunction = async ({ request }) => {
  // Add CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  if (request.method !== 'POST') {
    return json(
      { error: 'Method not allowed' },
      { status: 405, headers }
    );
  }
  
  try {
    const formData = await request.formData();
    const action = formData.get('action') as string;
    
    switch (action) {
      case 'analyze': {
        const appIdOrUrl = formData.get('appIdOrUrl') as string;
        if (!appIdOrUrl) {
          return json({ error: 'App ID or URL is required' }, { status: 400, headers });
        }
        
        // Parse options
        const options: any = {};
        
        // Fetch options
        const dateRange = formData.get('dateRange') as string;
        const maxReviews = formData.get('maxReviews') as string;
        
        if (dateRange) {
          options.fetch = { ...options.fetch, dateRange };
        }
        
        if (maxReviews) {
          options.fetch = { ...options.fetch, maxReviews: parseInt(maxReviews, 10) };
        }
        
        // Analysis options
        const minKeywordLength = formData.get('minKeywordLength') as string;
        const maxKeywords = formData.get('maxKeywords') as string;
        
        if (minKeywordLength) {
          options.analysis = { ...options.analysis, minKeywordLength: parseInt(minKeywordLength, 10) };
        }
        
        if (maxKeywords) {
          options.analysis = { ...options.analysis, maxKeywords: parseInt(maxKeywords, 10) };
        }
        
        // Classification options
        const clusterThreshold = formData.get('clusterThreshold') as string;
        
        if (clusterThreshold) {
          options.classification = { ...options.classification, clusterThreshold: parseFloat(clusterThreshold) };
        }
        
        // Aggregation options
        const timePeriod = formData.get('timePeriod') as string;
        
        if (timePeriod) {
          options.aggregation = { ...options.aggregation, timePeriod };
        }
        
        // Cache options
        const cacheEnabled = formData.get('cacheEnabled') as string;
        
        if (cacheEnabled) {
          options.cache = { ...options.cache, enabled: cacheEnabled === 'true' };
        }
        
        // Start analysis job
        const job = await playStoreAnalysis.analyzeApp(appIdOrUrl, options);
        
        return json({ job }, { headers });
      }
      
      case 'cancel-job': {
        const jobId = formData.get('jobId') as string;
        if (!jobId) {
          return json({ error: 'Job ID is required' }, { status: 400, headers });
        }
        
        const success = playStoreAnalysis.cancelJob(jobId);
        return json({ success }, { headers });
      }
      
      case 'clear-cache': {
        const cacheType = formData.get('cacheType') as 'all' | 'reviews' | 'metadata' | 'analysis';
        playStoreAnalysis.clearCache(cacheType || 'all');
        return json({ success: true }, { headers });
      }
      
      default:
        return json({ error: 'Invalid action' }, { status: 400, headers });
    }
  } catch (error) {
    console.error('API error:', error);
    return json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers }
    );
  }
}; 