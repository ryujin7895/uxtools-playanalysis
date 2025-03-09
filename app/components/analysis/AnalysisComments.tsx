import { useState, useMemo, useEffect } from "react";
import { 
  MagnifyingGlassIcon, 
  ChevronLeftIcon,
  ChevronRightIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { Card, Badge, Dropdown, Tooltip } from "flowbite-react";
import type { AnalysisResultsProps, Comment } from "~/types/analysis";

export function AnalysisComments({ result }: AnalysisResultsProps) {
  // State for search, filters, and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isAnyFilterActive, setIsAnyFilterActive] = useState(false);
  
  // Constants
  const commentsPerPage = 5;

  // Check if any filter is active
  useEffect(() => {
    setIsAnyFilterActive(!!searchQuery || sentimentFilter !== null || ratingFilter !== null);
  }, [searchQuery, sentimentFilter, ratingFilter]);

  // Filter and sort comments based on criteria
  const filteredComments = useMemo(() => {
    let filtered = [...result.comments];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        comment => 
          comment.content.toLowerCase().includes(query) ||
          (comment.userName && comment.userName.toLowerCase().includes(query))
      );
    }
    
    // Apply sentiment filter
    if (sentimentFilter) {
      filtered = filtered.filter(comment => comment.sentiment === sentimentFilter);
    }
    
    // Apply rating filter
    if (ratingFilter !== null) {
      filtered = filtered.filter(comment => comment.score === ratingFilter);
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [result.comments, searchQuery, sentimentFilter, ratingFilter]);

  // Get sentiment counts for filter context
  const sentimentCounts = useMemo(() => {
    const counts = {
      positive: 0,
      negative: 0, 
      neutral: 0
    };
    
    result.comments.forEach(comment => {
      counts[comment.sentiment]++;
    });
    
    return counts;
  }, [result.comments]);
  
  // Calculate rating distribution
  const ratingCounts = useMemo(() => {
    // Define with explicit type to avoid conversion issues
    const counts: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };
    
    result.comments.forEach(comment => {
      const roundedScore = Math.round(comment.score);
      if (roundedScore >= 1 && roundedScore <= 5) {
        counts[roundedScore.toString()]++;
      }
    });
    
    return counts;
  }, [result.comments]);

  // Calculate pagination
  const totalComments = filteredComments.length;
  const totalPages = Math.max(1, Math.ceil(totalComments / commentsPerPage));
  
  // Get current page items
  const startIndex = (currentPage - 1) * commentsPerPage;
  const endIndex = Math.min(startIndex + commentsPerPage, totalComments);
  const currentComments = filteredComments.slice(startIndex, endIndex);

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSentimentFilter(null);
    setRatingFilter(null);
    setCurrentPage(1);
  };

  // Clear individual filters
  const clearSearchQuery = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };
  
  const clearSentimentFilter = () => {
    setSentimentFilter(null);
    setCurrentPage(1);
  };
  
  const clearRatingFilter = () => {
    setRatingFilter(null);
    setCurrentPage(1);
  };

  // Display names for filters
  const getSentimentDisplayName = (sentiment: string) => {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1);
  };

  // Helper function to get sentiment color for Badge
  const getSentimentColor = (sentiment: string): "success" | "failure" | "purple" => {
    switch (sentiment) {
      case "positive":
        return "success";
      case "negative":
        return "failure";
      default:
        return "purple";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Search with enhanced experience */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <input
          type="search"
          className={`block w-full p-2.5 pl-10 text-sm text-gray-900 border ${
            searchFocused ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-300'
          } rounded-lg bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
          placeholder="Search in comments..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
            onClick={clearSearchQuery}
            aria-label="Clear search"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        {searchFocused && (
          <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 dark:bg-gray-800 dark:border-gray-700 z-10">
            <div className="p-2 text-xs text-gray-500">
              Search by comment content or username
            </div>
          </div>
        )}
      </div>

      {/* Active filters summary */}
      {isAnyFilterActive && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500">Active filters:</span>
          
          {searchQuery && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{searchQuery.length > 15 ? searchQuery.substring(0, 15) + '...' : searchQuery}"
              <button onClick={clearSearchQuery} className="ml-1 text-blue-600 hover:text-blue-800">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {sentimentFilter && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Sentiment: {getSentimentDisplayName(sentimentFilter)}
              <button onClick={clearSentimentFilter} className="ml-1 text-blue-600 hover:text-blue-800">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {ratingFilter !== null && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Rating: {ratingFilter}
              <button onClick={clearRatingFilter} className="ml-1 text-blue-600 hover:text-blue-800">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          )}
          
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Enhanced filters with counts */}
      <div className="flex flex-wrap gap-4">
        {/* Responsive filters toggle for mobile */}
        <button 
          className="md:hidden inline-flex items-center text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
          Filters
          {isAnyFilterActive && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs font-medium px-1.5 rounded-full">
              {(!!searchQuery ? 1 : 0) + (sentimentFilter !== null ? 1 : 0) + (ratingFilter !== null ? 1 : 0)}
            </span>
          )}
        </button>
        
        {/* Filter container - responsive */}
        <div className={`flex flex-wrap gap-4 w-full md:w-auto ${filterOpen ? 'block' : 'hidden md:flex'}`}>
          {/* Sentiment filter with counts */}
          <Dropdown 
            label={sentimentFilter ? `Sentiment: ${getSentimentDisplayName(sentimentFilter)}` : "All Sentiments"} 
            inline
            className="w-full sm:w-auto"
          >
            <Dropdown.Item 
              onClick={() => { setSentimentFilter(null); setCurrentPage(1); }}
              className="flex justify-between items-center w-full"
            >
              <span>All</span>
              <span className="text-xs text-gray-500">
                ({result.comments.length})
              </span>
            </Dropdown.Item>
            {["positive", "negative", "neutral"].map(sentiment => (
              <Dropdown.Item 
                key={sentiment}
                onClick={() => { setSentimentFilter(sentiment as any); setCurrentPage(1); }}
                className="flex justify-between items-center w-full"
              >
                <span>{getSentimentDisplayName(sentiment)}</span>
                <span className="text-xs text-gray-500">
                  ({sentimentCounts[sentiment as keyof typeof sentimentCounts]})
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown>

          {/* Rating filter with counts */}
          <Dropdown 
            label={ratingFilter !== null ? `Rating: ${ratingFilter}` : "All Ratings"} 
            inline
            className="w-full sm:w-auto"
          >
            <Dropdown.Item 
              onClick={() => { setRatingFilter(null); setCurrentPage(1); }}
              className="flex justify-between items-center w-full"
            >
              <span>All</span>
              <span className="text-xs text-gray-500">
                ({result.comments.length})
              </span>
            </Dropdown.Item>
            {[5, 4, 3, 2, 1].map((star) => (
              <Dropdown.Item 
                key={star} 
                onClick={() => { setRatingFilter(star); setCurrentPage(1); }}
                className="flex justify-between items-center w-full"
              >
                <span>{star}</span>
                <span className="text-xs text-gray-500">
                  ({ratingCounts[star.toString()]})
                </span>
              </Dropdown.Item>
            ))}
          </Dropdown>
        </div>
      </div>

      {/* Enhanced results info */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {totalComments === 0
            ? "No comments found"
            : isAnyFilterActive 
              ? `Showing ${startIndex + 1} to ${endIndex} of ${totalComments} filtered comments (from ${result.comments.length} total)`
              : `Showing ${startIndex + 1} to ${endIndex} of ${totalComments} comments`
          }
        </div>
        
        {/* Sort options could be added here */}
      </div>

      {/* Comments list with improved empty state */}
      {totalComments === 0 ? (
        <div className="text-center p-8 border border-gray-200 dark:border-gray-700 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No comments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAnyFilterActive 
              ? "Try adjusting your filters to find what you're looking for."
              : "There are no comments available for this selection."
            }
          </p>
          {isAnyFilterActive && (
            <button
              onClick={clearAllFilters}
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {currentComments.map((comment) => (
            <Card key={comment.id} className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
              {/* Comment header with user info and rating */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      {/* OPTION 1: Enhanced sentiment chips with icons */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.userName || "Anonymous User"}
                        </span>
                        <span 
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            comment.sentiment === "positive" 
                              ? "bg-green-100 text-green-800" 
                              : comment.sentiment === "negative"
                                ? "bg-red-100 text-red-800"
                                : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {comment.sentiment === "positive" && (
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          {comment.sentiment === "negative" && (
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          {comment.sentiment === "neutral" && (
                            <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          )}
                          {getSentimentDisplayName(comment.sentiment)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Star rating */}
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          className={`w-5 h-5 ${star <= comment.score ? "text-yellow-300" : "text-gray-200 dark:text-gray-700"}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20" 
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm font-medium text-gray-700">
                        {comment.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment content - the focal point */}
                <div className="py-1">
                  <p className="text-base text-gray-800">
                    {comment.content}
                  </p>
                </div>

                {/* Comment footer with metadata and actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex flex-wrap gap-2">
                    {/* Intention tags */}
                    {comment.intentions?.map((intention) => (
                      <span 
                        key={intention}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                      >
                        {intention.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  
                  {/* Thumbs up indicator */}
                  <div className="flex items-center text-gray-500">
                    <button 
                      className="flex items-center gap-1 text-xs hover:text-blue-600"
                      aria-label="Mark as helpful"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{comment.thumbsUp}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced pagination with context */}
      {totalPages > 1 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-2">
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`p-1 rounded-md ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1">
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                  )}
                </>
              )}
              
              {/* Page numbers */}
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                
                // Show current page and nearby pages
                if (
                  pageNum === currentPage ||
                  pageNum === currentPage - 1 ||
                  pageNum === currentPage + 1 ||
                  (pageNum === currentPage - 2 && currentPage > 3) ||
                  (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`p-1 rounded-md ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Next page"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </nav>
          
          <div className="flex items-center text-sm text-gray-500">
            <select 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
              value={commentsPerPage}
              onChange={(e) => {
                // This would require adding commentsPerPage to state
                // setCommentsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
