# React Native Migration TODOs

이 문서는 `docs/react-native-migration.md`의 섹션 9(실전 Todo 리스트)를 실행 가능한 작업 항목으로 쪼개고 진행 현황을 한눈에 볼 수 있도록 정리했습니다. 각 항목은 체크박스 기반으로 추적하며, 필요한 선행 조건과 다음 행동을 함께 기록합니다.

## 상태 레전드

- [ ] Not Started
- [~] In Progress
- [x] Done

## Phase 1 · Foundation & Shared Layer

| Status | Task                                             | Notes / Next Action                                                                                                                                                          | Depends On  |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| [x]    | Expo 프로젝트 초기화 (`expo init rn-oxuniverse`) | 루트 디렉토리에 Expo blank TS 앱 생성                                                                                                                                        | -           |
| [x]    | 핵심 패키지 설치                                 | SafeArea, Gesture Handler, Reanimated, React Navigation, React Query, AsyncStorage, SecureStore, NativeWind 등 설치                                                           | Expo init   |
| [x]    | `.env` 스키마 정의                               | `.env.example` 추가, `EXPO_PUBLIC_*` 키 정리                                                                                                                           | -           |
| [x]    | `src/` 디렉토리 구조 생성                       | components, screens, navigation, providers, services, hooks, utils, types, store 폴더 생성 완료                                                                                   | 패키지 설치 |
| [x]    | `api/client.ts` 작성                             | SecureStore 토큰 + 401 이벤트 처리 포함 (`src/services/api/client.ts`) 완료                                                                                                       | 디렉토리 생성 |
| [x]    | `AppProviders.tsx` 구성                          | QueryClientProvider + SafeArea + Gesture root (`src/providers/AppProviders.tsx`) 완료                                                                                              | api/client  |
| [x]    | `RootNavigator.tsx` 구현                        | Stack Navigator 기본 구조 + types 정의 완료                                                                                                                                       | AppProviders |
| [x]    | 공통 UI Kit scaffold                             | `Card`, `Badge`, `Button` 및 theme 토큰 정리 완료                                                                                                                                    | 디렉토리 생성   |
| [x]    | `useDeepLinking` 훅 구현                        | Linking listener 기반 딥링크 처리 완료                                                                                                                                            | RootNavigator |
| [x]    | Path alias 설정                                 | babel-plugin-module-resolver 설치 및 babel.config.js 설정 완료                                                                                                              | -           |
| [x]    | TypeScript 검증                                 | `npx tsc --noEmit` 통과 확인 완료                                                                                                                                             | 모든 코드   |

## Phase 2 · Auth Flow (Strangler 단계 1)

| Status | Task                              | Notes / Next Action                                                           | Depends On   |
| ------ | --------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| [x]    | Auth 타입 정의                    | User, AuthProvider, OAuth, Token types 완료 (`src/types/auth.ts`)            | -            |
| [x]    | API client BaseResponse 메서드    | getWithBaseResponse, postWithBaseResponse 등 추가 완료                         | api/client   |
| [x]    | `services/authService.ts` 포팅    | login/magic-link/refresh/logout/profile API 완료 (`src/services/api/authService.ts`) | api/client   |
| [x]    | `AuthProvider` 구현               | SecureStore persist, `auth:unauthorized` 이벤트 구독, React Query 캐시 초기화 완료 | authService  |
| [x]    | `useAuth` hook export             | AuthProvider에서 useAuth hook export 완료                                     | AuthProvider |
| [x]    | AppProviders 통합                 | AuthProvider를 AppProviders에 추가 완료                                        | AuthProvider |
| [x]    | Login Screen (Email + Magic link) | form + submit + `useMyProfile` 폴링 완료 (`src/screens/Auth/LoginScreen.tsx`) | AuthProvider |
| [x]    | OAuth 연동                        | `expo-web-browser`, `parseOAuthCallback` 로직 완료 (Google/Kakao/Apple)       | Login Screen |
| [x]    | Auth 기반 네비게이션              | isAuthenticated에 따른 초기 route 결정 + 로그아웃 기능 완료                    | Login Screen |
| [x]    | **OAuth 딥링크 수정 (2025-10-27)** | AuthProvider 초기 토큰 로드 + OAuth 콜백 처리 개선 + 로그 추가 완료            | OAuth 연동   |
| [ ]    | Feature Flag `authFlowReady`      | mock user 접근 허용, `expo-updates` remote flag (선택사항, 추후)              | AuthProvider |

## Phase 3 · Filter / Search Param Store

