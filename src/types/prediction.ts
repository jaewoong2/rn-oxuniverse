export enum PredictionChoice {
  UP = 'UP',
  DOWN = 'DOWN',
}

export enum PredictionStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
  VOID = 'VOID',
}

export interface Prediction {
  id: number;
  user_id: number;
  trading_day: string;
  symbol: string;
  choice: PredictionChoice;
  status: PredictionStatus;
  submitted_at: string;
  updated_at: string | null;
  points_earned: number;
}

export interface PredictionCreate {
  symbol: string;
  choice: PredictionChoice;
}

export interface PredictionUpdate {
  choice: PredictionChoice;
}

export interface PredictionsForDayResponse {
  predictions: Prediction[];
  total_predictions: number;
  completed_predictions: number;
  pending_predictions: number;
  trading_day: string;
}

export interface PredictionHistoryParams {
  limit?: number;
  offset?: number;
}

export interface PredictionSubmitResponse {
  prediction: Prediction;
}

export interface RemainingPredictionsResponse {
  remaining_predictions: number;
}

export interface PredictionStats {
  total_predictions: number;
  correct_predictions: number;
  incorrect_predictions: number;
  void_predictions: number;
  accuracy_rate: number;
  total_points_earned: number;
  total_points_lost: number;
  net_points: number;
}

export interface DailyPredictionStats {
  trading_day: string;
  predictions_made: number;
  predictions_correct: number;
  predictions_incorrect: number;
  points_earned: number;
  points_lost: number;
  net_points: number;
}

export interface PredictionValidation {
  can_predict: boolean;
  reason?: string;
  remaining_slots: number;
  trading_day: string;
  current_time: string;
}

export interface PredictionAnalytics {
  symbol: string;
  total_predictions: number;
  up_predictions: number;
  down_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  average_points: number;
  last_prediction_date?: string;
}

export interface PredictionTrend {
  date: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  points_earned: number;
}

// Utility functions
export const normalizeSymbol = (symbol: string): string => {
  return symbol.toUpperCase().trim();
};

export const isValidSymbol = (symbol: string): boolean => {
  return /^[A-Z]{1,5}$/.test(symbol);
};

export const isPredictionEditable = (status: PredictionStatus): boolean => {
  return status === PredictionStatus.PENDING;
};

export const isPredictionCompleted = (status: PredictionStatus): boolean => {
  return [
    PredictionStatus.CORRECT,
    PredictionStatus.INCORRECT,
    PredictionStatus.VOID,
  ].includes(status);
};
