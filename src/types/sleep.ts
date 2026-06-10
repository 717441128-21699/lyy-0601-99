export interface SleepRecord {
  id: string;
  date: string;
  bedtime: string;
  wakeupTime: string;
  duration: number;
  nightWakings: number;
  napDuration: number;
  coffeeIntake: number;
  exercise: number;
  score: number;
  quality: 'good' | 'normal' | 'poor';
  factors: string[];
  notes?: string;
}

export interface SleepScoreBreakdown {
  duration: number;
  quality: number;
  regularity: number;
  deepSleep: number;
}

export interface TrendData {
  date: string;
  score: number;
  duration: number;
  bedTime: string;
  wakeTime: string;
}

export interface Reminder {
  id: string;
  type: 'bedtime' | 'wakeup' | 'screen' | 'abnormal';
  title: string;
  description: string;
  time: string;
  enabled: boolean;
  repeat: string[];
  sound?: string;
  vibration?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  icon: string;
  target: string;
  currentStreak: number;
  longestStreak: number;
  completionRecords: string[];
  enabled: boolean;
  category: 'sleep' | 'exercise' | 'diet' | 'mindfulness';
}

export interface WhiteNoise {
  id: string;
  name: string;
  icon: string;
  description: string;
  duration: number;
  category: string;
  isPlaying: boolean;
}

export interface BedtimeItem {
  id: string;
  text: string;
  completed: boolean;
  category: 'essential' | 'optional';
}

export interface SleepReport {
  id: string;
  type: 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  avgScore: number;
  avgDuration: number;
  avgBedTime: string;
  avgWakeTime: string;
  improvement: number;
  insights: string[];
  recommendations: string[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  age: number;
  gender: string;
  targetSleepDuration: number;
  targetBedTime: string;
  targetWakeTime: string;
}

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  bedtimeReminderEnabled: boolean;
  wakeupAlarmEnabled: boolean;
  abnormalReminderEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  autoBackup: boolean;
  dataSync: boolean;
  dataAnalytics: boolean;
  targetSleepDuration: number;
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
}
