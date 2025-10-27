import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTodayKST } from '@/utils/date';

/**
 * Filter 상태 타입
 */
export interface FilterState {
  // Filter 값
  date: string;
  q: string | null;
  models: string[];
  conditions: ('OR' | 'AND')[];
  strategy_type: string | null;

  // Pagination
  page: number;
  pageSize: number;

  // Actions
  setDate: (date: string) => void;
  setQuery: (q: string | null) => void;
  setModels: (models: string[]) => void;
  setConditions: (conditions: ('OR' | 'AND')[]) => void;
  setStrategyType: (strategyType: string | null) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Batch update
  setFilters: (filters: Partial<FilterState>) => void;

  // Reset
  resetFilters: () => void;
  resetPagination: () => void;
}

/**
 * 초기 상태
 */
const initialState = {
  date: getTodayKST(),
  q: null,
  models: [],
  conditions: [],
  strategy_type: null,
  page: 1,
  pageSize: 20,
};

/**
 * Filter Store
 * AsyncStorage를 사용한 persist 적용
 */
export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDate: (date) => {
        set({ date });
        // 날짜 변경 시 pagination reset
        get().resetPagination();
      },

      setQuery: (q) => {
        set({ q });
        // 검색어 변경 시 pagination reset
        get().resetPagination();
      },

      setModels: (models) => {
        const state = get();

        // 모델이 1개 이하면 conditions 비우기
        if (models.length <= 1) {
          set({ models, conditions: [] });
        } else {
          // 모델 개수에 맞게 conditions 조정
          const newConditions = [...state.conditions];
          const requiredLength = models.length - 1;

          if (newConditions.length < requiredLength) {
            // 부족하면 'OR'로 채우기
            const fill = state.conditions[0] || 'OR';
            while (newConditions.length < requiredLength) {
              newConditions.push(fill);
            }
          } else if (newConditions.length > requiredLength) {
            // 초과하면 자르기
            newConditions.length = requiredLength;
          }

          set({ models, conditions: newConditions });
        }

        // 모델 변경 시 pagination reset
        get().resetPagination();
      },

      setConditions: (conditions) => {
        set({ conditions });
      },

      setStrategyType: (strategy_type) => {
        set({ strategy_type });
        // 전략 타입 변경 시 pagination reset
        get().resetPagination();
      },

      setPage: (page) => {
        set({ page });
      },

      setPageSize: (pageSize) => {
        set({ pageSize, page: 1 }); // pageSize 변경 시 page는 1로
      },

      setFilters: (filters) => {
        set(filters);
      },

      resetFilters: () => {
        set({
          ...initialState,
          date: getTodayKST(), // 항상 최신 날짜로
        });
      },

      resetPagination: () => {
        set({ page: 1 });
      },
    }),
    {
      name: 'filter-storage', // AsyncStorage 키
      storage: createJSONStorage(() => AsyncStorage),
      // persist할 필드만 선택 (date는 항상 오늘 날짜로 초기화하므로 제외)
      partialize: (state) => ({
        q: state.q,
        models: state.models,
        conditions: state.conditions,
        strategy_type: state.strategy_type,
        pageSize: state.pageSize,
      }),
    }
  )
);

/**
 * Debounced filter update hook
 */
let debounceTimer: NodeJS.Timeout | null = null;

export const useDebouncedFilterUpdate = () => {
  const store = useFilterStore();

  return (filters: Partial<FilterState>, delay = 500) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      store.setFilters(filters);
      debounceTimer = null;
    }, delay);
  };
};

/**
 * Filter 상태를 URL query string으로 변환
 */
export function filterStateToQueryString(state: FilterState): string {
  const params = new URLSearchParams();

  if (state.date) params.set('date', state.date);
  if (state.q) params.set('q', state.q);
  if (state.models.length > 0) params.set('models', state.models.join(','));
  if (state.conditions.length > 0)
    params.set('condition', state.conditions.join(','));
  if (state.strategy_type) params.set('strategy_type', state.strategy_type);

  return params.toString();
}

/**
 * URL query string을 Filter 상태로 파싱
 */
export function queryStringToFilterState(
  queryString: string
): Partial<FilterState> {
  const params = new URLSearchParams(queryString);
  const filters: Partial<FilterState> = {};

  const date = params.get('date');
  if (date) filters.date = date;

  const q = params.get('q');
  if (q) filters.q = q;

  const modelsParam = params.get('models');
  if (modelsParam) filters.models = modelsParam.split(',').filter(Boolean);

  const conditionParam = params.get('condition');
  if (conditionParam) {
    filters.conditions = conditionParam
      .split(',')
      .filter(Boolean)
      .map((c) => (c === 'AND' ? 'AND' : 'OR'));
  }

  const strategyType = params.get('strategy_type');
  if (strategyType) filters.strategy_type = strategyType;

  return filters;
}
