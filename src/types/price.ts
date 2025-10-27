import { PredictionChoice } from './prediction';

export interface StockPrice {
  symbol: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  market_status: string;
  last_updated: string;
}

export interface CurrentPriceResponse {
  price: StockPrice;
}

export interface EODPrice {
  symbol: string;
  trading_date: string;
  close_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  open_price: number;
  volume: number;
  fetched_at: string;
}

export interface EODPriceResponse {
  eod_price: EODPrice;
}

export interface UniversePriceEntry {
  symbol: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  volume: number;
  last_updated: string;
  [key: string]: unknown;
}

export interface UniversePricesPayload {
  trading_day: string;
  symbols: UniversePriceEntry[];
  [key: string]: unknown;
}

export interface SettlementPriceData {
  symbol: string;
  trading_day: string;
  settlement_price: number;
  base_price: number;
  price_change: number;
  change_percent: number;
  can_settle: boolean;
  void_reason?: string | null;
}

export type PricePredictionOutcome = 'CORRECT' | 'INCORRECT';

export interface PriceComparisonResult {
  symbol: string;
  trading_day: string;
  current_price: number;
  base_price: number;
  price_change: number;
  change_percent: number;
  prediction_result: PricePredictionOutcome;
  prediction_id?: number;
  base_price_source?: string;
}

export interface EODCollectionDetail {
  symbol: string;
  success: boolean;
  error_message?: string | null;
  eod_price?: EODPrice;
}

export interface EODCollectionResult {
  trading_day: string;
  total_symbols: number;
  successful_collections: number;
  failed_collections: number;
  collection_details: EODCollectionDetail[];
}
