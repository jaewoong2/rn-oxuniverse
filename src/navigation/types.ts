import { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Root Stack 파라미터 정의
 * 모든 화면의 route params를 여기에 정의
 */
export type RootStackParamList = {
  // Auth
  Login: undefined;

  // Main
  Dashboard: undefined;

  // Signal Detail
  SignalDetail: {
    symbol: string;
    aiModel?: string;
    date?: string;
  };

  // Prediction
  Prediction: {
    symbol: string;
    aiModel?: string;
    date?: string;
  };
};

/**
 * Screen Props 유틸리티 타입
 * 각 화면에서 사용할 Props 타입 정의 시 활용
 */
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

/**
 * Navigation Prop 타입 선언 (전역 사용)
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
