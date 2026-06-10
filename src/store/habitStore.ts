import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Habit } from '@/types/sleep';
import { mockHabits } from '@/data/mockHabit';
import { generateId } from '@/utils/sleepScore';
import dayjs from 'dayjs';

const STORAGE_KEY = 'sleep_habits';

const loadFromStorage = (): Habit[] => {
  try {
    const data = Taro.getStorageSync(STORAGE_KEY);
    if (data) {
      return JSON.parse(data) as Habit[];
    }
  } catch (e) {
    console.warn('[HabitStore] 加载习惯数据失败', e);
  }
  return mockHabits;
};

const saveToStorage = (habits: Habit[]): void => {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.warn('[HabitStore] 保存习惯数据失败', e);
  }
};

interface HabitStore {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'currentStreak' | 'longestStreak' | 'completionRecords' | 'enabled'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  toggleHabit: (id: string) => void;
  checkInHabit: (id: string) => void;
  getTodayCompleted: () => number;
  getTotalHabits: () => number;
  getTotalCheckIns: () => number;
}

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: loadFromStorage(),

  addHabit: (habitData) => {
    const newHabit: Habit = {
      ...habitData,
      id: generateId(),
      currentStreak: 0,
      longestStreak: 0,
      completionRecords: [],
      enabled: true
    };

    set((state) => {
      const newHabits = [...state.habits, newHabit];
      saveToStorage(newHabits);
      return { habits: newHabits };
    });

    console.log('[HabitStore] 新增习惯', { habit: newHabit });
    Taro.showToast({ title: '习惯创建成功', icon: 'success' });
  },

  updateHabit: (id, updates) => {
    set((state) => {
      const newHabits = state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      );
      saveToStorage(newHabits);
      return { habits: newHabits };
    });
    console.log('[HabitStore] 更新习惯', { id, updates });
  },

  deleteHabit: (id) => {
    set((state) => {
      const newHabits = state.habits.filter((h) => h.id !== id);
      saveToStorage(newHabits);
      return { habits: newHabits };
    });
    console.log('[HabitStore] 删除习惯', { id });
  },

  toggleHabit: (id) => {
    set((state) => {
      const newHabits = state.habits.map((h) =>
        h.id === id ? { ...h, enabled: !h.enabled } : h
      );
      saveToStorage(newHabits);
      return { habits: newHabits };
    });
    console.log('[HabitStore] 切换习惯状态', { id });
  },

  checkInHabit: (id) => {
    const today = dayjs().format('YYYY-MM-DD');
    
    set((state) => {
      const newHabits = state.habits.map((h) => {
        if (h.id !== id) return h;

        const alreadyChecked = h.completionRecords.includes(today);
        let newRecords = [...h.completionRecords];
        let newCurrentStreak = h.currentStreak;
        let newLongestStreak = h.longestStreak;

        if (alreadyChecked) {
          newRecords = newRecords.filter((d) => d !== today);
          newCurrentStreak = Math.max(0, newCurrentStreak - 1);
        } else {
          newRecords.push(today);
          
          const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
          if (h.completionRecords.includes(yesterday)) {
            newCurrentStreak = h.currentStreak + 1;
          } else {
            newCurrentStreak = 1;
          }
          
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
        }

        return {
          ...h,
          completionRecords: newRecords,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak
        };
      });

      saveToStorage(newHabits);
      return { habits: newHabits };
    });

    const habit = get().habits.find((h) => h.id === id);
    const isChecked = habit?.completionRecords.includes(today);
    console.log('[HabitStore] 习惯打卡', { id, name: habit?.name, checked: isChecked });
    
    if (isChecked) {
      Taro.showToast({ title: '打卡成功！', icon: 'success' });
      if (habit?.currentStreak && habit.currentStreak > 1) {
        setTimeout(() => {
          Taro.showToast({ title: `已连续${habit.currentStreak}天`, icon: 'none' });
        }, 1500);
      }
    } else {
      Taro.showToast({ title: '已取消打卡', icon: 'none' });
    }
  },

  getTodayCompleted: () => {
    const today = dayjs().format('YYYY-MM-DD');
    return get().habits.filter((h) => h.completionRecords.includes(today)).length;
  },

  getTotalHabits: () => {
    return get().habits.length;
  },

  getTotalCheckIns: () => {
    return get().habits.reduce((acc, h) => acc + h.completionRecords.length, 0);
  }
}));
