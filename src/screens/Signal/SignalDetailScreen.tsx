import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useSignalDataByNameAndDate } from '@/hooks/useSignal';
import { useCurrentPrice } from '@/hooks/usePrice';
import { useFilterStore } from '@/store/useFilterStore';
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'SignalDetail'>;

export function SignalDetailScreen({ route, navigation }: Props) {
  const { symbol, date: routeDate } = route.params;
  const storeDate = useFilterStore((state) => state.date);
  const date = routeDate || storeDate;

  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const {
    data: signalsData,
    isLoading: signalsLoading,
    error: signalsError,
  } = useSignalDataByNameAndDate([symbol], date);

  const { data: priceData, isLoading: priceLoading } = useCurrentPrice(symbol);

  const signals = signalsData?.signals || [];
  const currentSignal = selectedModel
    ? signals.find((s) => s.signal.ai_model === selectedModel)
    : signals[0];

  if (signalsLoading || priceLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading Signal Details...</Text>
      </View>
    );
  }

  if (signalsError || signals.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-center text-lg text-gray-900">
          No signal data available for {symbol}
        </Text>
        <Button onPress={() => navigation.goBack()} className="mt-4">
          Go Back
        </Button>
      </View>
    );
  }

  const handlePredictPress = () => {
    navigation.navigate('Prediction', { symbol, date });
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">{symbol}</Text>
          <Text className="mt-1 text-sm text-gray-600">
            {currentSignal?.ticker?.name || 'Signal Details'}
          </Text>
        </View>

        {/* Current Price */}
        {priceData && (
          <Card className="mb-6 bg-white">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-600">Current Price</Text>
                <Text className="mt-1 text-2xl font-bold text-gray-900">
                  ${priceData.price.current_price.toFixed(2)}
                </Text>
              </View>
              <Badge
                variant={priceData.price.change >= 0 ? 'success' : 'error'}
                className="px-3 py-1"
              >
                {priceData.price.change >= 0 ? '+' : ''}
                {priceData.price.change_percent.toFixed(2)}%
              </Badge>
            </View>
          </Card>
        )}

        {/* AI Model Selector */}
        {signals.length > 1 && (
          <View className="mb-6">
            <Text className="mb-3 text-sm font-semibold text-gray-700">Select AI Model</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {signals.map((signalData) => (
                <TouchableOpacity
                  key={signalData.signal.ai_model}
                  onPress={() => setSelectedModel(signalData.signal.ai_model || null)}
                  className={`mr-2 rounded-lg px-4 py-2 ${
                    (selectedModel || signals[0].signal.ai_model) ===
                    signalData.signal.ai_model
                      ? 'bg-blue-600'
                      : 'bg-white'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      (selectedModel || signals[0].signal.ai_model) ===
                      signalData.signal.ai_model
                        ? 'text-white'
                        : 'text-gray-900'
                    }`}
                  >
                    {signalData.signal.ai_model || 'Unknown'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Signal Overview */}
        {currentSignal && (
          <>
            <Card className="mb-6 bg-white">
              <Text className="mb-4 text-lg font-semibold text-gray-900">Overview</Text>
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Action</Text>
                  <Badge variant={currentSignal.signal.action === 'Buy' ? 'success' : 'error'}>
                    {currentSignal.signal.action || 'N/A'}
                  </Badge>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Entry Price</Text>
                  <Text className="font-semibold text-gray-900">
                    ${currentSignal.signal.entry_price?.toFixed(2) || 'N/A'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Stop Loss</Text>
                  <Text className="font-semibold text-red-600">
                    ${currentSignal.signal.stop_loss?.toFixed(2) || 'N/A'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Take Profit</Text>
                  <Text className="font-semibold text-green-600">
                    ${currentSignal.signal.take_profit?.toFixed(2) || 'N/A'}
                  </Text>
                </View>
                {currentSignal.signal.probability && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Probability</Text>
                    <Text className="font-semibold text-gray-900">
                      {currentSignal.signal.probability}
                    </Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Analysis */}
            {currentSignal.signal.report_summary && (
              <Card className="mb-6 bg-white">
                <Text className="mb-3 text-lg font-semibold text-gray-900">Analysis</Text>
                <Text className="leading-6 text-gray-700">
                  {currentSignal.signal.report_summary}
                </Text>
              </Card>
            )}

            {/* Good & Bad Things */}
            <View className="mb-6 gap-3">
              {currentSignal.signal.good_things && (
                <Card className="bg-green-50">
                  <Text className="mb-2 text-sm font-semibold text-green-900">
                    ✅ Positive Factors
                  </Text>
                  <Text className="leading-6 text-green-800">
                    {currentSignal.signal.good_things}
                  </Text>
                </Card>
              )}
              {currentSignal.signal.bad_things && (
                <Card className="bg-red-50">
                  <Text className="mb-2 text-sm font-semibold text-red-900">
                    ⚠️ Risk Factors
                  </Text>
                  <Text className="leading-6 text-red-800">
                    {currentSignal.signal.bad_things}
                  </Text>
                </Card>
              )}
            </View>
          </>
        )}

        {/* CTA Button */}
        <Button onPress={handlePredictPress} className="mb-6" size="lg">
          Make a Prediction
        </Button>
      </View>
    </ScrollView>
  );
}
