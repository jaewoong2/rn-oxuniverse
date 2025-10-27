import { oxApi } from './client';
import type {
  Prediction,
  PredictionCreate,
  PredictionUpdate,
  PredictionHistoryParams,
  PredictionSubmitResponse,
  PredictionsForDayResponse,
} from '@/types/prediction';

const PREDICTIONS_HISTORY_LIMIT = 50;

export const predictionService = {
  /**
   * 예측 제출
   */
  submitPrediction: async (
    symbol: string,
    choice: PredictionCreate['choice']
  ): Promise<PredictionSubmitResponse> => {
    return await oxApi.postWithBaseResponse<PredictionSubmitResponse>(
      `/predictions/${symbol.toUpperCase()}`,
      { choice }
    );
  },

  /**
   * 예측 수정
   */
  updatePrediction: async (
    predictionId: number,
    choice: PredictionUpdate['choice']
  ): Promise<Prediction> => {
    const response = await oxApi.putWithBaseResponse<{ prediction: Prediction }>(
      `/predictions/${predictionId}`,
      { choice }
    );
    return response.prediction;
  },

  /**
   * 특정 날짜 예측 조회
   */
  getUserPredictionsForDay: async (
    tradingDay: string
  ): Promise<PredictionsForDayResponse> => {
    const response = await oxApi.getWithBaseResponse<{
      result: PredictionsForDayResponse;
    }>(`/predictions/day/${tradingDay}`, undefined);

    return response.result;
  },

  /**
   * 남은 예측 슬롯 조회
   */
  getRemainingPredictions: async (tradingDay: string): Promise<number> => {
    const response = await oxApi.getWithBaseResponse<{
      remaining_predictions: number;
    }>(`/predictions/remaining/${tradingDay}`, undefined);
    return response.remaining_predictions;
  },

  /**
   * 예측 이력 조회 (페이지네이션)
   */
  getPredictionHistory: async (
    params?: PredictionHistoryParams
  ): Promise<Prediction[]> => {
    const limit = params?.limit || PREDICTIONS_HISTORY_LIMIT;
    const offset = params?.offset || 0;

    const queryParams = {
      limit: limit.toString(),
      offset: offset.toString(),
    };

    const response = await oxApi.getWithBaseResponse<{
      history: Prediction[];
    }>('/predictions/history', { params: queryParams });

    return response.history || [];
  },
};
