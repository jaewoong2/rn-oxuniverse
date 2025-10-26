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
| [x]    | `api/client.ts` 작성                             | SecureStore 토큰 + 401 이벤트 처리 포함 (`src/services/api/client.ts`)                                                                                                       | 패키지 설치 |
| [x]    | `AppProviders.tsx` 구성                          | QueryClientProvider + SafeArea + Gesture root (`src/providers/AppProviders.tsx`)                                                                                              | api/client  |
| [x]    | 공통 UI Kit scaffold                             | `Card`, `Badge`, `Button` 및 theme 토큰 정리                                                                                                                                    | Expo init   |

## Phase 2 · Auth Flow (Strangler 단계 1)

| Status | Task                              | Notes / Next Action                                                           | Depends On   |
| ------ | --------------------------------- | ----------------------------------------------------------------------------- | ------------ |
| [ ]    | `services/authService.ts` 포팅    | login/magic-link/refresh/logout/profile API                                   | api/client   |
| [ ]    | `AuthProvider` 구현               | SecureStore persist, `auth:unauthorized` 이벤트 구독, React Query 캐시 초기화 | authService  |
| [ ]    | Login Screen (Email + Magic link) | form + submit + `useMyProfile` 폴링, 성공 시 Home 이동                        | AuthProvider |
| [ ]    | OAuth 연동                        | `expo-auth-session` or CustomTabs, `useOAuthCallback` 로직 재사용             | Login Screen |
| [ ]    | Feature Flag `authFlowReady`      | mock user 접근 허용, `expo-updates` remote flag                               | AuthProvider |

## Phase 3 · Filter / Search Param Store

| Status | Task                               | Notes / Next Action                                             | Depends On     |
| ------ | ---------------------------------- | --------------------------------------------------------------- | -------------- |
| [x]    | `useFilterStore` 베이스            | date/q/models/conditions/strategy_type + pagination 상태 (zustand/persist scaffolding)       | Expo init      |
| [ ]    | Debounce & pagination reset helper | `setParams` 호출 시 page=1, debounce 적용                       | useFilterStore |
| [x]    | `getTodayKST` util 포팅            | 초기값/rehydration 시 사용 (`src/utils/date.ts`)                | useFilterStore |
| [ ]    | Linking listener                   | `Linking.addEventListener('url')` → query 파싱 → store 업데이트 | useFilterStore |

## Phase 4 · Data Hooks 포팅

| Status | Task                                              | Notes / Next Action                                                                                    | Depends On |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------- |
| [ ]    | Query key 모듈 작성                               | `SIGNAL_KEYS`, `AUTH_KEYS`, `PREDICTION_KEYS` 등                                                       | api/client |
| [ ]    | `useSignalDataByNameAndDate`                      | 옵션 시그니처 동일 유지                                                                                | Query keys |
| [ ]    | `useWeeklyActionCount` & `useWeeklyPriceMovement` | -                                                                                                      | Query keys |
| [ ]    | `useMarketNewsSummary` & `useTodaySession`        | -                                                                                                      | Query keys |
| [ ]    | Prediction 관련 훅                                | `usePredictionsForDay`, `useSubmitPrediction`, `useUpdatePrediction`, `useCurrentPrice`, `useEodPrice` | Query keys |
| [ ]    | Consumer-driven contract tests                    | `msw` or `pactum`로 주요 응답 스키마 검증                                                              | 각 훅      |

## Phase 5 · Screens (Strangler 단계 2~3)

### DashboardScreen

- [ ] Stack route `/dashboard` 생성
- [ ] Header + Stats 섹션 (`DashboardStats` hook 연동)
- [ ] Trending/News/Signals/Market 섹션 컴포넌트화
- [ ] Signals 리스트 pagination → filter store page state 연동

### SignalDetailScreen

- [ ] Route params `{symbol, aiModel?, date?}` 정의
- [ ] Info 헤더 + AI 모델 picker + 날짜 picker(bottom sheet)
- [ ] TabView(Overview/Analysis/Market Data/Results)
- [ ] `Predict` CTA → auth 여부에 따른 분기

### PredictionScreen

- [ ] Screen guard (`useTodaySession`, filter date === session day)
- [ ] 실시간/전일가 카드 + 등락률 표시
- [ ] 예측 제출/수정 폼 + Unauthorized 처리

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
