import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation';
import { AppProviders } from './src/providers/AppProviders';
import { useDeepLinking } from './src/hooks/useDeepLinking';

function AppContent() {
  // Deep linking 초기화
  useDeepLinking();

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
