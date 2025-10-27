import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { authService, parseOAuthCallback } from '@/services/api/authService';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';

// OAuth 결과 warmup (iOS 성능 최적화)
WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const navigation = useNavigation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Magic Link 전송 Mutation
   */
  const sendMagicLinkMutation = useMutation({
    mutationFn: (email: string) => authService.sendMagicLink(email),
    onSuccess: () => {
      Alert.alert(
        '매직 링크 전송 완료',
        '이메일을 확인하고 링크를 클릭해주세요.',
        [{ text: '확인' }]
      );
      // 폴링 시작
      setIsPolling(true);
    },
    onError: (error) => {
      console.error('Magic link error:', error);
      Alert.alert(
        '전송 실패',
        '매직 링크 전송에 실패했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    },
  });

  /**
   * 프로필 폴링 (Magic Link 인증 확인용)
   */
  const { data: profile } = useQuery({
    queryKey: ['profile', 'polling'],
    queryFn: () => authService.getMyProfile(),
    enabled: isPolling && !isAuthenticated,
    refetchInterval: isPolling && !isAuthenticated ? 2000 : false, // 2초마다
    retry: false,
  });

  /**
   * 폴링으로 인증 성공 감지
   */
  useEffect(() => {
    if (profile && isPolling) {
      setIsPolling(false);
      Alert.alert('로그인 성공', `환영합니다, ${profile.nickname}님!`, [
        { text: '확인' },
      ]);
      // Dashboard로 이동
      navigation.navigate('Dashboard' as never);
    }
  }, [profile, isPolling, navigation]);

  /**
   * OAuth URL 리스너 (딥링크 처리)
   */
  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      console.log('Deep link received:', url);

      // OAuth 콜백 파싱
      const oauthResult = parseOAuthCallback(url);
      if (!oauthResult) {
        console.log('Not an OAuth callback URL');
        return;
      }

      try {
        console.log('Processing OAuth login...');
        // 토큰으로 로그인 (AuthProvider의 login 함수가 자동으로 프로필 로드)
        await login(oauthResult.token);

        Alert.alert(
          '로그인 성공',
          `환영합니다, ${oauthResult.nickname}님!`,
          [
            {
              text: '확인',
              onPress: () => {
                // Dashboard로 이동
                navigation.navigate('Dashboard' as never);
              },
            },
          ]
        );
      } catch (error) {
        console.error('OAuth login error:', error);
        Alert.alert(
          '로그인 실패',
          error instanceof Error ? error.message : '토큰 검증에 실패했습니다.',
          [{ text: '확인' }]
        );
      }
    };

    // URL 이벤트 리스너 추가
    const subscription = Linking.addEventListener('url', handleUrl);

    // 초기 URL 확인 (앱이 닫힌 상태에서 열린 경우)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url);
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [login, navigation]);

  /**
   * Email 로그인 핸들러
   */
  const handleEmailLogin = useCallback(() => {
    if (!email || !email.includes('@')) {
      Alert.alert('오류', '유효한 이메일을 입력해주세요', [{ text: '확인' }]);
      return;
    }
    sendMagicLinkMutation.mutate(email);
  }, [email, sendMagicLinkMutation]);

  /**
   * OAuth 로그인 핸들러
   */
  const handleOAuthLogin = useCallback(
    async (provider: 'google' | 'kakao' | 'apple') => {
      try {
        // 리다이렉트 URL (앱 scheme)
        // bamtoly:// 형식으로 생성됨
        const redirectUrl = Linking.createURL('/');
        console.log('OAuth redirect URL:', redirectUrl);

        // OAuth URL 생성
        const oauthUrl = authService.getOAuthUrl({
          provider,
          client_redirect: redirectUrl,
        });
        console.log('Opening OAuth URL:', oauthUrl);

        // 브라우저 열기
        const result = await WebBrowser.openAuthSessionAsync(
          oauthUrl,
          redirectUrl
        );

        console.log('WebBrowser result:', result);

        if (result.type === 'success' && result.url) {
          // OAuth 콜백 처리는 URL 리스너에서 자동으로 처리됨
          console.log('OAuth success, callback URL:', result.url);
          // 명시적으로 콜백 처리
          const oauthResult = parseOAuthCallback(result.url);
          if (oauthResult) {
            await login(oauthResult.token);
            Alert.alert(
              '로그인 성공',
              `환영합니다, ${oauthResult.nickname}님!`,
              [
                {
                  text: '확인',
                  onPress: () => navigation.navigate('Dashboard' as never),
                },
              ]
            );
          }
        } else if (result.type === 'cancel') {
          console.log('OAuth cancelled by user');
        } else if (result.type === 'dismiss') {
          console.log('OAuth dismissed by user');
        }
      } catch (error) {
        console.error('OAuth error:', error);
        Alert.alert(
          '오류',
          error instanceof Error
            ? error.message
            : 'OAuth 로그인에 실패했습니다.',
          [{ text: '확인' }]
        );
      }
    },
    [login, navigation]
  );

  const isLoading =
    sendMagicLinkMutation.isPending || isPolling || isAuthenticated;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mb-4">
                <Text className="text-3xl">📧</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-2">
                로그인
              </Text>
              <Text className="text-gray-600 text-center">
                이메일 또는 소셜 계정으로 로그인하세요
              </Text>
            </View>

            {/* Email Login Card */}
            <Card variant="outlined" className="mb-6">
              <View className="space-y-4">
                <Text className="text-sm font-medium text-gray-700">
                  이메일 주소
                </Text>
                <TextInput
                  className="h-12 border border-gray-300 rounded-lg px-4 text-base"
                  placeholder="youremail@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                  onSubmitEditing={handleEmailLogin}
                />
                <Button
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  loading={sendMagicLinkMutation.isPending}
                  className="mt-2"
                >
                  {isPolling
                    ? '이메일 확인 대기 중...'
                    : '매직 링크로 로그인'}
                </Button>
              </View>
            </Card>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="px-4 text-gray-500 text-sm">또는</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* OAuth Buttons */}
            <View className="space-y-3">
              {/* Google */}
              <TouchableOpacity
                className="flex-row items-center justify-center h-12 border border-gray-300 rounded-lg bg-white active:bg-gray-50"
                onPress={() => handleOAuthLogin('google')}
                disabled={isLoading}
              >
                <Text className="text-base font-medium text-gray-700 ml-2">
                  Google로 계속하기
                </Text>
              </TouchableOpacity>

              {/* Kakao */}
              <TouchableOpacity
                className="flex-row items-center justify-center h-12 rounded-lg active:opacity-80"
                style={{ backgroundColor: '#FEE500' }}
                onPress={() => handleOAuthLogin('kakao')}
                disabled={isLoading}
              >
                <Text className="text-base font-medium" style={{ color: '#3C1E1E' }}>
                  Kakao로 계속하기
                </Text>
              </TouchableOpacity>

              {/* Apple */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  className="flex-row items-center justify-center h-12 bg-black rounded-lg active:opacity-80"
                  onPress={() => handleOAuthLogin('apple')}
                  disabled={isLoading}
                >
                  <Text className="text-base font-medium text-white ml-2">
                    Apple로 계속하기
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Loading Indicator */}
            {isLoading && (
              <View className="mt-6 items-center">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-600 mt-2 text-sm">
                  {isPolling ? '인증 확인 중...' : '처리 중...'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
