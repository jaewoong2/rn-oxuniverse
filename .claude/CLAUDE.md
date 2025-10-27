# React Native OxUniverse - Claude Code Rules

Project-specific behavioral rules for React Native + Expo development with SuperClaude framework integration.

## Stack Declaration

```
React Native: 0.81.5
Expo SDK: ~54.0
TypeScript: ~5.9.2
Styling: NativeWind 4.2.1 (Tailwind CSS)
Navigation: React Navigation v7 (Native Stack)
State: TanStack Query v5
Storage: AsyncStorage + SecureStore
```

**Existing Patterns**: AppProviders → RootNavigator → Screens | Deep linking via useDeepLinking hook

---

## Priority Rules

** 
1. 작은 단위의 컴포넌트 분리
2. 비즈니스 로직 과 UI 로직의 분리
3. 타입스크립트 적극사용 (any 타입 사용 금지)
4. 무조건 적인 Architecutre 를 깨지 않는 방향으로 개발 할 것
**


### 🔴 CRITICAL (Never Compromise)

**TypeScript Safety**
- Trigger: Any type definition, interface, props
- Rule: NO `any` types | NO `@ts-ignore` | Strict mode enforced
- Action: Use `unknown` + type guards OR define proper types
- Validation: `npx tsc --noEmit` must pass before commit

**Expo API First**
- Trigger: Platform-specific features (camera, storage, linking)
- Rule: ALWAYS check Expo APIs before writing platform-specific code
- Action: Use expo-* packages over react-native-* when available
- Why: Cross-platform consistency + managed workflow compatibility

**Security: Sensitive Data**
- Trigger: Tokens, passwords, API keys, user credentials
- Rule: SecureStore ONLY | Never AsyncStorage for sensitive data
- Action: `import * as SecureStore from 'expo-secure-store'`
- Anti-pattern: ❌ `AsyncStorage.setItem('token', ...)`

**File Structure Enforcement**
- Trigger: Creating new files
- Rule: ALL source code → `src/` subdirectories
- Action: components/ | screens/ | hooks/ | navigation/ | providers/ | services/ | utils/ | types/
- Detection: NO files directly in `src/`, must use subdirectories

**Documentation Organization**
- Trigger: Creating documentation, migration guides, analysis reports
- Rule: Project docs → `docs/` | Claude-specific → `claudedocs/`
- Action: Migration guides, architecture docs, API specs → `docs/` | Analysis, reports, summaries → `claudedocs/`
- Current: `docs/react-native-migration.md` (Web→RN migration blueprint) | `docs/todo-list.md` (Migration task tracker)
- Pattern: Use existing docs as reference for migration decisions

### 🟡 IMPORTANT (Strong Preference)

**NativeWind Over Inline Styles**
- Trigger: Any styling operation
- Rule: `className` prop with Tailwind utilities | NO StyleSheet.create
- Exception: Dynamic styles requiring runtime computation
- Pattern: `<View className="flex-1 bg-white p-4">`

**Component Structure Pattern**
```tsx
// 1. Imports: React → RN → 3rd party → Local
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CustomButton } from '@/components';

// 2. Types
interface Props { ... }

// 3. Component
export function Component({ }: Props) {
  // 3a. Hooks (state → context → custom)
  // 3b. Handlers
  // 3c. Render
}
```

**State Management Selection**
| State Type | Tool | Trigger |
|------------|------|---------|
| Local | `useState` | Component-only state |
| Global | Context + `useContext` | Cross-component sharing |
| Server | TanStack Query | API data, mutations |
| Persistent | AsyncStorage | Non-sensitive |
| Secure | SecureStore | Tokens, credentials |

**Navigation Type Safety**
- Trigger: Creating screens, navigation calls
- Rule: Define `RootStackParamList` types | Use `NativeStackScreenProps`
- Pattern: `type Props = NativeStackScreenProps<RootStackParamList, 'ScreenName'>`

**Deep Linking Centralization**
- Trigger: URL handling, external navigation
- Rule: Use existing `useDeepLinking` hook | NO scattered linking logic
- Location: Already implemented in App.tsx → AppContent

### 🟢 RECOMMENDED (Apply When Practical)

**Naming Conventions**
- Components: `PascalCase.tsx` (UserProfile, LoginButton)
- Hooks: `useCamelCase.ts` (useAuth, useDeepLinking)
- Utils: `camelCase.ts` (formatDate, validateEmail)
- Types: `PascalCase` (User, AuthState, NavigationProps)
- Constants: `UPPER_SNAKE_CASE` (API_BASE_URL)

**Performance Optimization Triggers**
| Scenario | Solution |
|----------|----------|
| Expensive component | `React.memo()` |
| Heavy computation | `useMemo()` |
| Callback props | `useCallback()` |
| Long lists | FlatList, not ScrollView |
| Large imports | Named imports only |

---

## Decision Trees

### 🎯 Styling Decision
```
Need to style component?
├─ Static classes? → className="flex-1 p-4 bg-white"
├─ Dynamic values? → className={`p-${spacing} ${isDark ? 'bg-black' : 'bg-white'}`}
├─ Runtime computed? → className + style={{ width: calculated }}
└─ Animation? → react-native-reanimated + className
```

