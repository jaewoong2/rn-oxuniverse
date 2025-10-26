# React Native Migration Blueprint (Bamtoly Predict Stock)

<Predict_Stock_React 는 `cd ../predict_stock_react` 디렉토리에서 확인할 수 있습니다.>

본 문서는 `predict_stock_react` (Next.js + TypeScript + Tailwind + TanStack Query) 프로젝트의 구조를 기준으로, 동일한 기능을 React Native 환경에 이식하기 위한 실행 가이드를 제공합니다. 주요 참조 파일은 각 섹션에 병기했으며, RN 구현 시 그대로 따라갈 수 있도록 화면 흐름, 데이터 계층, 전역 상태, 인증, 부가 기능까지 모두 정리했습니다.

## 1. 목표 및 범위

- 현재 운영 중인 3개의 핵심 화면(메인 대시보드, 주식 분석/디테일, 예측)이 RN 앱에서도 동일한 데이터와 UX 제약을 갖도록 한다.
- 웹에서 URL searchParams로 해결하던 전역 상태(날짜·전략 필터 등)를 RN 전용 스토어로 치환하면서도 React Query 캐싱 전략은 유지한다.
- OAuth/매직링크 로그인, 세션 기반 예측 제한, 실시간 시세 조회 등 부가 기능까지 포괄하여 “웹과 기능적으로 동등한” 모바일 앱을 만든다.

## 2. 기존 웹 아키텍처 스냅샷

### 2.1 앱 쉘 & 프로바이더

- `RootLayout`이 React Query → Auth → Dashboard → UI 裝置 순으로 중첩(providers) 구성 (`predict_stock_react/src/app/layout.tsx:1`).
- 글로벌 부가 요소: 로그인 모달, Toaster, `FloatingInfo`, `ConditionalLayout`.
- **RN 대응**: App.tsx에서 동일한 Provider 스택을 구성하되, `ReactQueryProvider`와 `AuthProvider`는 그대로 활용하고 `DashboardProvider`만 RN 전용 구현으로 갈아낀다.

### 2.2 데이터 패칭 레이어

- `services/api.ts`에서 2개의 baseURL(기존 API, O/X API)을 선택하고, 토큰 주입·401 이벤트 브로드캐스트·BaseResponse 파싱을 담당 (`predict_stock_react/src/services/api.ts:1`).
- 각 도메인 서비스(`signalApiService`, `authService`, `priceService` 등)가 공용 fetch 래퍼를 사용 (`predict_stock_react/src/services/signalService.ts:1`).
- **RN 대응**: 동일한 래퍼를 RN fetch/axios로 포팅하고, 토큰 저장소를 Cookie → SecureStore/AsyncStorage로 치환. 401 시 `DeviceEventEmitter` 혹은 zustand store를 통해 로그인 화면 호출.

### 2.3 전역 상태 & URL searchParams

- `useSignalSearchParams`가 `date/q/models/conditions/strategy_type`를 URL과 동기화하며, pagination reset/debounce까지 처리 (`predict_stock_react/src/hooks/useSignalSearchParams.tsx:1`).
- `DashboardProvider`가 해당 훅을 감싸서 Context state와 sync (`predict_stock_react/src/contexts/DashboardProvider.tsx:1`).
- **RN 대응**: URL이 없으므로 `zustand` 혹은 React Context + AsyncStorage 조합으로 동일 key를 관리. 딥링크 공유 대비를 위해 Linking URL을 해석해 store 업데이트.

### 2.4 인증 & 로그인 모달

- `useAuth`가 토큰 보관, React Query 연동, OAuth 콜백 처리, `auth:unauthorized` 이벤트를 담당 (`predict_stock_react/src/hooks/useAuth.tsx:1`).
- `GlobalAuthModal`이 `login=1` query를 감지해 로그인 모달을 띄움 (`predict_stock_react/src/components/auth/GlobalAuthModal.tsx:1`).
- `LoginModal`은 OAuth/Kakao/Apple + 매직링크 + 폴링 UX까지 포함 (`predict_stock_react/src/components/auth/login-modal.tsx:1`).
- **RN 대응**: 로그인은 전용 Stack screen으로 승격하고, OAuth는 WebView/자체 탭 + Linking, 매직링크는 이메일 입력 후 백엔드 동일 API 호출 → `useMyProfile` 폴링 구조 재활용.

## 3. 화면별 기능 분석

### 3.1 메인 대시보드 (`/`)

