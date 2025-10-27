import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { signalService } from '@/services/api/signalService';
import type {
  SignalAPIResponse,
  WeeklyActionCountResponse,
  GetWeeklyActionCountParams,
  Signal,
} from '@/types/signal';

// Query Keys
export const SIGNAL_KEYS = {
  all: ['signals'] as const,
  lists: () => [...SIGNAL_KEYS.all, 'list'] as const,
  listByDate: (date: string) => [...SIGNAL_KEYS.lists(), { date }] as const,
  weeklyActionCount: (params: GetWeeklyActionCountParams) =>
    [...SIGNAL_KEYS.all, 'weeklyActionCount', params] as const,
};

/**
 * 특정 날짜의 시그널 데이터 조회
 */
export const useSignalDataByDate = (
  date: string,
  options?: Omit<UseQueryOptions<SignalAPIResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SignalAPIResponse, Error>({
    queryKey: [...SIGNAL_KEYS.listByDate(date), date],
    queryFn: () => signalService.getSignalsByDate(date),
    ...options,
    enabled: !!date && (options?.enabled === undefined || options.enabled),
  });
};

/**
 * 심볼과 날짜로 시그널 데이터 조회
 */
export const useSignalDataByNameAndDate = (
  symbols: string[],
  date: string,
  strategy_type?: string | null,
  options?: Omit<UseQueryOptions<SignalAPIResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SignalAPIResponse, Error>({
    queryKey: [
      ...SIGNAL_KEYS.all,
      'byNameAndDate',
      symbols.join(','),
      date,
      strategy_type,
    ],
    queryFn: () => signalService.getSignalByNameAndDate(symbols, date, strategy_type),
    ...options,
    enabled: !!date && (options?.enabled === undefined || options.enabled),
    staleTime: 1000 * 60 * 5, // 5분간 캐시 데이터 사용
  });
};

/**
 * 주간 액션 카운트 조회
 */
export const useWeeklyActionCount = (
  params: GetWeeklyActionCountParams,
  options?: Omit<UseQueryOptions<WeeklyActionCountResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<WeeklyActionCountResponse, Error>({
    queryKey: SIGNAL_KEYS.weeklyActionCount(params),
    queryFn: () => signalService.getWeeklyActionCount(params),
    ...options,
    enabled: !!params.action && (options?.enabled === undefined || options.enabled),
  });
};

/**
 * 번역된 시그널 데이터 조회
 */
export const useTranslatedSignalDataByTickerAndDate = (
  ticker: string,
  date: string,
  strategy_type?: string | null,
  options?: Omit<UseQueryOptions<Signal[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<Signal[], Error>({
    queryKey: [
      ...SIGNAL_KEYS.all,
      'translatedByTickerAndDate',
      ticker,
      date,
      strategy_type,
    ],
    queryFn: () =>
      signalService.getTranslatedSignalDataByTickerAndDate(ticker, date, strategy_type),
    ...options,
    enabled: !!date && (options?.enabled === undefined || options.enabled),
  });
};

/**
 * 전략별 시그널 데이터 조회
 */
export const useSignalDataByStrategy = (
  symbols: string[],
  date: string,
  strategy_type?: string | null,
  options?: Omit<UseQueryOptions<SignalAPIResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SignalAPIResponse, Error>({
    queryKey: [...SIGNAL_KEYS.all, 'byStrategy', symbols.join(','), date, strategy_type],
    queryFn: () => signalService.getSignalByNameAndDate(symbols, date, strategy_type),
    ...options,
    enabled:
      !!date &&
      symbols.length > 0 &&
      (options?.enabled === undefined || options.enabled),
    staleTime: 1000 * 60 * 5, // 5분간 캐시 데이터 사용
  });
};
