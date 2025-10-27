import { oxApi } from './client';
import type {
  SessionTodayResponse,
  PredictionAvailability,
  SessionSchedule,
  WeeklySchedule,
  MarketCalendar,
  MarketHoliday,
  SessionStats,
  SessionComparison,
} from '@/types/session';

export const sessionService = {
  /**
   * 오늘 세션 조회
   */
  getTodaySession: async (): Promise<SessionTodayResponse> => {
    return await oxApi.getWithBaseResponse<SessionTodayResponse>('/session/today', undefined);
  },

  /**
   * 예측 가능 여부 확인
   */
  canPredictNow: async (tradingDay?: string): Promise<PredictionAvailability> => {
    const config = tradingDay ? { params: { trading_day: tradingDay } } : undefined;
    return await oxApi.getWithBaseResponse<PredictionAvailability>(
      '/session/can-predict',
      config
    );
  },

  /**
   * 주간 세션 스케줄 조회
   */
  getWeeklySchedule: async (
    startDate: string,
    endDate: string
  ): Promise<WeeklySchedule> => {
    return await oxApi.getWithBaseResponse<WeeklySchedule>('/session/schedule/weekly', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  },

  /**
   * 특정 날짜 세션 스케줄 조회
   */
  getSessionSchedule: async (date: string): Promise<SessionSchedule> => {
    return await oxApi.getWithBaseResponse<SessionSchedule>(
      `/session/schedule/${date}`,
      undefined
    );
  },

  /**
   * 월간 세션 스케줄 조회
   */
  getMonthlySchedule: async (year: number, month: number): Promise<WeeklySchedule> => {
    return await oxApi.getWithBaseResponse<WeeklySchedule>('/session/schedule/monthly', {
      params: {
        year: year.toString(),
        month: month.toString(),
      },
    });
  },

  /**
   * 시장 캘린더 조회
   */
  getMarketCalendar: async (
    startDate: string,
    endDate: string
  ): Promise<MarketCalendar> => {
    return await oxApi.getWithBaseResponse<MarketCalendar>('/session/calendar', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  },

  /**
   * 휴일 정보 조회
   */
  getMarketHolidays: async (
    startDate: string,
    endDate: string
  ): Promise<MarketHoliday[]> => {
    return await oxApi.getWithBaseResponse<MarketHoliday[]>('/session/holidays', {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  },

  /**
   * 세션 통계 조회
   */
  getSessionStats: async (date: string): Promise<SessionStats> => {
    return await oxApi.getWithBaseResponse<SessionStats>(`/session/stats/${date}`, undefined);
  },

  /**
   * 세션 비교 조회
   */
  getSessionComparison: async (date1: string, date2: string): Promise<SessionComparison> => {
    return await oxApi.getWithBaseResponse<SessionComparison>('/session/compare', {
      params: {
        date1,
        date2,
      },
    });
  },
};
