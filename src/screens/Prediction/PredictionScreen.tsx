import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useTodaySession } from '@/hooks/useSession';
import { useCurrentPrice } from '@/hooks/usePrice';
import {
  usePredictionsForDay,
  useSubmitPrediction,
  useUpdatePrediction,
  useRemainingPredictions,
} from '@/hooks/usePrediction';
import { PredictionChoice, isPredictionEditable } from '@/types/prediction';
import { useFilterStore } from '@/store/useFilterStore';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Prediction'>;

export function PredictionScreen({ route, navigation }: Props) {
  const { symbol, date: routeDate } = route.params;
  const storeDate = useFilterStore((state) => state.date);
  const date = routeDate || storeDate;

  const [selectedChoice, setSelectedChoice] = useState<PredictionChoice | null>(null);

  const { data: session, isLoading: sessionLoading } = useTodaySession();
  const { data: priceData, isLoading: priceLoading } = useCurrentPrice(symbol);
  const { data: predictions, isLoading: predictionsLoading } = usePredictionsForDay(date);
  const { data: remainingSlots, isLoading: remainingLoading } = useRemainingPredictions(date);

  const submitPredictionMutation = useSubmitPrediction();
  const updatePredictionMutation = useUpdatePrediction();

  // 이미 예측한 경우 찾기
  const existingPrediction = predictions?.predictions.find((p) => p.symbol === symbol);

  if (sessionLoading || priceLoading || predictionsLoading || remainingLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  // 세션 체크
  if (!session?.session || session.session.phase !== 'OPEN') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="mb-2 text-center text-xl font-bold text-gray-900">
          Session Closed
        </Text>
        <Text className="mb-6 text-center text-gray-600">
          {session?.market_status.message || 'Prediction session is currently closed'}
        </Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  // 남은 슬롯 체크 (기존 예측 수정은 가능)
  if (!existingPrediction && remainingSlots === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="mb-2 text-center text-xl font-bold text-gray-900">
          No Slots Remaining
        </Text>
        <Text className="mb-6 text-center text-gray-600">
          You have used all your prediction slots for today.
        </Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (!selectedChoice) {
      Alert.alert('Error', 'Please select UP or DOWN');
      return;
    }

    try {
      if (existingPrediction && isPredictionEditable(existingPrediction.status)) {
        // 기존 예측 수정
        await updatePredictionMutation.mutateAsync({
          predictionId: existingPrediction.id,
          choice: selectedChoice,
        });
        Alert.alert('Success', 'Prediction updated successfully!');
      } else {
        // 새 예측 제출
        await submitPredictionMutation.mutateAsync({
          symbol,
          choice: selectedChoice,
        });
        Alert.alert('Success', 'Prediction submitted successfully!');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit prediction');
    }
  };

  const isSubmitting = submitPredictionMutation.isPending || updatePredictionMutation.isPending;
  const canEdit = existingPrediction
    ? isPredictionEditable(existingPrediction.status)
    : true;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">{symbol}</Text>
          <Text className="mt-1 text-sm text-gray-600">
            {existingPrediction ? 'Update Your Prediction' : 'Make a Prediction'}
          </Text>
        </View>

        {/* Current Price */}
        {priceData && (
          <Card className="mb-6 bg-white">
            <Text className="mb-3 text-sm font-semibold text-gray-700">Current Price</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-gray-900">
                ${priceData.price.current_price.toFixed(2)}
              </Text>
              <Badge
                variant={priceData.price.change >= 0 ? 'success' : 'error'}
                className="px-4 py-2"
              >
                {priceData.price.change >= 0 ? '+' : ''}
                {priceData.price.change_percent.toFixed(2)}%
              </Badge>
            </View>
            <Text className="mt-2 text-xs text-gray-500">
              Previous Close: ${priceData.price.previous_close.toFixed(2)}
            </Text>
          </Card>
        )}

        {/* Remaining Slots */}
        <Card className="mb-6 bg-blue-50">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-blue-900">Remaining Predictions</Text>
            <Text className="text-2xl font-bold text-blue-600">{remainingSlots}</Text>
          </View>
        </Card>

        {/* Existing Prediction Info */}
        {existingPrediction && (
          <Card className="mb-6 bg-yellow-50">
            <Text className="mb-2 text-sm font-semibold text-yellow-900">
              Existing Prediction
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700">
                Current Choice: {existingPrediction.choice === 'UP' ? '⬆️ Up' : '⬇️ Down'}
              </Text>
              <Badge
                variant={
                  existingPrediction.status === 'PENDING' ? 'default' : 'success'
                }
              >
                {existingPrediction.status}
              </Badge>
            </View>
            {!canEdit && (
              <Text className="mt-2 text-xs text-yellow-800">
                This prediction can no longer be edited.
              </Text>
            )}
          </Card>
        )}

        {/* Prediction Choices */}
        {canEdit && (
          <>
            <Text className="mb-4 text-lg font-semibold text-gray-900">
              Your Prediction
            </Text>
            <View className="mb-6 gap-3">
              <Button
                variant={
                  selectedChoice === PredictionChoice.UP ? 'primary' : 'outline'
                }
                onPress={() => setSelectedChoice(PredictionChoice.UP)}
                size="lg"
                className={
                  selectedChoice === PredictionChoice.UP
                    ? 'bg-green-600'
                    : 'border-green-600'
                }
              >
                <Text
                  className={`text-lg font-bold ${selectedChoice === PredictionChoice.UP ? 'text-white' : 'text-green-600'}`}
                >
                  ⬆️ UP - Price will go up
                </Text>
              </Button>
              <Button
                variant={
                  selectedChoice === PredictionChoice.DOWN ? 'primary' : 'outline'
                }
                onPress={() => setSelectedChoice(PredictionChoice.DOWN)}
                size="lg"
                className={
                  selectedChoice === PredictionChoice.DOWN
                    ? 'bg-red-600'
                    : 'border-red-600'
                }
              >
                <Text
                  className={`text-lg font-bold ${selectedChoice === PredictionChoice.DOWN ? 'text-white' : 'text-red-600'}`}
                >
                  ⬇️ DOWN - Price will go down
                </Text>
              </Button>
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleSubmit}
              disabled={!selectedChoice || isSubmitting}
              size="lg"
              className="mb-6"
            >
              {isSubmitting
                ? 'Submitting...'
                : existingPrediction
                  ? 'Update Prediction'
                  : 'Submit Prediction'}
            </Button>
          </>
        )}

        {/* Info Card */}
        <Card className="bg-gray-100">
          <Text className="mb-2 text-sm font-semibold text-gray-900">
            How it works
          </Text>
          <Text className="leading-6 text-gray-700">
            • Predict whether the price will go UP or DOWN{'\n'}
            • Predictions are locked when the session closes{'\n'}
            • Earn points for correct predictions{'\n'}
            • You can update your prediction before the session closes
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
