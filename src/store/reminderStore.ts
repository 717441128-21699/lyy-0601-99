import { create } from 'zustand';
import type { Reminder, WhiteNoise, BedtimeItem } from '@/types/sleep';
import { mockReminders, mockWhiteNoises, mockBedtimeItems } from '@/data/mockReminder';
import { generateId } from '@/utils/sleepScore';

interface ReminderStore {
  reminders: Reminder[];
  whiteNoiseList: WhiteNoise[];
  bedtimeItems: BedtimeItem[];
  currentNoise: WhiteNoise | null;
  playingNoise: boolean;
  currentPlayingNoise: WhiteNoise | null;
  breathingExerciseActive: boolean;
  breathingPhase: 'inhale' | 'hold' | 'exhale' | 'rest';

  toggleReminder: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  playNoise: (noise: WhiteNoise) => void;
  stopNoise: () => void;
  playWhiteNoise: (id: string) => void;
  stopWhiteNoise: () => void;

  toggleBedtimeItem: (id: string) => void;
  addBedtimeItem: (item: Omit<BedtimeItem, 'id'>) => void;
  deleteBedtimeItem: (id: string) => void;

  startBreathingExercise: () => void;
  stopBreathingExercise: () => void;
  setBreathingPhase: (phase: 'inhale' | 'hold' | 'exhale' | 'rest') => void;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: mockReminders,
  whiteNoiseList: mockWhiteNoises,
  bedtimeItems: mockBedtimeItems,
  currentNoise: null,
  playingNoise: false,
  currentPlayingNoise: null,
  breathingExerciseActive: false,
  breathingPhase: 'inhale',

  toggleReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    }));
    console.log('[ReminderStore] 切换提醒状态', { id });
  },

  playNoise: (noise) => {
    set({
      currentNoise: noise,
      playingNoise: true,
      whiteNoiseList: get().whiteNoiseList.map((n) => ({
        ...n,
        isPlaying: n.id === noise.id
      }))
    });
    console.log('[ReminderStore] 播放白噪音', { noise: noise.name });
  },

  stopNoise: () => {
    set({
      currentNoise: null,
      playingNoise: false,
      whiteNoiseList: get().whiteNoiseList.map((n) => ({
        ...n,
        isPlaying: false
      }))
    });
    console.log('[ReminderStore] 停止白噪音');
  },

  addReminder: (reminder) => {
    const newReminder: Reminder = {
      ...reminder,
      id: generateId()
    };
    set((state) => ({
      reminders: [...state.reminders, newReminder]
    }));
    console.log('[ReminderStore] 添加提醒', { reminder: newReminder });
  },

  updateReminder: (id, updates) => {
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      )
    }));
    console.log('[ReminderStore] 更新提醒', { id, updates });
  },

  deleteReminder: (id) => {
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id)
    }));
    console.log('[ReminderStore] 删除提醒', { id });
  },

  playWhiteNoise: (id) => {
    const noise = get().whiteNoiseList.find((n) => n.id === id);
    if (noise) {
      set((state) => ({
        whiteNoiseList: state.whiteNoiseList.map((n) => ({
          ...n,
          isPlaying: n.id === id
        })),
        currentPlayingNoise: noise
      }));
      console.log('[ReminderStore] 播放白噪音', { noise: noise.name });
    }
  },

  stopWhiteNoise: () => {
    set((state) => ({
      whiteNoiseList: state.whiteNoiseList.map((n) => ({
        ...n,
        isPlaying: false
      })),
      currentPlayingNoise: null
    }));
    console.log('[ReminderStore] 停止白噪音');
  },

  toggleBedtimeItem: (id) => {
    set((state) => ({
      bedtimeItems: state.bedtimeItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
    console.log('[ReminderStore] 切换睡前清单项目', { id });
  },

  addBedtimeItem: (item) => {
    const newItem: BedtimeItem = {
      ...item,
      id: generateId()
    };
    set((state) => ({
      bedtimeItems: [...state.bedtimeItems, newItem]
    }));
    console.log('[ReminderStore] 添加睡前清单项', { item: newItem });
  },

  deleteBedtimeItem: (id) => {
    set((state) => ({
      bedtimeItems: state.bedtimeItems.filter((item) => item.id !== id)
    }));
    console.log('[ReminderStore] 删除睡前清单项', { id });
  },

  startBreathingExercise: () => {
    set({
      breathingExerciseActive: true,
      breathingPhase: 'inhale'
    });
    console.log('[ReminderStore] 开始呼吸训练');
  },

  stopBreathingExercise: () => {
    set({
      breathingExerciseActive: false,
      breathingPhase: 'inhale'
    });
    console.log('[ReminderStore] 停止呼吸训练');
  },

  setBreathingPhase: (phase) => {
    set({ breathingPhase: phase });
  }
}));
