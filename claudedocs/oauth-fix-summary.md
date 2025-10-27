# OAuth 로그인 수정 완료 (2025-10-27)

## 문제 요약

React Native 앱의 OAuth 로그인이 제대로 작동하지 않았던 문제:
1. AuthProvider 초기화 시 SecureStore에서 토큰을 로드하지 않고 바로 프로필 조회 시도 → 401 에러
2. OAuth 콜백 URL 파싱 로직이 다양한 URL 형식을 지원하지 못함
3. 로그인 성공 후 토큰 저장과 프로필 로드 사이의 동기화 이슈
4. 디버깅을 위한 로그가 부족하여 문제 추적 어려움

## 수정 내용

### 1. AuthProvider.tsx 개선

**파일**: [src/providers/AuthProvider.tsx](../src/providers/AuthProvider.tsx)

#### 변경사항:
- ✅ **초기 토큰 로드 로직 수정** (lines 117-171)
  - SecureStore/AsyncStorage에서 토큰 먼저 로드
  - 토큰 유효성 검증 (`isTokenValid`)
  - 유효한 토큰이 있을 때만 프로필 조회
  - Platform별 저장소 전략 (iOS/Android → SecureStore, Web → AsyncStorage)

- ✅ **login() 함수 개선** (lines 43-73)
  - 토큰 유효성 검증 추가
  - 토큰 저장 → 상태 업데이트 → 프로필 자동 로드
  - 성공 로그 추가: `"Login successful: {nickname}"`
  - 에러 처리 강화

#### 주요 로직:
```typescript
// 초기화 시 토큰 로드 프로세스
1. SecureStore/AsyncStorage에서 토큰 가져오기
2. 토큰 없거나 만료 → 로그아웃 상태
3. 토큰 유효 → 상태 업데이트 → 프로필 로드 → 세션 복원
```

### 2. authService.ts 강화

**파일**: [src/services/api/authService.ts](../src/services/api/authService.ts)

#### 변경사항:
- ✅ **parseOAuthCallback() 개선** (lines 184-240)
  - 다양한 URL 형식 지원:
    - `bamtoly://?token=xxx`
    - `bamtoly://oauth/callback?token=xxx`
    - `https://ox-universe.bamtoly.com/callback?token=xxx`
  - 상세한 파싱 로그 추가
  - 에러 처리 강화

#### 로그 출력:
```
Parsing OAuth callback URL: bamtoly://?token=xxx&user_id=123
Parsed OAuth params: { hasToken: true, userId: "123", nickname: "user", ... }
```

### 3. LoginScreen.tsx 업데이트

**파일**: [src/screens/Auth/LoginScreen.tsx](../src/screens/Auth/LoginScreen.tsx)

#### 변경사항:
- ✅ **OAuth 딥링크 리스너 개선** (lines 84-137)
  - URL 파싱 로직 강화
  - 로그인 성공 후 Dashboard 네비게이션 자동화
  - 에러 처리 및 사용자 피드백 개선

- ✅ **handleOAuthLogin() 개선** (lines 153-211)
  - WebBrowser result 로그 추가
  - 명시적 콜백 처리 추가
  - result.type에 따른 분기 처리 (success/cancel/dismiss)

#### 로그 출력:
```
OAuth redirect URL: bamtoly://
Opening OAuth URL: https://ox-universe.bamtoly.com/api/v1/auth/oauth/google/authorize?client_redirect=...
WebBrowser result: { type: 'success', url: '...' }
OAuth success, callback URL: bamtoly://?token=xxx
Processing OAuth login...
Login successful: user123
```

## 로그인 플로우 (수정 후)

### Magic Link 플로우
```
1. 이메일 입력 → Magic Link 전송
2. 이메일 링크 클릭 → 백엔드 인증
3. useMyProfile 폴링 (2초 간격) → 토큰 자동 저장
4. 프로필 로드 성공 → Dashboard 이동
```

