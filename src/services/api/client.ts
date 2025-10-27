import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DeviceEventEmitter, Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * API 응답 기본 구조
 */
export interface BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Unauthorized 에러 클래스
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 토큰 저장 키
 */
const TOKEN_KEY = 'auth_token';

/**
 * 환경 변수에서 API URL 가져오기
 */
const normalizeEnvUrl = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getBaseUrl = (): string => {
  const envUrl = normalizeEnvUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (envUrl) {
    return envUrl;
  }

  const isDev = __DEV__;
  if (isDev) {
    return (
      Constants.expoConfig?.extra?.localApiUrl ||
      'http://localhost:3000/api/proxy/'
    );
  }

  return (
    Constants.expoConfig?.extra?.apiBaseUrl || 'https://ai-api.bamtoly.com/'
  );
};

export const getOxBaseUrl = (): string => {
  const envUrl = normalizeEnvUrl(process.env.EXPO_PUBLIC_OX_API_BASE_URL);
  if (envUrl) {
    return envUrl;
  }

  const isDev = __DEV__;
  if (isDev) {
    return (
      Constants.expoConfig?.extra?.oxApiLocalUrl ||
      'http://localhost:8001/api/v1/'
    );
  }

  return (
    Constants.expoConfig?.extra?.oxApiBaseUrl ||
    'https://ox-universe.bamtoly.com/api/v1/'
  );
};

/**
 * SecureStore 사용 가능 여부 캐시
 */
let isSecureStoreAvailable: boolean | null = null;

const ensureSecureStoreAvailability = async () => {
  if (isSecureStoreAvailable !== null) {
    return isSecureStoreAvailable;
  }
  if (Platform.OS === 'web') {
    isSecureStoreAvailable = false;
    return isSecureStoreAvailable;
  }
  try {
    isSecureStoreAvailable = await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('SecureStore availability check failed, falling back:', error);
    isSecureStoreAvailable = false;
  }
  return isSecureStoreAvailable;
};

const getTokenFromFallback = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token from AsyncStorage fallback:', error);
    return null;
  }
};

/**
 * SecureStore에서 토큰 가져오기 (웹/지원 불가 환경에서 AsyncStorage fallback)
 */
const getToken = async (): Promise<string | null> => {
  const canUseSecureStore = await ensureSecureStoreAvailability();

  if (!canUseSecureStore) {
    return getTokenFromFallback();
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get token from SecureStore:', error);
    return getTokenFromFallback();
  }
};

/**
 * SecureStore에 토큰 저장
 */
const setTokenFallback = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save token to AsyncStorage fallback:', error);
    throw error;
  }
};

export const setToken = async (token: string): Promise<void> => {
  const canUseSecureStore = await ensureSecureStoreAvailability();

  if (!canUseSecureStore) {
    return setTokenFallback(token);
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save token to SecureStore:', error);
    return setTokenFallback(token);
  }
};

/**
 * SecureStore에서 토큰 삭제
 */
const deleteTokenFallback = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to delete token from AsyncStorage fallback:', error);
  }
};

export const deleteToken = async (): Promise<void> => {
  const canUseSecureStore = await ensureSecureStoreAvailability();

  if (!canUseSecureStore) {
    return deleteTokenFallback();
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Failed to delete token from SecureStore:', error);
    await deleteTokenFallback();
  }
};

/**
 * Custom fetch 함수 생성
 */
