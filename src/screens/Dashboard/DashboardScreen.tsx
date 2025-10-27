import React from 'react';
import { View, ScrollView, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { useTodaySession } from '@/hooks/useSession';
import { usePredictionStats, usePredictionsForDay } from '@/hooks/usePrediction';
import { useAuth } from '@/providers/AuthProvider';
import { useFilterStore } from '@/store/useFilterStore';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';

export function DashboardScreen() {
  const { isAuthenticated, user } = useAuth();
  const date = useFilterStore((state) => state.date);

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useTodaySession();
  const {
    data: predictions,
    isLoading: predictionsLoading,
    refetch: refetchPredictions,
  } = usePredictionsForDay(date);
  const { data: stats, isLoading: statsLoading } = usePredictionStats();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSession(), refetchPredictions()]);
    setRefreshing(false);
  }, [refetchSession, refetchPredictions]);

  if (sessionLoading || predictionsLoading || statsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </Text>
          <Text className="mt-1 text-sm text-gray-600">
            {session?.market_status.is_trading_day
              ? 'Market is open for predictions'
              : session?.market_status.message}
          </Text>
        </View>

        {/* Session Status */}
        {session && (
          <Card className="mb-6 bg-white">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600">Session Status</Text>
                <Text className="mt-1 text-lg font-semibold text-gray-900">
                  {session.session?.phase === 'OPEN' ? 'Active' : 'Closed'}
                </Text>
              </View>
              <Badge variant={session.session?.phase === 'OPEN' ? 'success' : 'default'}>
                {session.session?.phase === 'OPEN' ? 'OPEN' : 'CLOSED'}
              </Badge>
            </View>
          </Card>
        )}

        {/* Stats Grid */}
        {isAuthenticated && stats && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">Your Statistics</Text>
            <View className="flex-row gap-3">
              <Card className="flex-1 bg-white">
                <Text className="text-sm text-gray-600">Total Predictions</Text>
                <Text className="mt-1 text-2xl font-bold text-gray-900">
                  {stats.total_predictions}
                </Text>
              </Card>
              <Card className="flex-1 bg-white">
                <Text className="text-sm text-gray-600">Accuracy</Text>
                <Text className="mt-1 text-2xl font-bold text-green-600">
                  {stats.accuracy_rate.toFixed(1)}%
                </Text>
              </Card>
            </View>
            <View className="mt-3 flex-row gap-3">
              <Card className="flex-1 bg-white">
                <Text className="text-sm text-gray-600">Correct</Text>
                <Text className="mt-1 text-xl font-bold text-green-600">
                  {stats.correct_predictions}
                </Text>
              </Card>
              <Card className="flex-1 bg-white">
                <Text className="text-sm text-gray-600">Incorrect</Text>
                <Text className="mt-1 text-xl font-bold text-red-600">
                  {stats.incorrect_predictions}
                </Text>
              </Card>
              <Card className="flex-1 bg-white">
                <Text className="text-sm text-gray-600">Net Points</Text>
                <Text
                  className={`mt-1 text-xl font-bold ${stats.net_points >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stats.net_points >= 0 ? '+' : ''}
                  {stats.net_points}
                </Text>
              </Card>
            </View>
          </View>
        )}

        {/* Today's Predictions */}
        {isAuthenticated && predictions && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              Today's Predictions ({predictions.predictions.length}/{predictions.total_predictions})
            </Text>
            {predictions.predictions.length === 0 ? (
              <Card className="bg-white">
                <Text className="text-center text-gray-600">
                  No predictions yet for today. Start making predictions!
                </Text>
              </Card>
            ) : (
              <View className="gap-3">
                {predictions.predictions.map((prediction) => (
                  <Card key={prediction.id} className="bg-white">
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-base font-semibold text-gray-900">
                          {prediction.symbol}
                        </Text>
                        <Text className="mt-1 text-sm text-gray-600">
                          Choice: {prediction.choice === 'UP' ? '⬆️ Up' : '⬇️ Down'}
                        </Text>
                      </View>
                      <Badge
                        variant={
                          prediction.status === 'CORRECT'
                            ? 'success'
                            : prediction.status === 'INCORRECT'
                              ? 'error'
                              : 'default'
                        }
                      >
                        {prediction.status}
                      </Badge>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        <View className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-gray-900">Quick Actions</Text>
          <Card className="bg-white">
            <Text className="text-center text-blue-600">View All Signals →</Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
