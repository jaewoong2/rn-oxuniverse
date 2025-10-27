import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { predictionService } from '@/services/api/predictionService';
import type {
  Prediction,
  PredictionCreate,
  PredictionUpdate,
  PredictionHistoryParams,
  PredictionsForDayResponse,
  PredictionStats,
} from '@/types/prediction';
import { useAuth } from '@/providers/AuthProvider';

// Query Keys
export const PREDICTION_KEYS = {
  all: ['predictions'] as const,
  history: (params?: PredictionHistoryParams) =>
    [...PREDICTION_KEYS.all, 'history', params] as const,
  forDay: (tradingDay: string) => [...PREDICTION_KEYS.all, 'day', tradingDay] as const,
  remaining: (tradingDay: string) => [...PREDICTION_KEYS.all, 'remaining', tradingDay] as const,
  stats: () => [...PREDICTION_KEYS.all, 'stats'] as const,
} as const;

/**
 * 예측 제출 훅
 */
export const useSubmitPrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      symbol,
      choice,
    }: {
      symbol: string;
      choice: PredictionCreate['choice'];
    }) => predictionService.submitPrediction(symbol, choice),
    onSuccess: () => {
      // 관련 데이터 무효화
      queryClient.invalidateQueries({ queryKey: PREDICTION_KEYS.all });
    },
  });
};

/**
 * 예측 수정 훅
 */
export const useUpdatePrediction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      predictionId,
      choice,
    }: {
      predictionId: number;
      choice: PredictionUpdate['choice'];
    }) => predictionService.updatePrediction(predictionId, choice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREDICTION_KEYS.all });
    },
  });
};

/**
 * 예측 이력 조회 훅 (무한 스크롤)
 */
export const usePredictionHistory = (params?: PredictionHistoryParams) => {
  const { isAuthenticated } = useAuth();
  return useInfiniteQuery({
    queryKey: PREDICTION_KEYS.history(params),
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) =>
      predictionService.getPredictionHistory({
        ...params,
        offset: pageParam as number,
      }),
    getNextPageParam: (lastPage: Prediction[], allPages) => {
      const limit = params?.limit || 50;
      return Array.isArray(lastPage) && lastPage.length === limit
        ? allPages.length * limit
        : undefined;
    },
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2분
    enabled: isAuthenticated,
  });
};

/**
 * 특정 날짜 예측 조회 훅
 */
export const usePredictionsForDay = (tradingDay: string) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: PREDICTION_KEYS.forDay(tradingDay),
    queryFn: () => predictionService.getUserPredictionsForDay(tradingDay),
    enabled: isAuthenticated && !!tradingDay,
    staleTime: 30 * 1000, // 30초
  });
};

/**
 * 남은 예측 슬롯 조회 훅
 */
export const useRemainingPredictions = (tradingDay: string) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: PREDICTION_KEYS.remaining(tradingDay),
    queryFn: () => predictionService.getRemainingPredictions(tradingDay),
    enabled: isAuthenticated && !!tradingDay,
    refetchInterval: 30 * 1000, // 30초마다 갱신
  });
};

/**
 * 예측 통계 조회 훅 (예측 이력에서 계산)
 */
export const usePredictionStats = () => {
  const { data: predictions } = usePredictionHistory({ limit: 1000 });

  return useQuery<PredictionStats>({
    queryKey: PREDICTION_KEYS.stats(),
    queryFn: () => {
      if (!predictions?.pages?.length) {
        return {
          total_predictions: 0,
          correct_predictions: 0,
          incorrect_predictions: 0,
          void_predictions: 0,
          accuracy_rate: 0,
          total_points_earned: 0,
          total_points_lost: 0,
          net_points: 0,
        };
      }

      // 모든 페이지의 예측 데이터 평탄화
      const allPredictions = predictions.pages.flat();

      const total = allPredictions.length;
      const correct = allPredictions.filter((p) => p.status === 'CORRECT').length;
      const incorrect = allPredictions.filter((p) => p.status === 'INCORRECT').length;
      const voidCount = allPredictions.filter((p) => p.status === 'VOID').length;

      const totalPointsEarned = allPredictions
        .filter((p) => (p.points_earned || 0) > 0)
        .reduce((sum, p) => sum + (p.points_earned || 0), 0);

      const totalPointsLost = allPredictions
        .filter((p) => (p.points_earned || 0) < 0)
        .reduce((sum, p) => sum + Math.abs(p.points_earned || 0), 0);

      return {
        total_predictions: total,
        correct_predictions: correct,
        incorrect_predictions: incorrect,
        void_predictions: voidCount,
        accuracy_rate: total > 0 ? (correct / total) * 100 : 0,
        total_points_earned: totalPointsEarned,
        total_points_lost: totalPointsLost,
        net_points: totalPointsEarned - totalPointsLost,
      };
    },
    enabled: !!predictions?.pages?.length,
    staleTime: 5 * 60 * 1000, // 5분
  });
};
