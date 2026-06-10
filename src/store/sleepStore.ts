import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type { SleepRecord, SleepReport, TrendData, UserProfile, AppSettings } from '@/types/sleep';
import { mockSleepRecords, mockWeeklyReport, mockMonthlyReport } from '@/data/mockSleep';
import { calculateSleepScore, getQualityLabel, generateId } from '@/utils/sleepScore';
import dayjs from 'dayjs';

const STORAGE_KEYS = {
  RECORDS: 'sleep_records',
  USER_PROFILE: 'sleep_user_profile',
  APP_SETTINGS: 'sleep_app_settings'
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

interface SleepStore {
  records: SleepRecord[];
  currentRecord: Partial<SleepRecord> | null;
  weeklyReport: SleepReport | null;
  monthlyReport: SleepReport | null;
  userProfile: UserProfile;
  appSettings: AppSettings;
  isRecording: boolean;
  recordingStartTime: number | null;

  setCurrentRecord: (record: Partial<SleepRecord>) => void;
  saveRecord: (record: Omit<SleepRecord, 'id' | 'score' | 'quality' | 'factors'>) => void;
  updateRecord: (id: string, updates: Partial<SleepRecord>) => void;
  deleteRecord: (id: string) => void;
  getRecordByDate: (date: string) => SleepRecord | undefined;
  getTrendData: (days: number) => TrendData[];
  getAverageScore: (days: number) => number;
  getAverageDuration: (days: number) => number;
  startRecording: () => void;
  stopRecording: () => void;
  generateReport: (type: 'weekly' | 'monthly') => SleepReport;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  clearAllData: () => void;
}

const defaultUserProfile: UserProfile = {
  name: '睡眠达人',
  avatar: 'https://picsum.photos/id/64/200/200',
  age: 28,
  gender: 'male',
  targetSleepDuration: 8,
  targetBedTime: '23:00',
  targetWakeTime: '07:00'
};

const defaultAppSettings: AppSettings = {
  darkMode: false,
  notificationsEnabled: true,
  bedtimeReminderEnabled: true,
  wakeupAlarmEnabled: true,
  abnormalReminderEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  autoBackup: true,
  dataSync: true,
  dataAnalytics: true,
  targetSleepDuration: 8,
  theme: 'light',
  language: 'zh-CN'
};

export const useSleepStore = create<SleepStore>((set, get) => ({
  records: loadFromStorage<SleepRecord[]>(STORAGE_KEYS.RECORDS, mockSleepRecords),
  currentRecord: null,
  weeklyReport: mockWeeklyReport,
  monthlyReport: mockMonthlyReport,
  userProfile: loadFromStorage<UserProfile>(STORAGE_KEYS.USER_PROFILE, defaultUserProfile),
  appSettings: loadFromStorage<AppSettings>(STORAGE_KEYS.APP_SETTINGS, defaultAppSettings),
  isRecording: false,
  recordingStartTime: null,

  setCurrentRecord: (record) => set({ currentRecord: record }),

  saveRecord: (recordData) => {
    const { score, breakdown, factors } = calculateSleepScore(recordData);
    const quality = getQualityLabel(score);
    
    const newRecord: SleepRecord = {
      ...recordData,
      id: generateId(),
      score,
      quality,
      factors
    };

    set((state) => {
      const newRecords = [newRecord, ...state.records];
      saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
      return {
        records: newRecords,
        currentRecord: null
      };
    });

    console.log('[SleepStore] 保存睡眠记录', { record: newRecord, breakdown, factors });
  },

  updateRecord: (id, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
      return { records: newRecords };
    });
    console.log('[SleepStore] 更新睡眠记录', { id, updates });
  },

  deleteRecord: (id) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== id);
      saveToStorage(STORAGE_KEYS.RECORDS, newRecords);
      return { records: newRecords };
    });
    console.log('[SleepStore] 删除睡眠记录', { id });
  },

  getRecordByDate: (date) => {
    return get().records.find((r) => r.date === date);
  },

  getTrendData: (days) => {
    return get().records
      .slice(0, days)
      .map((r) => ({
        date: r.date,
        score: r.score,
        duration: r.duration,
        bedTime: r.bedtime,
        wakeTime: r.wakeupTime
      }))
      .reverse();
  },

  getAverageScore: (days) => {
    const records = get().records.slice(0, days);
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / records.length);
  },

  getAverageDuration: (days) => {
    const records = get().records.slice(0, days);
    if (records.length === 0) return 0;
    const sum = records.reduce((acc, r) => acc + r.duration, 0);
    return Math.round((sum / records.length) * 10) / 10;
  },

  startRecording: () => {
    set({
      isRecording: true,
      recordingStartTime: Date.now()
    });
    console.log('[SleepStore] 开始睡眠记录');
  },

  stopRecording: () => {
    const { recordingStartTime } = get();
    const endTime = Date.now();
    const duration = recordingStartTime
      ? Math.round((endTime - recordingStartTime) / (1000 * 60 * 60) * 10) / 10
      : 0;

    set({
      isRecording: false,
      recordingStartTime: null
    });

    console.log('[SleepStore] 停止睡眠记录', { duration });
    return duration;
  },

  generateReport: (type) => {
    const days = type === 'weekly' ? 7 : 30;
    const records = get().records.slice(0, days);
    
    const avgScore = records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / records.length)
      : 0;
    
    const avgDuration = records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.duration, 0) / records.length * 10) / 10
      : 0;

    const report: SleepReport = {
      id: generateId(),
      type,
      startDate: dayjs().subtract(days, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
      avgScore,
      avgDuration,
      avgBedTime: '23:00',
      avgWakeTime: '07:00',
      improvement: Math.floor(Math.random() * 10) - 2,
      insights: [
        `${type === 'weekly' ? '本周' : '本月'}平均睡眠评分为${avgScore}分`,
        `平均睡眠时长${avgDuration}小时`,
        records.filter(r => r.quality === 'good').length > days / 2
          ? '大部分时间睡眠质量良好'
          : '建议改善睡眠习惯'
      ],
      recommendations: [
        '保持规律的作息时间',
        '睡前避免使用电子设备',
        '适当增加运动量'
      ]
    };

    console.log('[SleepStore] 生成报告', { type, report });
    return report;
  },

  updateUserProfile: (profile) => {
    set((state) => {
      const newProfile = { ...state.userProfile, ...profile };
      saveToStorage(STORAGE_KEYS.USER_PROFILE, newProfile);
      return { userProfile: newProfile };
    });
    console.log('[SleepStore] 更新用户资料', { profile });
  },

  updateAppSettings: (settings) => {
    set((state) => {
      const newSettings = { ...state.appSettings, ...settings };
      saveToStorage(STORAGE_KEYS.APP_SETTINGS, newSettings);
      return { appSettings: newSettings };
    });
    console.log('[SleepStore] 更新应用设置', { settings });
  },

  clearAllData: () => {
    try {
      Taro.removeStorageSync(STORAGE_KEYS.RECORDS);
      Taro.removeStorageSync(STORAGE_KEYS.USER_PROFILE);
      Taro.removeStorageSync(STORAGE_KEYS.APP_SETTINGS);
      set({
        records: mockSleepRecords,
        userProfile: defaultUserProfile,
        appSettings: defaultAppSettings
      });
      console.log('[SleepStore] 清除所有数据');
    } catch (e) {
      console.warn('[SleepStore] 清除数据失败', e);
    }
  }
}));
