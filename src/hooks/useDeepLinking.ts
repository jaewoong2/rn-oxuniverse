import { useCallback, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { useFilterStore, queryStringToFilterState } from '@/store/useFilterStore';

/**
 * Deep Linking Hook
 * URL 스킴을 통한 앱 내 네비게이션 처리 + Filter Store 동기화
 *
 * 지원하는 URL 패턴:
 * - bamtoly://detail?symbol=AAPL&date=2024-01-01&models=GPT4,CLAUDE
 * - bamtoly://predict?symbol=AAPL
 * - bamtoly://dashboard?date=2024-01-01&q=AAPL
 */
export function useDeepLinking(
  navigationRef?: NavigationContainerRefWithCurrent<RootStackParamList>,
  isNavigationReady = false
) {
  const setFilters = useFilterStore((state) => state.setFilters);

  /**
   * Deep Link URL 파싱 및 네비게이션 처리
   */
  const handleDeepLink = useCallback(
    (url: string) => {
      if (!navigationRef?.current || !isNavigationReady) {
        console.warn('Navigation not ready, skipping deep link:', url);
        return;
      }

      const navigator = navigationRef.current;

      try {
        const { path, queryParams } = Linking.parse(url);

        if (!path) return;

        // Query string에서 filter 파라미터 추출 및 store 업데이트
        const urlObj = new URL(url);
        const queryString = urlObj.search.substring(1); // '?' 제거
        if (queryString) {
          const filterUpdates = queryStringToFilterState(queryString);
          setFilters(filterUpdates);
        }

        // URL 패턴에 따른 화면 이동
        switch (path) {
          case 'detail':
            if (queryParams?.symbol) {
              navigator.navigate('SignalDetail', {
                symbol: queryParams.symbol as string,
                aiModel: queryParams.aiModel as string | undefined,
                date: queryParams.date as string | undefined,
              });
            }
            break;

          case 'predict':
            if (queryParams?.symbol) {
              navigator.navigate('Prediction', {
                symbol: queryParams.symbol as string,
                aiModel: queryParams.aiModel as string | undefined,
                date: queryParams.date as string | undefined,
              });
            }
            break;

          case 'login':
            navigator.navigate('Login');
            break;

          case 'dashboard':
          default:
            navigator.navigate('Dashboard');
            break;
        }
      } catch (error) {
        console.error('Failed to handle deep link:', error);
      }
    },
    [isNavigationReady, navigationRef, setFilters]
  );

  useEffect(() => {
    if (!navigationRef || !isNavigationReady) {
      return;
    }

    // 초기 URL 처리 (앱이 닫힌 상태에서 URL로 열린 경우)
    const handleInitialURL = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    // URL 변경 리스너 (앱이 열린 상태에서 URL을 받은 경우)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink, isNavigationReady, navigationRef]);
}
