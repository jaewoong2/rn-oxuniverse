import { oxApi } from './client';
import type {
  GetMarketNewsSummaryRequestParams,
  MarketNewsResponse,
  GetNewsRecommendationsParams,
  NewsRecommendationsResponse,
  MarketForecastResponse,
} from '@/types/news';

export const newsService = {
  /**
   * 마켓 뉴스 요약 가져오기
   */
  getMarketNewsSummary: async (
    params: GetMarketNewsSummaryRequestParams
  ): Promise<MarketNewsResponse> => {
    const queryParams: Record<string, string> = {};

    if (params.news_type) queryParams.news_type = params.news_type;
    if (params.ticker) queryParams.ticker = params.ticker;
    if (params.news_date) queryParams.news_date = params.news_date;

    return await oxApi.getWithBaseResponse<MarketNewsResponse>('/news/', {
      params: queryParams,
    });
  },

  /**
   * 뉴스 추천 가져오기
   */
  getNewsRecommendations: async (
    params: GetNewsRecommendationsParams
  ): Promise<NewsRecommendationsResponse> => {
    const queryParams: Record<string, string> = {
      recommendation: params.recommendation,
      limit: (params.limit || 5).toString(),
    };

    if (params.date) {
      queryParams.date = params.date;
    }

    return await oxApi.getWithBaseResponse<NewsRecommendationsResponse>(
      '/news/recommendations',
      { params: queryParams }
    );
  },

  /**
   * 마켓 전망 가져오기
   */
  getMarketForecast: async (params: {
    date: string;
    source?: 'Major' | 'Minor';
  }): Promise<MarketForecastResponse[]> => {
    const queryParams: Record<string, string> = {
      forecast_date: params.date,
      source: params.source || 'Major',
    };

    return await oxApi.getWithBaseResponse<MarketForecastResponse[]>(
      '/news/market-forecast',
      { params: queryParams }
    );
  },
};