참조: `predict_stock_react/src/components/ox/dashboard/DashboardPageClient.tsx:1`

- 헤더 + “오늘의 인사이트” 배지, Suspense 기반 Stats/News/Trend skeleton.
- `DashboardStats`, `TrendingPredictionsContainer`, `OxNewsSection`, `DashboardClient`(투자 신호 테이블), `CompactMarketChanges` 등 모듈형 카드들.
- React Query로 모든 카드가 병렬 로딩되며, 필터는 전역 searchParams를 그대로 따름.
- **RN 전략**
  - 상단을 ScrollView Header, 카드 섹션은 `SectionList`로 표현.
  - Skeleton은 `moti` 또는 RN Skia를 이용한 shimmer.
  - Trending/Market 컴포넌트는 공통 `Card` 컴포넌트로 감싸고, 다크모드 색상을 Tailwind 클래스 → `nativewind`/StyleSheet로 대응.

### 3.2 주식 분석 페이지 (`/detail/[symbol]`)

참조: `predict_stock_react/src/components/signal/SignalDetailContent.tsx:1`

- AI 모델 토글(`AiModelSelect`), 날짜 Select → `setParams`로 URL 반영 (line 223).
- 전략/가격/주간동향/차트패턴/시나리오/시장 데이터/실제 결과 등 4개의 탭을 구성 (lines 282-419).
- 예측 버튼은 미로그인 시 로그인 모달 호출, 로그인 시 `/ox/dashboard/predict/[ticker]`로 이동 (line 266).
- **RN 전략**
  - Stack params: `{symbol, aiModel, date, strategyType}`.
  - 날짜 선택은 `@react-native-community/datetimepicker` + 커스텀 bottom sheet.
  - 탭은 `react-native-collapsible-tab-view` 또는 `react-native-tab-view` 활용.
  - 그래프/Badge는 RN 전용 UI kit (e.g., `react-native-svg` + `victory-native`).

### 3.3 예측 흐름 (`/predict/[symbol]` + PredictionModal)

참조: `predict_stock_react/src/app/predict/[symbol]/page.tsx:1`, `src/app/ox/dashboard/predict/[symbol]/PredictSymbolPageClient.tsx:1`, `src/components/ox/predict/PredictionModal.tsx:1`

- 웹에서는 `/predict/[symbol]` route 안에 `PredictionModalOverlay`를 띄우는 구조.
- Modal state:
  - URL date + strategy filter를 가져와 해당 심볼 신호 조회 (line 96).
  - `useTodaySession` 으로 장 상태/거래일 확인, OPEN 상태 + 오늘 날짜만 예측 가능 (lines 111-133).
  - `usePredictionsForDay`로 이미 제출된 예측 여부 확인, `useSubmitPrediction`/`useUpdatePrediction` 사용.
  - 실시간가(`useCurrentPrice`)와 직전 거래일 종가(`useEodPrice`)를 모두 가져와 등락률 표시 (lines 138-200).
  - Unauthorized 시 로그인 강제 (lines 43-56, 134-137).
- **RN 전략**
  - Prediction은 독립 Screen으로 분리, 상단에는 AI 추천 확률/모델, 중단에는 현재가 카드, 하단에는 O/X 버튼.
  - 장 상태, 이미 제출 여부, price diff를 모두 서버 응답으로부터 hydration.
  - 예측 가능 조건 미충족 시 CTA를 disable하고 reason banner 표기.

### 3.4 전역 필터 & 검색 파라미터 기능 (필수)

- 날짜/전략/Ai 모델 조합을 URL에 encode하고, pagination reset + 조건 길이 보정 로직이 존재 (`predict_stock_react/src/hooks/useSignalSearchParams.tsx:57-191`).
- RN에서는 다음 요구를 만족해야 함:
  1. 기본값은 KST 오늘 날짜.
  2. 모델 필터 길이가 1 이하일 땐 conditions 배열을 비운다.
  3. 조건/모델 변경 시 리스트 페이지네이션을 1로 초기화.

### 3.5 추가로 중요한 기능

