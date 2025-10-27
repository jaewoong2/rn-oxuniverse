import { oxApi } from './client';
import type {
  GetWeeklyActionCountParams,
  SignalAPIResponse,
  WeeklyActionCountResponse,
  Signal,
} from '@/types/signal';

export const signalService = {
  /**
   * 특정 날짜의 시그널 데이터 가져오기
   */
  getSignalsByDate: async (date: string): Promise<SignalAPIResponse> => {
    return await oxApi.getWithBaseResponse<SignalAPIResponse>('/signals/date', {
      params: { date },
    });
  },

  /**
   * 심볼과 날짜로 시그널 데이터 가져오기
   */
  getSignalByNameAndDate: async (
    symbols: string[],
    date: string,
    strategy_type?: string | null
  ): Promise<SignalAPIResponse> => {
    const params: Record<string, string> = {
      symbols: symbols.join(','),
      date,
    };

    if (strategy_type) {
      params.strategy_type = strategy_type;
    }

    return await oxApi.getWithBaseResponse<SignalAPIResponse>('/signals/date', {
      params,
    });
  },

  /**
   * 주간 액션 카운트 가져오기
   */
  getWeeklyActionCount: async (
    params: GetWeeklyActionCountParams
  ): Promise<WeeklyActionCountResponse> => {
    const queryParams: Record<string, string> = {};

    if (params.tickers) queryParams.tickers = params.tickers;
    if (params.reference_date) queryParams.reference_date = params.reference_date;
    if (params.action) queryParams.action = params.action;
    if (params.order_by) queryParams.order_by = params.order_by;
    if (params.limit) queryParams.limit = params.limit.toString();

    return await oxApi.getWithBaseResponse<WeeklyActionCountResponse>(
      '/signals/weekly/action-count',
      { params: queryParams }
    );
  },

  /**
   * 번역된 시그널 데이터 가져오기
   */
  getTranslatedSignalDataByTickerAndDate: async (
    ticker: string,
    date: string,
    strategy_type?: string | null
  ): Promise<Signal[]> => {
    const params: Record<string, string> = {
      ticker,
      date,
    };

    if (strategy_type) {
      params.strategy_type = strategy_type;
    }

    return await oxApi.getWithBaseResponse<Signal[]>('/translate/signals/ticker', {
      params,
    });
  },
};
