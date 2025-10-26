# Bamtoly RN Mobile

React Native (Expo) scaffold for migrating the Next.js + TanStack Query web experience (`predict_stock_react`) into a fully native app. This project follows the migration blueprint in `../docs/react-native-migration.md` and tracks execution steps via `../docs/todo-list.md`.

## Stack
- Expo SDK 54 (React Native 0.81)
- TypeScript
- React Navigation (native stack)
- @tanstack/react-query
- Zustand (global filters)
- NativeWind/Tailwind (design tokens + utility styling)
- Expo SecureStore / AsyncStorage for persistence

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and adjust API endpoints if needed:
   ```bash
   cp .env.example .env
   ```
3. Run the dev server:
   ```bash
   npm run start   # QR for Expo Go / web preview
   npm run ios     # open iOS simulator
   npm run android # open Android emulator
   ```

## Project Structure
```
mobile/
  src/
    components/ui     # Card, Badge, Button primitives
    navigation        # Root navigator + screens
    providers         # App-wide providers (React Query, SafeArea, etc.)
    services/api      # API clients
    store             # zustand stores (filters, auth later)
    theme             # color tokens
    utils             # env/date helpers
  App.tsx             # entry mounting providers + navigator
```

## Development Workflow
- Use `docs/react-native-migration.md` for architecture guidance.
- Update `docs/todo-list.md` after completing a task to keep progress visible.
- Stick to Expo-compatible packages; prefer `npx expo install` when a package has native deps.
- For authentication features, wire them through `src/services/api/client.ts` so SecureStore + 401 handling remain consistent.

## Next Steps
Refer to Phase 2+ items in `docs/todo-list.md` (Auth layer, filter enhancements, React Query hooks, screens). Keep README updated as major modules land.
# rn-oxuniverse
