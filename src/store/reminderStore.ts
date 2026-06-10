import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { Reminder, WhiteNoise, BedtimeItem } from '@/types/sleep';
import { mockReminders, mockWhiteNoises, mockBedtimeItems } from '@/data/mockReminder';
import { generateId } from '@/utils/sleepScore';
import dayjs from 'dayjs';

const STORAGE_KEYS = {
  REMINDERS: 'sleep_reminders',
  BEDTIME_ITEMS: 'sleep_bedtime_items',
  HABITS: 'sleep_habits'
};

const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data) {
      return JSON.parse(data) as T;
    }
  } catch (e) {
    console.warn('[Storage] 加载数据失败', key, e);
  }
  return defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch (e) {
    console.warn('[Storage] 保存数据失败', key, e);
  }
};

let audioContext: Taro.InnerAudioContext | null = null;
let reminderCheckInterval: ReturnType<typeof setInterval> | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = Taro.createInnerAudioContext();
    audioContext.loop = true;
  }
  return audioContext;
};

const NOISE_SOURCES: Record<string, string> = {
  'rain': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1b46b88d67.mp3?filename=rain-on-umbrella-111700.mp3',
  'ocean': 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_3b5e4f74e7.mp3?filename=sea-waves-111324.mp3',
  'forest': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_7b3d89b17c.mp3?filename=forest-birds-ambient-111835.mp3',
  'fire': 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_2dde668ca6.mp3?filename=campfire-crackling-118369.mp3',
  'wind': 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_f62bd2e4f1.mp3?filename=howling-wind-118659.mp3',
  'meditation': 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73463.mp3?filename=meditation-background-111834.mp3'
};

const triggerNotification = (reminder: Reminder) => {
  try {
    if (Taro.showModal) {
      Taro.showModal({
        title: reminder.title,
        content: reminder.description || '该睡觉啦！保持良好的作息习惯哦~',
        showCancel: true,
        confirmText: '知道了',
        cancelText: '稍后提醒',
        success: (res) => {
          if (res.confirm) {
            console.log('[Reminder] 用户确认提醒', reminder.id);
          }
        }
      });
    }

    if (Taro.vibrateShort) {
      Taro.vibrateShort({ type: 'medium' });
    }

    console.log('[Reminder] 触发提醒', {
      id: reminder.id,
      type: reminder.type,
      title: reminder.title,
      time: reminder.time
    });
  } catch (e) {
    console.warn('[Reminder] 提醒触发失败', e);
  }
};

const startReminderCheck = (getReminders: () => Reminder[]) => {
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
  }

  const triggeredToday = new Set<string>();

  reminderCheckInterval = setInterval(() => {
    const now = dayjs();
    const currentTime = now.format('HH:mm');
    const today = now.format('YYYY-MM-DD');
    const dayOfWeek = '周' + ['日', '一', '二', '三', '四', '五', '六'][now.day()];

    const reminders = getReminders();
    reminders.forEach(reminder => {
      if (!reminder.enabled) return;

      const triggerKey = `${reminder.id}_${today}`;
      if (triggeredToday.has(triggerKey)) return;

      const timeMatch = reminder.time === currentTime;
      const repeatMatch = reminder.repeat.length === 0 || reminder.repeat.includes(dayOfWeek);

      if (timeMatch && repeatMatch) {
        triggeredToday.add(triggerKey);
        triggerNotification(reminder);
      }
    });
  }, 30000);

  console.log('[Reminder] 提醒检查已启动');
};

interface ReminderStore {
  reminders: Reminder[];
  whiteNoiseList: WhiteNoise[];
  bedtimeItems: BedtimeItem[];
  currentNoise: WhiteNoise | null;
  playingNoise: boolean;
  currentPlayingNoise: WhiteNoise | null;
  volume: number;
  breathingExerciseActive: boolean;
  breathingPhase: 'inhale' | 'hold' | 'exhale' | 'rest';

  init: () => void;
  toggleReminder: (id: string) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;

  playNoise: (noise: WhiteNoise) => void;
  stopNoise: () => void;
  setVolume: (volume: number) => void;
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
  reminders: loadFromStorage<Reminder[]>(STORAGE_KEYS.REMINDERS, mockReminders),
  whiteNoiseList: mockWhiteNoises,
  bedtimeItems: loadFromStorage<BedtimeItem[]>(STORAGE_KEYS.BEDTIME_ITEMS, mockBedtimeItems),
  currentNoise: null,
  playingNoise: false,
  currentPlayingNoise: null,
  volume: 50,
  breathingExerciseActive: false,
  breathingPhase: 'inhale',