| Status | Task                               | Notes / Next Action                                             | Depends On     |
| ------ | ---------------------------------- | --------------------------------------------------------------- | -------------- |
| [x]    | `useFilterStore` 베이스            | zustand + persist + AsyncStorage 완료 (`src/store/useFilterStore.ts`)       | Expo init      |
| [x]    | Debounce & pagination reset helper | `setFilters` 호출 시 page=1 자동 리셋, auto-fill conditions 로직 완료                       | useFilterStore |
| [x]    | `getTodayKST` util 포팅            | 초기값/rehydration 시 사용 완료 (`src/utils/date.ts`)                | useFilterStore |
| [x]    | Linking listener                   | `useDeepLinking` 업데이트 → query 파싱 → store 업데이트 완료 | useFilterStore |

## Phase 4 · Data Hooks 포팅

| Status | Task                                              | Notes / Next Action                                                                                    | Depends On |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------- |
| [x]    | Query key 모듈 작성                               | `SIGNAL_KEYS`, `PREDICTION_KEYS`, `SESSION_KEYS`, `PRICE_KEYS`, `MARKET_NEWS_KEYS` 완료                 | api/client |
| [x]    | `useSignalDataByNameAndDate`                      | 완료 (`src/hooks/useSignal.ts`)                                                                         | Query keys |
| [x]    | `useWeeklyActionCount` & `useWeeklyPriceMovement` | 완료 (`src/hooks/useSignal.ts`)                                                                         | Query keys |
| [x]    | `useMarketNewsSummary` & `useTodaySession`        | 완료 (`src/hooks/useMarketNews.ts`, `src/hooks/useSession.ts`)                                          | Query keys |
| [x]    | Prediction 관련 훅                                | 완료 (`src/hooks/usePrediction.ts`, `src/hooks/usePrice.ts`)                                            | Query keys |
| [ ]    | Consumer-driven contract tests                    | `msw` or `pactum`로 주요 응답 스키마 검증 (선택사항, 추후)                                                | 각 훅      |

## Phase 5 · Screens (Strangler 단계 2~3)

### DashboardScreen

- [x] Stack route `/dashboard` 생성 완료 (`src/screens/Dashboard/DashboardScreen.tsx`)
- [x] Header + Stats 섹션 완료 (`usePredictionStats`, `useTodaySession` 연동)
- [x] Session status + Today's predictions 섹션 완료
- [x] User stats grid (Total/Accuracy/Correct/Incorrect/Net Points) 완료

### SignalDetailScreen

- [x] Route params `{symbol, aiModel?, date?}` 정의 완료 (`src/screens/Signal/SignalDetailScreen.tsx`)
- [x] Info 헤더 + AI 모델 picker 완료 (Horizontal ScrollView)
- [x] Overview/Analysis/Good&Bad Things 섹션 완료
- [x] `Predict` CTA → PredictionScreen 네비게이션 완료

### PredictionScreen

- [x] Screen guard 완료 (`useTodaySession`, session phase check)
- [x] 실시간 가격 카드 + 등락률 표시 완료 (`useCurrentPrice` 연동)
- [x] 예측 제출/수정 폼 완료 (UP/DOWN 선택, existing prediction 처리)
- [x] Remaining slots 체크 + 기존 예측 수정 로직 완료

## Phase 6 · Safety Net & Deployment

| Status | Task                              | Notes / Next Action                                               | Depends On    |
| ------ | --------------------------------- | ----------------------------------------------------------------- | ------------- |
| [ ]    | Feature flag 레이어               | `expo-updates` + remote config, `newDashboard`, `predictionV2` 등 | Auth flow     |
| [ ]    | Analytics/Crashlytics 이벤트 매핑 | 화면 진입, 예측 제출, 로그인 성공                                 | Screens       |
| [ ]    | Detox E2E 시나리오                | 로그인 → 대시보드 → 디테일 → 예측 플로우 자동화                   | Screens       |
| [ ]    | Beta 배포 파이프라인              | Firebase App Distribution/TestFlight                              | Feature flags |
| [ ]    | Gradual rollout 전략              | 퍼센트 기반 활성화 + 모니터링 대시보드                            | Beta 배포     |

## Phase 7 · Definition of Done

- [ ] 모든 상위 체크박스 완료
- [ ] 모바일/웹 동일 백엔드 호출로 데이터 확인
- [ ] QA: critical 0건, major ≤ 3건
- [ ] 앱 스토어용 스크린샷/설명 업데이트

> 진행하면서 각 항목의 상태를 갱신하고, 세부 노트를 추가해 후속 작업자가 명확히 이어받을 수 있게 유지해주세요.
