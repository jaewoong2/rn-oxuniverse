import { oxApi } from './client';
import type {
  CurrentPriceResponse,
  EODPriceResponse,
  UniversePricesPayload,
  SettlementPriceData,
  PriceComparisonResult,
  EODCollectionResult,
} from '@/types/price';
import type { PredictionChoice } from '@/types/prediction';

const normalizeSymbol = (symbol: string) => symbol.toUpperCase();

export const priceService = {
  /**
   * 현재 가격 조회
   */
  getCurrentPrice: async (symbol: string): Promise<CurrentPriceResponse> => {
    return await oxApi.getWithBaseResponse<CurrentPriceResponse>(
      `/prices/current/${normalizeSymbol(symbol)}`,
      undefined
    );
  },

  /**
   * 유니버스 가격 조회
   */
  getUniversePrices: async (tradingDay: string): Promise<UniversePricesPayload> => {
    const response = await oxApi.getWithBaseResponse<{
      universe_prices: UniversePricesPayload;
    }>(`/prices/universe/${tradingDay}`, undefined);

    return response.universe_prices;
  },

  /**
   * EOD 가격 조회
   */
  getEodPrice: async (symbol: string, tradingDay: string): Promise<EODPriceResponse> => {
    return await oxApi.getWithBaseResponse<EODPriceResponse>(
      `/prices/eod/${normalizeSymbol(symbol)}/${tradingDay}`,
      undefined
    );
  },

  /**
   * 정산 검증
   */
  validateSettlement: async (tradingDay: string): Promise<SettlementPriceData[]> => {
    const response = await oxApi.getWithBaseResponse<{
      settlement_data: SettlementPriceData[];
    }>(`/prices/admin/validate-settlement/${tradingDay}`, undefined);

    return response.settlement_data;
  },

  /**
   * 예측 비교
   */
  comparePrediction: async (params: {
    symbol: string;
    trading_day: string;
    predicted_direction: PredictionChoice;
  }): Promise<PriceComparisonResult> => {
    const queryParams = {
      symbol: normalizeSymbol(params.symbol),
      trading_day: params.trading_day,
      predicted_direction: params.predicted_direction,
    };

    const response = await oxApi.postWithBaseResponse<{
      comparison: PriceComparisonResult;
    }>('/prices/admin/compare-prediction', queryParams);

    return response.comparison;
  },

  /**
   * 예측 ID로 비교
   */
  comparePredictionById: async (predictionId: number): Promise<PriceComparisonResult> => {
    const response = await oxApi.postWithBaseResponse<{
      comparison: PriceComparisonResult;
    }>('/prices/admin/compare-prediction/by-id', {
      prediction_id: predictionId.toString(),
    });

    return response.comparison;
  },

  /**
   * EOD 가격 수집
   */
  collectEodPrices: async (tradingDay: string): Promise<EODCollectionResult> => {
    return await oxApi.postWithBaseResponse<EODCollectionResult>(
      `/prices/collect-eod/${tradingDay}`,
      undefined
    );
  },
};