  init: () => {
    startReminderCheck(() => get().reminders);
    console.log('[ReminderStore] 初始化完成');
  },

  toggleReminder: (id) => {
    set((state) => {
      const newReminders = state.reminders.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      );
      saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
      return { reminders: newReminders };
    });
    console.log('[ReminderStore] 切换提醒状态', { id });
  },

  playNoise: (noise) => {
    try {
      const audio = getAudioContext();
      const src = NOISE_SOURCES[noise.id] || NOISE_SOURCES.rain;
      
      if (get().playingNoise && get().currentNoise?.id === noise.id) {
        audio.pause();
        set({
          playingNoise: false,
          whiteNoiseList: get().whiteNoiseList.map((n) => ({
            ...n,
            isPlaying: false
          }))
        });
        console.log('[ReminderStore] 暂停白噪音', { noise: noise.name });
        return;
      }

      audio.src = src;
      audio.volume = get().volume / 100;
      audio.play();

      set({
        currentNoise: noise,
        playingNoise: true,
        whiteNoiseList: get().whiteNoiseList.map((n) => ({
          ...n,
          isPlaying: n.id === noise.id
        }))
      });
      console.log('[ReminderStore] 播放白噪音', { noise: noise.name, src });
    } catch (e) {
      console.warn('[ReminderStore] 播放白噪音失败', e);
      Taro.showToast({ title: '播放失败，请稍后重试', icon: 'none' });
    }
  },

  stopNoise: () => {
    try {
      if (audioContext) {
        audioContext.stop();
      }
    } catch (e) {
      console.warn('[ReminderStore] 停止音频失败', e);
    }
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

  setVolume: (volume) => {
    try {
      if (audioContext) {
        audioContext.volume = volume / 100;
      }
    } catch (e) {
      console.warn('[ReminderStore] 设置音量失败', e);
    }
    set({ volume });
    console.log('[ReminderStore] 设置音量', { volume });
  },

  addReminder: (reminder) => {
    const newReminder: Reminder = {
      ...reminder,
      id: generateId()
    };
    set((state) => {
      const newReminders = [...state.reminders, newReminder];
      saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
      return { reminders: newReminders };
    });
    console.log('[ReminderStore] 添加提醒', { reminder: newReminder });
  },

  updateReminder: (id, updates) => {
    set((state) => {
      const newReminders = state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
      return { reminders: newReminders };
    });
    console.log('[ReminderStore] 更新提醒', { id, updates });
  },

  deleteReminder: (id) => {
    set((state) => {
      const newReminders = state.reminders.filter((r) => r.id !== id);
      saveToStorage(STORAGE_KEYS.REMINDERS, newReminders);
      return { reminders: newReminders };
    });
    console.log('[ReminderStore] 删除提醒', { id });
  },

  playWhiteNoise: (id) => {
    const noise = get().whiteNoiseList.find((n) => n.id === id);
    if (noise) {
      get().playNoise(noise);
    }
  },

  stopWhiteNoise: () => {
    get().stopNoise();
  },

  toggleBedtimeItem: (id) => {
    set((state) => {
      const newItems = state.bedtimeItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );
      saveToStorage(STORAGE_KEYS.BEDTIME_ITEMS, newItems);
      return { bedtimeItems: newItems };
    });
    console.log('[ReminderStore] 切换睡前清单项目', { id });
  },

  addBedtimeItem: (item) => {
    const newItem: BedtimeItem = {
      ...item,
      id: generateId()
    };
    set((state) => {
      const newItems = [...state.bedtimeItems, newItem];
      saveToStorage(STORAGE_KEYS.BEDTIME_ITEMS, newItems);
      return { bedtimeItems: newItems };
    });
    console.log('[ReminderStore] 添加睡前清单项', { item: newItem });
  },

  deleteBedtimeItem: (id) => {
    set((state) => {
      const newItems = state.bedtimeItems.filter((item) => item.id !== id);
      saveToStorage(STORAGE_KEYS.BEDTIME_ITEMS, newItems);
      return { bedtimeItems: newItems };
    });
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
