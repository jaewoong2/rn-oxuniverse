import { oxApi, getOxBaseUrl } from "./client";
import {
  User,
  UserProfile,
  UserUpdate,
  TokenRefreshResponse,
  OAuthAuthorizeParams,
  UserListResult,
  UserSearchResult,
  MagicLinkSendResponse,
  FinancialSummary,
  AffordabilityCheck,
} from "@/types/auth";
import {
  PAGINATION_LIMITS,
  PaginationParams,
  validatePaginationParams,
} from "@/types/common";

export const authService = {
  // ============================================================================
  // OAuth Authentication
  // ============================================================================

  /**
   * OAuth 로그인 URL 생성
   * RN에서는 WebBrowser.openAuthSessionAsync 또는 Linking으로 처리
   */
  getOAuthUrl: (params: OAuthAuthorizeParams): string => {
    const { provider, client_redirect } = params;
    const baseUrl = getOxBaseUrl();
    return `${baseUrl}auth/oauth/${provider}/authorize?client_redirect=${encodeURIComponent(
      client_redirect
    )}`;
  },

  /**
   * Magic Link 발송
   */
  sendMagicLink: async (email: string): Promise<MagicLinkSendResponse> => {
    return await oxApi.postWithBaseResponse<MagicLinkSendResponse>(
      "/auth/magic-link/send",
      { email }
    );
  },

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * 토큰 갱신
   */
  refreshToken: async (currentToken: string): Promise<TokenRefreshResponse> => {
    return await oxApi.postWithBaseResponse<TokenRefreshResponse>(
      "/auth/token/refresh",
      { current_token: currentToken }
    );
  },

  /**
   * 로그아웃
   */
  logout: async (token: string): Promise<void> => {
    await oxApi.postWithBaseResponse<void>("/auth/logout", { token });
  },

  // ============================================================================
  // User Profile Management
  // ============================================================================

  /**
   * 내 프로필 조회
   */
  getMyProfile: async (): Promise<User> => {
    return await oxApi.getWithBaseResponse<User>("/users/me");
  },

  /**
   * 프로필 업데이트
   */
  updateMyProfile: async (updates: UserUpdate): Promise<User> => {
    return await oxApi.putWithBaseResponse<User>("/users/me", updates);
  },

  // ============================================================================
  // User List & Search
  // ============================================================================

  /**
   * 사용자 목록 조회 (페이지네이션)
   */
  getUserList: async (params?: PaginationParams): Promise<UserListResult> => {
    const validatedParams = validatePaginationParams(
      params || {},
      PAGINATION_LIMITS.USER_LIST
    );

    const queryString = new URLSearchParams({
      limit: (
        validatedParams.limit || PAGINATION_LIMITS.USER_LIST.default
      ).toString(),
      offset: (validatedParams.offset || 0).toString(),
    });

    return await oxApi.getWithBaseResponse<UserListResult>(
      `/users/?${queryString}`
    );
  },

  /**
   * 사용자 검색 (제한된 페이지네이션)
   */
  searchUsers: async (params: {
    q: string;
    limit?: number;
  }): Promise<UserSearchResult> => {
    const limit = Math.min(
      Math.max(
        params.limit || PAGINATION_LIMITS.USER_SEARCH.default,
        PAGINATION_LIMITS.USER_SEARCH.min
      ),
      PAGINATION_LIMITS.USER_SEARCH.max
    );

    const queryString = new URLSearchParams({
      q: params.q,
      limit: limit.toString(),
    });

    return await oxApi.getWithBaseResponse<UserSearchResult>(
      `/users/search/nickname?${queryString}`
    );
  },

  // ============================================================================
  // Profile with Points (통합 정보)
  // ============================================================================

  /**
   * 프로필 + 포인트 정보 조회
   */
  getMyProfileWithPoints: async (): Promise<
    UserProfile & { points_balance: number; last_updated: string }
  > => {
    const response = await oxApi.get<
      UserProfile & { points_balance: number; last_updated: string }
    >("/users/me/profile-with-points");
    return response.data;
  },

  /**
   * 재정 요약 정보 조회
   */
  getMyFinancialSummary: async (): Promise<FinancialSummary> => {
    const response = await oxApi.get<FinancialSummary>(
      "/users/me/financial-summary"
    );
    return response.data;
  },

  /**
   * 지불 가능 여부 확인
   */
  checkAffordability: async (amount: number): Promise<AffordabilityCheck> => {
    const response = await oxApi.get<AffordabilityCheck>(
      `/users/me/can-afford/${amount}`
    );
    return response.data;
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * OAuth 콜백 파라미터를 URL에서 파싱
 * 다양한 URL 형식 지원:
 * - bamtoly://?token=xxx&user_id=123
 * - bamtoly://oauth/callback?token=xxx&user_id=123
 * - https://ox-universe.bamtoly.com/callback?token=xxx&user_id=123
 */
export const parseOAuthCallback = (
  url: string
): {
  token: string;
  user_id: string;
  nickname: string;
  provider: string;
  is_new_user: boolean;
} | null => {
  try {
    console.log("Parsing OAuth callback URL:", url);

    // URL에서 쿼리 파라미터 추출
    let queryString: string | undefined;

    // 1. 일반 URL 형식: https://... 또는 bamtoly://...
    if (url.includes("?")) {
      queryString = url.split("?")[1];
    }
    // 2. 쿼리 파라미터가 없으면 파싱 실패
    else {
      console.warn("No query parameters found in URL");
      return null;
    }

    const urlParams = new URLSearchParams(queryString);
    const token = urlParams.get("token");
    const user_id = urlParams.get("user_id");
    const nickname = urlParams.get("nickname");
    const provider = urlParams.get("provider");
    const is_new_user = urlParams.get("is_new_user");

    console.log("Parsed OAuth params:", {
      hasToken: !!token,
      userId: user_id,
      nickname,
      provider,
      isNewUser: is_new_user,
    });

    if (!token || !user_id || !nickname || !provider || !is_new_user) {
      console.warn("Missing required OAuth callback parameters");
      return null;
    }

    return {
      token,
      user_id,
      nickname,
      provider,
      is_new_user: is_new_user === "true",
    };
  } catch (error) {
    console.error("OAuth callback parsing failed:", error);
    return null;
  }
};

/**
 * 토큰 유효성 검사 (JWT 디코딩)
 */
export const isTokenValid = (token: string): boolean => {
  try {
    // Base64 디코딩을 위해 react-native에서 사용 가능한 방법
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

/**
 * 토큰에서 사용자 정보 추출
 */
export const extractUserFromToken = (
  token: string
): {
  user_id: number;
  email: string;
  role: string;
} | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    return null;
  }
};