- **시장 뉴스 & Mahaney 분석**: `useMarketNewsSummary` + `MarketNewsCard`, `MahaneyAnalysisCard`가 detail 탭에서 심볼별 뉴스/분석을 제공 (`predict_stock_react/src/components/signal/SignalDetailContent.tsx:137`, line 416). RN에서도 동일 API를 호출하여 News Carousel + 리포트 카드를 만든다.
- **세션 제한 로직**: `SessionPhase.OPEN`일 때만 예측 가능, 날짜가 오늘인지 검증 (`predict_stock_react/src/components/ox/predict/PredictionModal.tsx:111-133`). 이 제약은 앱에서도 동일하게 강제해야 한다.
- **Unauthorized 처리 파이프라인**: API 401 → `auth:unauthorized` 이벤트 → `useAuth`에서 logout + 로그인 모달 표시 (`predict_stock_react/src/services/api.ts:90`, `src/hooks/useAuth.tsx:164`). RN에서는 이벤트 버스 or zustand action으로 치환.

## 4. React Native 설계 제안

### 4.1 기술 스택

- React Native + Expo(권장) / React Navigation v7 (Stack + BottomTabs or Drawer) / TanStack Query v5 / Zustand (filters, auth UI state) / nativewind / react-hook-form for forms / dayjs.

### 4.2 폴더 구조 초안

```
app/
  navigation/
  screens/
    Dashboard/
    SignalDetail/
    Prediction/
    Auth/
  components/
    cards/
    charts/
    shared/
  hooks/
  providers/
  services/
    api/
    signal/
    auth/
    prediction/
  store/
  utils/
```

- Next 프로젝트 구조를 최대한 유지하여 diff 추적 용이.

### 4.3 프로바이더 & 스토어

- `AppProviders.tsx`: QueryClientProvider → AuthProvider → FilterProvider → ThemeProvider 순.
- AuthProvider: 토큰은 SecureStore, `auth:unauthorized`는 EventEmitter.
- Filter store: zustand + persist 미들웨어, URL 대신 deep-link params를 `Linking.addEventListener('url', ...)`에서 해석.

### 4.4 API 레이어 이식 포인트

- fetch wrapper는 동일 로직: baseURL 선택, token header, UnauthorizedError throw.
- RN에서는 `fetch` 기본 제공. 필요 시 `cross-fetch` 제거.
- 파일 업로드/이미지 필요 시 `expo-file-system` 등 추가 고려.

### 4.5 UI/유틸 공통화

- Card/Badge/Button 컴포넌트를 RN로 재작성하여 웹과 동일한 props를 유지.
- Skeleton, Tabs, Select는 별도 atoms로 구현해 web과 mental model 통일.

## 5. 화면 구현 가이드

### 5.1 DashboardScreen

1. `DashboardScreen` → `useDashboardFilters()` + React Query hooks(DashboardStats, Trending, News).
2. 섹션 분할: Stats, Trending, News, Signals Table, Market Changes.
3. Signals Table은 FlatList + sticky header, pagination 시 filter store의 page state 사용.

### 5.2 SignalDetailScreen

1. route params = symbol, aiModel?, date?
2. `useSignalByNameAndDate` hook을 RN로 포팅하여 SSR initialData 대신 `queryClient.prefetch`로 hydration.
3. Tabs: Overview, Analysis, Market Data, Results (모바일에선 collapsible panels도 고려).
4. 예측 CTA → `navigation.navigate('Prediction', { symbol, aiProbability, aiModel })`.

### 5.3 PredictionScreen

1. Screen focus 시 filter store date/stategy를 읽어 동일 조건으로 신호/가격 데이터 fetch.
2. `useTodaySession` → `SessionPhase` 기반으로 CTA enabled 결정.
3. 이미 예측한 상태면 update mutation UX, 아니면 submit UX. 버튼 라벨/secondary action 분기.
4. Unauthorized error는 try/catch로 잡아 auth store의 `promptLogin()` 호출.

### 5.4 AuthFlowScreen

1. Email 입력 → magic link API 호출 → `useMyProfile`로 폴링 (2초 주기) → 성공 시 대시보드 이동.
2. OAuth → WebBrowser.openAuthSessionAsync (Expo) / CustomTabs → redirect URL을 앱 Scheme으로 연결 후 `useOAuthCallback` 재사용.

## 6. 기능 대응 체크리스트

