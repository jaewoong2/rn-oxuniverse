import './global.css';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/providers/AppProviders';
import { RootNavigator } from './src/navigation';

/**
 * App: 최상위 컴포넌트
 * Provider 스택: QueryClient → SafeArea → GestureHandler → Navigation
 *
 * useDeepLinking은 RootNavigator 내부(NavigationContainer 컨텍스트)에서 호출됨
 */
export default function App() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <RootNavigator />
    </AppProviders>
  );
}
