import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { priceService } from '@/services/api/priceService';
import type {
  CurrentPriceResponse,
  EODPriceResponse,
  UniversePricesPayload,
  SettlementPriceData,
  PriceComparisonResult,
  EODCollectionResult,
} from '@/types/price';
import type { PredictionChoice } from '@/types/prediction';

export const PRICE_KEYS = {
  all: ['prices'] as const,
  current: (symbol: string) => [...PRICE_KEYS.all, 'current', symbol] as const,
  universe: (tradingDay: string) => [...PRICE_KEYS.all, 'universe', tradingDay] as const,
  eod: (symbol: string, tradingDay: string) =>
    [...PRICE_KEYS.all, 'eod', symbol, tradingDay] as const,
  settlement: (tradingDay: string) => [...PRICE_KEYS.all, 'settlement', tradingDay] as const,
  comparison: (symbol: string, tradingDay: string, direction: PredictionChoice) =>
    [...PRICE_KEYS.all, 'comparison', symbol, tradingDay, direction] as const,
  comparisonById: (predictionId: number) =>
    [...PRICE_KEYS.all, 'comparison', 'id', predictionId] as const,
  eodCollection: (tradingDay: string) => [...PRICE_KEYS.all, 'collect', tradingDay] as const,
} as const;

/**
 * 현재 가격 조회 훅
 */
export const useCurrentPrice = (
  symbol: string,
  options?: Omit<UseQueryOptions<CurrentPriceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<CurrentPriceResponse, Error>({
    queryKey: PRICE_KEYS.current(symbol),
    queryFn: () => priceService.getCurrentPrice(symbol),
    enabled: !!symbol && (options?.enabled ?? true),
    ...options,
  });
};

/**
 * 유니버스 가격 조회 훅
 */
export const useUniversePrices = (
  tradingDay: string,
  options?: Omit<UseQueryOptions<UniversePricesPayload, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<UniversePricesPayload, Error>({
    queryKey: PRICE_KEYS.universe(tradingDay),
    queryFn: () => priceService.getUniversePrices(tradingDay),
    enabled: !!tradingDay && (options?.enabled ?? true),
    ...options,
  });
};

/**
 * EOD 가격 조회 훅
 */
export const useEodPrice = (
  symbol: string,
  tradingDay: string,
  options?: Omit<UseQueryOptions<EODPriceResponse, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<EODPriceResponse, Error>({
    queryKey: PRICE_KEYS.eod(symbol, tradingDay),
    queryFn: () => priceService.getEodPrice(symbol, tradingDay),
    enabled: !!symbol && !!tradingDay && (options?.enabled === undefined || options.enabled),
    ...options,
  });
};

/**
 * 정산 검증 훅
 */
export const useSettlementValidation = (
  tradingDay: string,
  options?: Omit<UseQueryOptions<SettlementPriceData[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SettlementPriceData[], Error>({
    queryKey: PRICE_KEYS.settlement(tradingDay),
    queryFn: () => priceService.validateSettlement(tradingDay),
    enabled: !!tradingDay && (options?.enabled ?? true),
    ...options,
  });
};

/**
 * 가격 비교 훅
 */
export const usePriceComparison = (
  params:
    | {
        type: 'by-symbol';
        symbol: string;
        trading_day: string;
        predicted_direction: PredictionChoice;
      }
    | { type: 'by-id'; prediction_id: number },
  options?: Omit<UseQueryOptions<PriceComparisonResult, Error>, 'queryKey' | 'queryFn'>
) => {
  if (params.type === 'by-symbol') {
    const { symbol, trading_day, predicted_direction } = params;
    return useQuery<PriceComparisonResult, Error>({
      queryKey: PRICE_KEYS.comparison(symbol, trading_day, predicted_direction),
      queryFn: () =>
        priceService.comparePrediction({
          symbol,
          trading_day,
          predicted_direction,
        }),
      enabled:
        !!symbol &&
        !!trading_day &&
        !!predicted_direction &&
        (options?.enabled ?? true),
      ...options,
    });
  }

  const { prediction_id } = params;
  return useQuery<PriceComparisonResult, Error>({
    queryKey: PRICE_KEYS.comparisonById(prediction_id),
    queryFn: () => priceService.comparePredictionById(prediction_id),
    enabled: !!prediction_id && (options?.enabled ?? true),
    ...options,
  });
};

/**
 * EOD 수집 훅
 */
export const useEodCollection = (
  tradingDay: string,
  options?: Omit<UseQueryOptions<EODCollectionResult, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<EODCollectionResult, Error>({
    queryKey: PRICE_KEYS.eodCollection(tradingDay),
    queryFn: () => priceService.collectEodPrices(tradingDay),
    enabled: !!tradingDay && (options?.enabled ?? true),
    ...options,
  });
};
