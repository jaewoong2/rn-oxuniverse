import {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
  useCallback,
} from "react";
import { DeviceEventEmitter } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { setToken, deleteToken } from "@/services/api/client";
import { authService, isTokenValid } from "@/services/api/authService";
import { User, AuthContextValue } from "@/types/auth";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/**
 * 토큰 저장 키
 */
const TOKEN_KEY = "auth_token";

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider
 * SecureStore 기반 토큰 관리 + auth:unauthorized 이벤트 구독
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const queryClient = useQueryClient();

  /**
   * 로그인: 토큰 저장 및 프로필 로드
   */
  const login = useCallback(async (newToken: string) => {
    try {
      // 토큰 유효성 검증
      if (!isTokenValid(newToken)) {
        throw new Error("Invalid token");
      }

      // SecureStore에 토큰 저장
      await setToken(newToken);
      setTokenState(newToken);

      // 프로필 로드
      setIsProfileLoading(true);
      const profile = await authService.getMyProfile();
      setUser(profile);

      console.log("Login successful:", profile.nickname);
    } catch (error) {
      console.error("Login failed:", error);
      // 로그인 실패 시 토큰 삭제
      await deleteToken();
      setTokenState(null);
      setUser(null);
      throw error;
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  /**
   * 로그아웃: 토큰 삭제 및 상태 초기화
   */
  const logout = useCallback(async () => {
    try {
      if (token) {
        // 서버에 로그아웃 요청
        await authService.logout(token);
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      // 로컬 상태 초기화
      await deleteToken();
      setTokenState(null);
      setUser(null);

      // React Query 캐시 초기화
      queryClient.clear();
    }
  }, [token, queryClient]);

  /**
   * 토큰 갱신
   */
  const refreshToken = useCallback(async () => {
    if (!token) return;

    try {
      const response = await authService.refreshToken(token);
      await setToken(response.access_token);
      setTokenState(response.access_token);
    } catch (error) {
      console.error("Token refresh failed:", error);
      // 갱신 실패 시 로그아웃
      await logout();
    }
  }, [token, logout]);

  /**
   * 초기 토큰 로드 (앱 시작 시)
   */
  useEffect(() => {
    const loadInitialToken = async () => {
      try {
        // 1. SecureStore에서 토큰 가져오기
        let storedToken: string | null = null;

        if (Platform.OS === "web") {
          storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        } else {
          try {
            const isAvailable = await SecureStore.isAvailableAsync();
            if (isAvailable) {
              storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            } else {
              storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            }
          } catch (error) {
            console.warn(
              "SecureStore access failed, using AsyncStorage:",
              error
            );
            storedToken = await AsyncStorage.getItem(TOKEN_KEY);
          }
        }

        // 2. 토큰이 없거나 유효하지 않으면 로그아웃 상태
        if (!storedToken || !isTokenValid(storedToken)) {
          console.log("No valid token found");
          if (storedToken) {
            await deleteToken();
          }
          setTokenState(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // 3. 토큰이 유효하면 상태 업데이트 및 프로필 로드
        setTokenState(storedToken);
        setIsProfileLoading(true);

        const profile = await authService.getMyProfile();
        setUser(profile);
        console.log("Session restored:", profile.nickname);
      } catch (error) {
        console.error("Initial token load failed:", error);
        // 프로필 로드 실패 시 토큰 삭제 및 로그아웃 상태
        await deleteToken();
        setTokenState(null);
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsProfileLoading(false);
      }
    };

    loadInitialToken();
  }, []);

  /**
   * auth:unauthorized 이벤트 리스너
   */
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "auth:unauthorized",
      async () => {
        console.log("Unauthorized event received, logging out...");
      }
    );

    return () => {
      subscription.remove();
    };
  }, [logout]);

  const value: AuthContextValue = {
    token,
    isAuthenticated: Boolean(user), // !!user와 동일하지만 더 명시적
    user,
    isLoading: Boolean(isLoading), // 명시적 boolean 변환
    isProfileLoading: Boolean(isProfileLoading),
    login,
    logout,
    refreshToken,
  };

  // 디버깅 로그
  console.log("AuthProvider value:", {
    hasToken: !!token,
    isAuthenticated: value.isAuthenticated,
    isAuthenticatedType: typeof value.isAuthenticated,
    hasUser: !!user,
    isLoading: value.isLoading,
    isLoadingType: typeof value.isLoading,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
