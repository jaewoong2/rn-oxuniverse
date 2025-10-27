/**
 * Auth 관련 타입 정의
 */

// ============================================================================
// Enums
// ============================================================================

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  KAKAO = 'kakao',
  APPLE = 'apple',
}

export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
}

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: number;
  email: string;
  nickname: string;
  auth_provider: AuthProvider;
  created_at: string;
  last_login_at: string | null;
  is_active: boolean;
  role: UserRole;
}

export interface UserProfile {
  user_id: number;
  email: string;
  nickname: string;
  auth_provider: AuthProvider;
  created_at: string;
  is_oauth_user: boolean;
}

export interface UserUpdate {
  nickname?: string;
  email?: string;
}

// ============================================================================
// OAuth Types
// ============================================================================

export interface OAuthAuthorizeParams {
  provider: 'google' | 'kakao' | 'apple';
  client_redirect: string;
}

export interface OAuthCallbackParams {
  token: string;
  user_id: string;
  nickname: string;
  provider: string;
  is_new_user: boolean;
}

// ============================================================================
// Token Types
// ============================================================================

export interface TokenRefreshRequest {
  current_token: string;
}

export interface TokenRefreshResponse {
  access_token: string;
  token_type: 'bearer';
}

// ============================================================================
// User List Types
// ============================================================================

export interface UserListItem {
  id: number;
  nickname: string;
  auth_provider: AuthProvider;
  created_at: string;
}

export interface UserListResult {
  users: UserListItem[];
  count: number;
}

export interface UserSearchParams {
  query: string;
  limit?: number;
  offset?: number;
}

export interface UserSearchResult {
  users: Array<{
    id: number;
    nickname: string;
    auth_provider: AuthProvider;
  }>;
  count: number;
}

// ============================================================================
// Auth State Types
// ============================================================================

export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: User | null;
}

export interface AuthContextValue extends AuthState {
  isLoading: boolean;
  isProfileLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// ============================================================================
// Magic Link Types
// ============================================================================

export interface MagicLinkSendResponse {
  message: string;
}

// ============================================================================
// Financial Types
// ============================================================================

export interface FinancialSummary {
  user_id: number;
  current_balance: number;
  points_earned_today: number;
  can_make_predictions: boolean;
  summary_date: string;
}

export interface AffordabilityCheck {
  amount: number;
  can_afford: boolean;
  current_balance: number;
  shortfall: number;
}
