export enum SessionPhase {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export interface Session {
  id: number;
  trading_day: string;
  phase: SessionPhase;
  created_at: string;
  closed_at?: string;
}

export interface MarketStatus {
  current_date: string;
  current_time_kst: string;
  is_trading_day: boolean;
  message: string;
  next_trading_day?: string;
}

export interface SessionTodayResponse {
  session: Session | null;
  market_status: MarketStatus;
}

export interface PredictionAvailability {
  can_predict: boolean;
  trading_day: string;
  current_time: string;
}

export interface SessionSchedule {
  trading_day: string;
  open_time: string;
  close_time: string;
  is_holiday: boolean;
  holiday_reason?: string;
}

export interface WeeklySchedule {
  week_start: string;
  week_end: string;
  sessions: SessionSchedule[];
}

export interface MarketHoliday {
  date: string;
  reason: string;
  is_early_close?: boolean;
  early_close_time?: string;
}

export interface MarketCalendar {
  year: number;
  month: number;
  holidays: MarketHoliday[];
  trading_days: number;
  non_trading_days: number;
}

export interface SessionStats {
  trading_day: string;
  total_predictions: number;
  total_users: number;
  total_points_awarded: number;
  total_points_lost: number;
  net_points: number;
  session_duration_hours: number;
  average_predictions_per_user: number;
}

export interface SessionComparison {
  current_session: SessionStats;
  previous_session?: SessionStats;
  change_percentage: number;
  trend: 'up' | 'down' | 'stable';
}
