import { useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useDeepLinking } from '@/hooks/useDeepLinking';
import { useAuth } from '@/providers/AuthProvider';

// Screens
import { LoginScreen } from '@/screens/Auth/LoginScreen';
import { DashboardScreen } from '@/screens/Dashboard/DashboardScreen';
import { SignalDetailScreen } from '@/screens/Signal/SignalDetailScreen';
import { PredictionScreen } from '@/screens/Prediction/PredictionScreen';
import { View, Text, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigation Stack 컴포넌트
 * useDeepLinking을 NavigationContainer 내부에서 호출
 */
function NavigationStack() {
  const { isAuthenticated, isLoading } = useAuth();

  // 디버깅 로그
  console.log('NavigationStack render:', {
    isAuthenticated,
    isAuthenticatedType: typeof isAuthenticated,
    isLoading,
    isLoadingType: typeof isLoading,
  });

  // 로딩 중일 때 스플래시 화면
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">로딩 중...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      {isAuthenticated ? (
        // 인증된 사용자용 화면
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="SignalDetail" component={SignalDetailScreen} />
          <Stack.Screen name="Prediction" component={PredictionScreen} />
        </>
      ) : (
        // 미인증 사용자용 화면
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

/**
 * Root Navigator
 * NavigationContainer로 Stack을 감쌈
 */
export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useDeepLinking(navigationRef, isNavigationReady);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setIsNavigationReady(true)}
    >
      <NavigationStack />
    </NavigationContainer>
  );
}
