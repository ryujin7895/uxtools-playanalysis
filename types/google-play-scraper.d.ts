declare module 'google-play-scraper' {
  export const sort: {
    NEWEST: number;
    RATING: number;
    HELPFULNESS: number;
  };
  
  export interface ReviewsOptions {
    appId: string;
    lang?: string;
    country?: string;
    sort?: number;
    num?: number;
    paginate?: boolean;
    nextPaginationToken?: string;
    throttle?: number;
  }
  
  export interface AppOptions {
    appId: string;
    lang?: string;
    country?: string;
  }
  
  export interface ReviewsResult {
    data: Array<{
      id: string;
      userName: string;
      userImage?: string;
      date: string;
      score: number;
      scoreText?: string;
      text: string;
      thumbsUp: number;
      url?: string;
      replyDate?: string;
      replyText?: string;
      version?: string;
      criterias?: Array<{
        criteria: string;
        rating: number;
      }>;
    }>;
    nextPaginationToken?: string;
  }
  
  export interface AppResult {
    title: string;
    description: string;
    summary: string;
    installs: string;
    minInstalls: number;
    score: number;
    ratings: number;
    reviews: number;
    price: number;
    free: boolean;
    currency: string;
    size: string;
    androidVersion: string;
    developer: string;
    developerEmail: string;
    developerWebsite: string;
    updated: number;
    version: string;
    genre: string;
    genreId: string;
    categories: string[];
    histogram: { [key: string]: number };
    priceText: string;
    contentRating: string;
    adSupported: boolean;
    containsAds: boolean;
    recentChanges: string;
    similarApps: string[];
  }
  
  export function reviews(options: ReviewsOptions): Promise<ReviewsResult>;
  export function app(options: AppOptions): Promise<AppResult>;
  
  export function search(options: any): Promise<any>;
  export function developer(options: any): Promise<any>;
  export function suggest(options: any): Promise<any>;
  export function similar(options: any): Promise<any>;
  export function permissions(options: any): Promise<any>;
  export function datasafety(options: any): Promise<any>;
  export function categories(options: any): Promise<any>;
} 