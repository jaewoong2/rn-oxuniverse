import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { newsService } from '@/services/api/newsService';
import type {
  GetMarketNewsSummaryRequestParams,
  MarketNewsResponse,
  GetNewsRecommendationsParams,
  NewsRecommendationsResponse,
  MarketForecastResponse,
} from '@/types/news';

export const MARKET_NEWS_KEYS = {
  all: ['marketNews'] as const,
  summary: (ticker?: string, newsDate?: string, newsType?: string) =>
    [...MARKET_NEWS_KEYS.all, 'summary', ticker, newsDate, newsType] as const,
};

/**
 * 마켓 뉴스 요약 조회 훅
 */
export const useMarketNewsSummary = (
  { news_type, ticker, news_date }: GetMarketNewsSummaryRequestParams,
  options?: Omit<UseQueryOptions<MarketNewsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<MarketNewsResponse, Error>({
    queryKey: MARKET_NEWS_KEYS.summary(ticker, news_date, news_type),
    queryFn: () =>
      newsService.getMarketNewsSummary({
        news_type,
        ticker,
        news_date,
      }),
    ...options,
  });
};

export const NEWS_RECOMMENDATION_KEYS = {
  all: ['newsRecommendations'] as const,
  by: (recommendation: string, limit: number, date?: string) =>
    [...NEWS_RECOMMENDATION_KEYS.all, recommendation, limit, date] as const,
};

/**
 * 뉴스 추천 조회 훅
 */
export const useNewsRecommendations = (
  { recommendation, limit = 5, date }: GetNewsRecommendationsParams,
  options?: Omit<UseQueryOptions<NewsRecommendationsResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<NewsRecommendationsResponse, Error>({
    queryKey: NEWS_RECOMMENDATION_KEYS.by(recommendation, limit, date),
    queryFn: () =>
      newsService.getNewsRecommendations({
        recommendation,
        limit,
        date,
      }),
    ...options,
  });
};

/**
 * 마켓 전망 조회 훅
 */
export const useMarketForecast = (
  date: string,
  source: MarketForecastResponse['source'],
  options?: Omit<UseQueryOptions<MarketForecastResponse[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<MarketForecastResponse[], Error>({
    queryKey: ['marketForecast', date, source],
    queryFn: () => newsService.getMarketForecast({ date, source }),
    enabled: !!date && (options?.enabled === undefined || options.enabled),
    ...options,
  });
};