| 기능                  | 웹 동작 참고                                                                                            | RN 구현 계획                                                          | 상태 |
| --------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---- |
| 전역 날짜/전략 필터   | `useSignalSearchParams` debounce & pagination reset (`src/hooks/useSignalSearchParams.tsx:57`)          | zustand store + deep link parser + pagination reset helper            | ☐    |
| 로그인 & Unauthorized | `useAuth` + `GlobalAuthModal` (`src/hooks/useAuth.tsx:76`, `src/components/auth/GlobalAuthModal.tsx:1`) | SecureStore 기반 AuthProvider + 전용 Login screen + event bus         | ☐    |
| 메인 대시보드 카드    | `DashboardPageClient` 구조 (`src/components/ox/dashboard/DashboardPageClient.tsx:146`)                  | SectionList + Suspense-like skeleton + shared Card kit                | ☐    |
| Signal 상세 탭        | `SignalDetailContent` 탭/CTA (`src/components/signal/SignalDetailContent.tsx:190`)                      | TabView/Collapsible panels + AiModel/date selector + Predict CTA      | ☐    |
| 예측 세션 제약        | Prediction modal session check (`src/components/ox/predict/PredictionModal.tsx:96`)                     | Screen guard: date === today && phase === OPEN, disable CTA otherwise | ☐    |
| 실시간가/전일가       | Prediction modal price fetch (`src/components/ox/predict/PredictionModal.tsx:138`)                      | price hooks 포팅, diff 계산 util 공유                                 | ☐    |
| 뉴스 & 리포트 카드    | Detail 상단 뉴스/마허니 카드 (`src/components/signal/SignalDetailContent.tsx:190`)                      | Carousel + markdown card 컴포넌트                                     | ☐    |

## 7. 단계별 로드맵

1. **환경 세팅**: Expo/React Query/Zustand/NativeWind, API env 분리.
2. **공통 레이어**: API wrapper, AuthProvider, Filter store, Query keys.
3. **대시보드**: Stats → Trend → News → Signal 리스트 순으로 incremental 구축.
4. **디테일 화면**: 기본 정보 → Tabs → 부가 데이터 → 예측 CTA 연동.
5. **예측 화면**: 세션/가격 훅 포팅, Submit/Update mutation 연결.
6. **로그인 흐름**: Magic link + OAuth, Unauthorized 이벤트 파이프라인.
7. **QA & 퍼포먼스**: Skeleton/Placeholder, offline cache, error boundary.

## 8. 리스크 & 오픈 이슈

- OAuth 리다이렉트: 모바일 딥링크 URI 스킴 확보 필요.
- 매직링크 폴링: RN에서는 백그라운드 제약이 있으므로 push notification 혹은 `AppState` 기반 재조회 고려.
- 실시간 시세: API 호출 빈도에 따른 앱 스토어 정책/배터리 고려 → interval vs 서버 push 결정 필요.
- Deep link 공유: 웹의 `?date=...` 패턴을 모바일에서 어떤 방식으로 공유/복원할지 정책 결정.
- 디자인 시스템: Tailwind Token을 RN 스타일로 1:1 대응할 수 있는지, 혹은 figma 기반 재설계가 필요한지 확정 필요.

## 9. 실전 Todo 리스트 (검증된 마이그레이션 패턴 기반)

업계에서 많이 쓰이는 **Strangler Fig**, **feature flag / toggle**, **consumer-driven contract test**, **incremental rollout** 기법을 섞어, 실제 작업 순서대로 체크 가능한 Todo를 정리했습니다. 각 항목은 “웹 기능 패리티”를 유지하면서도 위험도를 줄이는 순서입니다.

### 9.1 파운데이션 & 공통 레이어

1. [ ] Expo + React Navigation + NativeWind 템플릿 생성 (`expo init` → `npx expo install react-native-safe-area-context` 등 필수 패키지).
2. [ ] `.env` 스키마 정의: 기존 `NEXT_PUBLIC_*` 키를 RN용(`EXPO_PUBLIC_*`)으로 맵핑.
3. [ ] `api/client.ts` 작성: `services/api.ts` 로직 포팅 + SecureStore 연동 + 401 이벤트(`DeviceEventEmitter.emit("auth:unauthorized")`).
4. [ ] TanStack Query Provider 구성 (`AppProviders.tsx`) 후 Devtools 연결 (feature flag로 토글).
5. [ ] zustand 기반 `useFilterStore` 초안: date/q/models/conditions/strategyType + pagination, debounce helper 포함.
6. [ ] 공통 UI kit( `Card`, `Badge`, `Button`, `Skeleton`) scaffolding, theme tokens를 상수화.

### 9.2 인증 플로우 (Strangler 단계 1)