const createCustomFetch = (baseUrlGetter: () => string) => {
  return async (url: string, options: RequestInit = {}) => {
    const baseUrl = baseUrlGetter();
    // baseURL이 /로 끝나고 url이 /로 시작하면 중복 제거
    const cleanUrl =
      baseUrl.endsWith('/') && url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = `${baseUrl}${cleanUrl}`;
    const token = await getToken();

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    };

    try {
      const response = await fetch(fullUrl, config);

      if (!response.ok) {
        // HTTP 에러 처리
        const errorData = await response.json().catch(() => ({
          message: response.statusText,
        }));

        console.error('API 요청 실패:', {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          errorData,
        });

        // 401 에러 시 토큰 삭제 및 이벤트 발행
        if (response.status === 401) {
          try {
            await deleteToken();
            // DeviceEventEmitter를 통해 auth:unauthorized 이벤트 발행
            DeviceEventEmitter.emit('auth:unauthorized', {
              url: fullUrl,
              status: response.status,
            });
          } catch (e) {
            console.error('Failed to handle 401 unauthorized:', e);
          }
          throw new UnauthorizedError();
        }

        // Axios와 유사한 에러 객체 형태로 reject
        return Promise.reject({
          response: {
            data: errorData,
            status: response.status,
            statusText: response.statusText,
          },
        });
      }

      // 응답 본문이 없는 경우 (e.g., 204 No Content)
      if (
        response.status === 204 ||
        response.headers.get('content-length') === '0'
      ) {
        return { data: null };
      }

      const data = await response.json();
      // Axios와 유사하게 response.data 형태로 반환
      return { data };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      console.error('네트워크 또는 기타 요청 실패:', error);
      throw error;
    }
  };
};

/**
 * BaseResponse를 파싱하는 함수
 */
const parseBaseResponse = <T>(response: any): T => {
  const result: BaseResponse<T> = response.data;

  if (!result.success) {
    throw new Error(result.error?.message || 'API Error');
  }

  return result.data!;
};

/**
 * BaseResponse를 사용하지 않는 엔드포인트용 파싱 함수
 */
const parseDirectResponse = <T>(response: any): T => {
  return response.data;
};

// 기존 API용 customFetch 인스턴스
const customFetch = createCustomFetch(getBaseUrl);

// O/X API용 customFetch 인스턴스
const oxCustomFetch = createCustomFetch(getOxBaseUrl);

/**
 * API 클라이언트 생성 함수
 */
const createApiClient = (
  fetchInstance: ReturnType<typeof createCustomFetch>
) => ({
  // 기본 메서드 (raw response)
  get: <T>(
    url: string,
    config?: { params?: Record<string, any> }
  ): Promise<{ data: T }> => {
    let urlWithParams = url;
    if (config?.params) {
      const query = new URLSearchParams(config.params).toString();
      if (query) {
        urlWithParams += `?${query}`;
      }
    }
    return fetchInstance(urlWithParams, { method: 'GET' });
  },

  post: <T>(url: string, data?: any): Promise<{ data: T }> =>
    fetchInstance(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: any): Promise<{ data: T }> =>
    fetchInstance(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(url: string, data?: any): Promise<{ data: T }> =>
    fetchInstance(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(url: string): Promise<{ data: T }> =>
    fetchInstance(url, { method: 'DELETE' }),

  // BaseResponse를 파싱하는 메서드들
  getWithBaseResponse: async <T>(
    url: string,
    config?: { params?: Record<string, any> }
  ): Promise<T> => {
    let urlWithParams = url;
    if (config?.params) {
      const query = new URLSearchParams(config.params).toString();
      if (query) {
        urlWithParams += `?${query}`;
      }
    }
    const response = await fetchInstance(urlWithParams, { method: 'GET' });
    return parseBaseResponse<T>(response);
  },

  postWithBaseResponse: async <T>(url: string, data?: any): Promise<T> => {
    const response = await fetchInstance(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return parseBaseResponse<T>(response);
  },

  putWithBaseResponse: async <T>(url: string, data?: any): Promise<T> => {
    const response = await fetchInstance(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return parseBaseResponse<T>(response);
  },

  patchWithBaseResponse: async <T>(url: string, data?: any): Promise<T> => {
    const response = await fetchInstance(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    return parseBaseResponse<T>(response);
  },

  deleteWithBaseResponse: async <T>(url: string): Promise<T> => {
    const response = await fetchInstance(url, { method: 'DELETE' });
    return parseBaseResponse<T>(response);
  },
});

// API 클라이언트 인스턴스
export const api = createApiClient(customFetch);
export const oxApi = createApiClient(oxCustomFetch);

// 파싱 함수 export
export { parseBaseResponse, parseDirectResponse };
