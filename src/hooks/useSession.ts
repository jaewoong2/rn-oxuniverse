import { useQuery } from '@tanstack/react-query';
import { sessionService } from '@/services/api/sessionService';
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

// Query Keys
export const SESSION_KEYS = {
  all: ['session'] as const,
  today: () => [...SESSION_KEYS.all, 'today'] as const,
  canPredict: (tradingDay?: string) =>
    [...SESSION_KEYS.all, 'can-predict', tradingDay] as const,
  weeklySchedule: (startDate: string, endDate: string) =>
    [...SESSION_KEYS.all, 'weekly-schedule', startDate, endDate] as const,
  schedule: (date: string) => [...SESSION_KEYS.all, 'schedule', date] as const,
  monthlySchedule: (year: number, month: number) =>
    [...SESSION_KEYS.all, 'monthly-schedule', year, month] as const,
  marketCalendar: (startDate: string, endDate: string) =>
    [...SESSION_KEYS.all, 'market-calendar', startDate, endDate] as const,
  holidays: (startDate: string, endDate: string) =>
    [...SESSION_KEYS.all, 'holidays', startDate, endDate] as const,
  stats: (date: string) => [...SESSION_KEYS.all, 'stats', date] as const,
  comparison: (date1: string, date2: string) =>
    [...SESSION_KEYS.all, 'comparison', date1, date2] as const,
} as const;

/**
 * 오늘 세션 조회 훅
 */
export const useTodaySession = () => {
  return useQuery({
    queryKey: SESSION_KEYS.today(),
    queryFn: sessionService.getTodaySession,
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
};

/**
 * 예측 가능 여부 확인 훅
 */
export const useCanPredict = (tradingDay?: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.canPredict(tradingDay),
    queryFn: () => sessionService.canPredictNow(tradingDay),
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
};

/**
 * 주간 세션 스케줄 조회 훅
 */
export const useWeeklySchedule = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.weeklySchedule(startDate, endDate),
    queryFn: () => sessionService.getWeeklySchedule(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000, // 10분
  });
};

/**
 * 특정 날짜 세션 스케줄 조회 훅
 */
export const useSessionSchedule = (date: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.schedule(date),
    queryFn: () => sessionService.getSessionSchedule(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 월간 세션 스케줄 조회 훅
 */
export const useMonthlySchedule = (year: number, month: number) => {
  return useQuery({
    queryKey: SESSION_KEYS.monthlySchedule(year, month),
    queryFn: () => sessionService.getMonthlySchedule(year, month),
    staleTime: 30 * 60 * 1000, // 30분
  });
};

/**
 * 시장 캘린더 조회 훅
 */
export const useMarketCalendar = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.marketCalendar(startDate, endDate),
    queryFn: () => sessionService.getMarketCalendar(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60 * 60 * 1000, // 1시간
  });
};

/**
 * 휴일 정보 조회 훅
 */
export const useMarketHolidays = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.holidays(startDate, endDate),
    queryFn: () => sessionService.getMarketHolidays(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 24 * 60 * 60 * 1000, // 24시간
  });
};

/**
 * 세션 통계 조회 훅
 */
export const useSessionStats = (date: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.stats(date),
    queryFn: () => sessionService.getSessionStats(date),
    enabled: !!date,
    staleTime: 5 * 60 * 1000, // 5분
  });
};

/**
 * 세션 비교 조회 훅
 */
export const useSessionComparison = (date1: string, date2: string) => {
  return useQuery({
    queryKey: SESSION_KEYS.comparison(date1, date2),
    queryFn: () => sessionService.getSessionComparison(date1, date2),
    enabled: !!date1 && !!date2,
    staleTime: 10 * 60 * 1000, // 10분
  });
};