### 📦 State Management Decision
```
Where to store data?
├─ Component only? → useState
├─ Multiple components? → Context (providers/)
├─ API data? → TanStack Query (useQuery/useMutation)
├─ Persist non-sensitive? → AsyncStorage
└─ Persist sensitive? → SecureStore (🔴 CRITICAL)
```

### 🚀 New Feature Flow
```
Adding new feature?
1. Types first → types/
2. Service logic → services/ (if API involved)
3. Custom hook → hooks/ (if reusable logic)
4. Screen → screens/
5. Navigation → navigation/ (add to RootStackParamList)
6. Provider? → providers/ (if global state needed)
```

### 🔧 File Placement Decision
```
Creating new file?
├─ Reusable UI? → src/components/
├─ Full screen? → src/screens/
├─ Navigation config? → src/navigation/
├─ Reusable logic? → src/hooks/
├─ API calls? → src/services/
├─ Global state? → src/providers/
├─ Helper functions? → src/utils/
├─ Type definitions? → src/types/
├─ Project docs? → docs/ (migration guides, architecture, API specs)
└─ Claude analysis? → claudedocs/ (reports, summaries, findings)
```

### 📚 Documentation Decision
```
Creating documentation?
├─ Migration guide? → docs/react-native-migration.md (update existing)
├─ Task tracking? → docs/todo-list.md (update existing)
├─ Architecture decision? → docs/architecture/
├─ API specification? → docs/api/
├─ Analysis report? → claudedocs/ (Claude-generated insights)
└─ Code review notes? → claudedocs/ (temporary working docs)
```

---

## Anti-Patterns (Immediate Rejection)

| ❌ Wrong | ✅ Right | Why |
|---------|---------|-----|
| `any` types | `unknown` + guards | Type safety |
| `@ts-ignore` | Proper typing | No shortcuts |
| `StyleSheet.create` | `className` | NativeWind consistency |
| Inline styles | Tailwind utilities | Maintainability |
| `AsyncStorage` for tokens | `SecureStore` | 🔴 Security |
| Files in project root | `src/` subdirs | Organization |
| `import * from 'lib'` | Named imports | Bundle size |
| ScrollView + .map() | FlatList | Performance |
| Platform.OS checks | Expo APIs | Cross-platform |
| Scattered linking logic | useDeepLinking hook | Centralization |

---

## Quick Reference

### 📋 Pre-Commit Checklist
- [ ] `npx tsc --noEmit` passes
- [ ] All imports from correct `src/` subdirectories
- [ ] No `any`, `@ts-ignore`, inline styles
- [ ] SecureStore for sensitive data only
- [ ] NativeWind `className` used consistently
- [ ] Navigation types updated if routes changed

### 🔍 Code Review Triggers
- New screen → Check RootStackParamList types
- Storage → SecureStore for sensitive, AsyncStorage otherwise
- Styling → Verify className usage, no StyleSheet
- Platform features → Confirm Expo API usage
- Global state → Verify provider in AppProviders
- Deep linking → Use existing useDeepLinking hook
- Migration decision → Reference `docs/react-native-migration.md` blueprint
- Feature implementation → Update `docs/todo-list.md` progress

### ⚡ Performance Patterns
```tsx
// Expensive component
export const MyComponent = React.memo(({ ... }) => ...);

// Heavy computation
const result = useMemo(() => expensiveCalc(data), [data]);

// Callback to child
const handlePress = useCallback(() => ..., [deps]);

// Long list
<FlatList data={items} renderItem={...} keyExtractor={...} />
```

### 🛡️ Security Checklist
- [ ] Tokens → SecureStore
- [ ] API keys → Environment variables (not hardcoded)
- [ ] User input → Validated + sanitized
- [ ] No sensitive data in logs/console
- [ ] No credentials in git (check .gitignore)

---

## Claude Code Integration

**When Creating Files**: Check decision tree → Place in correct `src/` subdir → Follow naming convention
**When Editing Code**: Match existing patterns → Preserve AppProviders/RootNavigator structure → Maintain type safety
**When Adding Features**: Types first → Service → Hook → Screen → Navigation update → Provider if needed → Update `docs/todo-list.md`
**When Styling**: NativeWind `className` only → Mobile-first responsive → Tailwind scale (p-4, text-lg)
**Migration Decisions**: ALWAYS reference `docs/react-native-migration.md` blueprint → Follow web parity patterns
**Documentation**: Project docs → `docs/` | Claude analysis → `claudedocs/` | Update existing migration/todo docs
**Before Completion**: Run `npx tsc --noEmit` → Verify all rules followed → Check anti-patterns avoided → Update task tracker

**Project Context**: Mobile app migrating from Next.js web app (`predict_stock_react`). Centralized navigation (RootNavigator), global state (AppProviders), deep linking (useDeepLinking), NativeWind styling, TanStack Query for server state. Migration blueprint in `docs/react-native-migration.md` defines web parity requirements and implementation strategy.