1. [ ] `authService` 포팅: login/magic-link/refresh/logout/profile API 래핑.
2. [ ] `AuthProvider` 구현: 토큰 SecureStore persist, `auth:unauthorized` 구독, React Query 캐시 초기화.
3. [ ] Login Stack Screen
   - [ ] 이메일 입력 + magic link 요청 + `useMyProfile` 폴링 로직.
   - [ ] Google/Kakao/Apple OAuth: `expo-auth-session` 또는 CustomTab + Linking scheme, `useOAuthCallback` 재사용.
4. [ ] Feature Flag `authFlowReady`: 완성 전까지 mock user로 대시보드 접근 허용.

### 9.3 필터/검색 파라미터 스토어

1. [ ] `useFilterStore`에 selectors/mutations 정의 (date setter, model toggle, condition auto-fill).
2. [ ] 초기값은 `getTodayKST()` util 재작성 후 store rehydration 시 적용.
3. [ ] pagination reset hook 작성 → 리스트 컴포넌트에서 공통 사용.
4. [ ] Linking listener 추가: 앱이 `myapp://detail?date=...` 링크로 열릴 때 store를 업데이트.

### 9.4 데이터 훅 포팅

1. [ ] Query key 모듈 작성 (`SIGNAL_KEYS`, `AUTH_KEYS`, `PREDICTION_KEYS` 등 기존 구조 유지).
2. [ ] `useSignalDataByNameAndDate`, `useWeeklyActionCount`, `useMarketNewsSummary`, `useWeeklyPriceMovement`, `useTodaySession`, `usePredictionsForDay`, `useCurrentPrice`, `useEodPrice` 차례로 포팅.
3. [ ] 각 훅은 `options`(enabled, initialData) 시그니처를 그대로 유지해 컴포넌트 수정 최소화.
4. [ ] Consumer-driven contract test: `pactum` 혹은 `msw` mock으로 주요 응답 스키마 검증.

### 9.5 화면 단계 (Strangler 단계 2~3)

**DashboardScreen**

- [ ] Stack route `/dashboard`.
- [ ] Header + Stats section: `DashboardStats` hook 연동, shimmer skeleton 적용.
- [ ] Trending/News/Signals/Market 섹션: 각각 FlatList/Carousel 구성, hooks 주입.
- [ ] Infinite scroll or pagination: 필터 store page state와 연동.

**SignalDetailScreen**

- [ ] Route params `{symbol, aiModel?, date?}`.
- [ ] 상단 Info 헤더 + AI 모델 picker + 날짜 picker (bottom sheet date picker).
- [ ] TabView: Overview, Analysis, Market Data, Results. 각 섹션에 해당 hooks 바인딩.
- [ ] `Predict` 버튼: 미로그인 → `AuthModal`, 로그인 → PredictionScreen navigation.

**PredictionScreen**

- [ ] Screen guard: `useTodaySession` + filter date === today === session.trading_day.
- [ ] 현재가 카드(실시간 + 전일), 예측 폼(O/X 버튼).
- [ ] 이미 제출한 예측은 update mutation 경로 노출.
- [ ] Unauthorized catch 시 `AuthProvider.promptLogin()` 호출.

### 9.6 안전 장치 & 배포 전략

1. [ ] Feature flag 레이어(`expo-updates` + remote config) 구성: `newDashboard`, `predictionV2` 등 단계별 롤아웃.
2. [ ] Analytics/Crashlytics 이벤트 매핑 (화면 진입, 예측 제출, 로그인 성공).
3. [ ] E2E 테스트 (Detox) 작성: 로그인 → 대시보드 → 디테일 → 예측 플로우 시나리오.
4. [ ] Beta 배포: Internal testers → firebase app distribution/TestFlight.
5. [ ] Gradual rollout: flag로 신규 화면을 % 단위 활성화, 오류 감지 시 즉시 롤백.

### 9.7 완료 기준 정의 (Definition of Done)

- [ ] `docs/react-native-migration.md` checklist 전 항목 “완료” 체크.
- [ ] 웹/모바일 모두 동일 백엔드 호출로 성공적으로 데이터 패칭.
- [ ] QA에서 발견된 critical bug 0건, major bug 3건 이하.
- [ ] 앱 스토어 심사 제출용 스크린샷/설명 업데이트 완료.

위 Todo 리스트를 기준으로 진행 상황을 추적하면, 흔히 쓰이는 마이그레이션 패턴을 따르면서도 위험을 최소화할 수 있습니다.

---

이 문서를 기준으로 RN 프로젝트(`rn-oxuniverse`)에서 Providers, Hooks, Screens를 순차적으로 구현하면 웹과 동일한 기능 파리티를 달성할 수 있습니다.