### OAuth 플로우
```
1. OAuth 버튼 클릭 (Google/Kakao/Apple)
2. WebBrowser.openAuthSessionAsync 호출
   - 리다이렉트 URL: bamtoly://
3. 사용자 인증 → 백엔드 리다이렉트
   - 콜백 URL: bamtoly://?token=xxx&user_id=123&...
4. 딥링크 리스너 감지 → parseOAuthCallback()
5. 토큰 검증 → login() 호출
   - SecureStore 저장
   - 프로필 자동 로드
6. 성공 알림 → Dashboard 이동
```

### 앱 재시작 플로우
```
1. AuthProvider 초기화
2. SecureStore에서 토큰 로드
3. 토큰 유효성 검증
4. 유효하면 → 프로필 로드 → 세션 복원
5. 만료되었으면 → 로그아웃 상태
```

## 테스트 체크리스트

### 필수 테스트 시나리오

- [ ] **Magic Link 로그인**
  - 이메일 입력 → 링크 전송 확인
  - 폴링 시작 → "이메일 확인 대기 중..." 표시
  - 링크 클릭 → 로그인 성공 → Dashboard 이동

- [ ] **Google OAuth**
  - Google 버튼 클릭 → 브라우저 열림
  - Google 계정 선택 → 인증
  - 앱으로 복귀 → "로그인 성공" 알림 → Dashboard

- [ ] **Kakao OAuth**
  - Kakao 버튼 클릭 → 브라우저 열림
  - Kakao 로그인 → 인증
  - 앱으로 복귀 → "로그인 성공" 알림 → Dashboard

- [ ] **Apple OAuth** (iOS만)
  - Apple 버튼 클릭 → 브라우저 열림
  - Face ID/Touch ID 인증
  - 앱으로 복귀 → "로그인 성공" 알림 → Dashboard

- [ ] **세션 복원**
  - 로그인 후 앱 종료
  - 앱 재시작 → 자동 로그인 (Dashboard로 바로 이동)
  - 로그 확인: `"Session restored: {nickname}"`

- [ ] **401 Unauthorized 처리**
  - 로그인 상태에서 토큰 만료 시뮬레이션
  - API 요청 → 401 에러 → 자동 로그아웃
  - Login 화면으로 이동

### 디버깅 팁

**로그 확인 방법:**
```bash
# iOS
npx expo start --ios
# Console에서 로그 확인

# Android
npx expo start --android
# Logcat에서 로그 확인
```

**주요 로그 키워드:**
- `"OAuth redirect URL:"` - 딥링크 URL 확인
- `"Opening OAuth URL:"` - 백엔드 OAuth URL 확인
- `"WebBrowser result:"` - OAuth 브라우저 결과
- `"Parsing OAuth callback URL:"` - 콜백 파싱
- `"Login successful:"` - 로그인 성공
- `"Session restored:"` - 세션 복원

## 기술 스택 확인

- ✅ React Native 0.81.5
- ✅ Expo SDK ~54.0
- ✅ TypeScript ~5.9.2
- ✅ expo-secure-store (토큰 저장)
- ✅ expo-web-browser (OAuth)
- ✅ expo-linking (딥링크)
- ✅ @react-native-async-storage/async-storage (fallback)

## 다음 단계 (선택사항)

1. **에러 트래킹 추가**
   - Sentry/Crashlytics 연동
   - OAuth 실패율 모니터링

2. **리프레시 토큰 구현**
   - 토큰 만료 전 자동 갱신
   - AuthProvider의 refreshToken() 활용

3. **생체 인증 추가**
   - expo-local-authentication
   - SecureStore + Biometric unlock

4. **소셜 로그인 확장**
   - Naver, Facebook 추가
   - authService.ts에 provider 추가

## 참고 문서

- [docs/react-native-migration.md](../docs/react-native-migration.md) - 전체 마이그레이션 가이드
- [docs/todo-list.md](../docs/todo-list.md) - 작업 진행 현황
- [Web useAuth.tsx](../../predict_stock_react/src/hooks/useAuth.tsx) - 웹 구현 참고
- [Web login-modal.tsx](../../predict_stock_react/src/components/auth/login-modal.tsx) - 웹 로그인 UI 참고

## 타입 체크 결과

```bash
$ npx tsc --noEmit
# ✅ No errors found
```

모든 타입 체크 통과 완료!
