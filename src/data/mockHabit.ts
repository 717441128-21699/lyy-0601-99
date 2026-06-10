import type { Habit } from '@/types/sleep';
import dayjs from 'dayjs';

const generateCompletionRecords = (streak: number): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < streak; i++) {
    dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
};

export const mockHabits: Habit[] = [
  {
    id: 'habit-1',
    name: '规律作息',
    description: '每天固定时间入睡和起床',
    icon: '🌙',
    target: '23:00前入睡，7:00起床',
    currentStreak: 12,
    longestStreak: 15,
    completionRecords: generateCompletionRecords(12),
    enabled: true,
    category: 'sleep'
  },
  {
    id: 'habit-2',
    name: '睡前不看手机',
    description: '睡前30分钟放下手机',
    icon: '📱',
    target: '22:30后不使用电子设备',
    currentStreak: 7,
    longestStreak: 10,
    completionRecords: generateCompletionRecords(7),
    enabled: true,
    category: 'sleep'
  },
  {
    id: 'habit-3',
    name: '每日运动',
    description: '保持适量运动有助睡眠',
    icon: '🏃',
    target: '每天运动30分钟以上',
    currentStreak: 5,
    longestStreak: 8,
    completionRecords: generateCompletionRecords(5),
    enabled: true,
    category: 'exercise'
  },
  {
    id: 'habit-4',
    name: '控制咖啡摄入',
    description: '下午后避免饮用咖啡',
    icon: '☕',
    target: '每天咖啡不超过1杯',
    currentStreak: 10,
    longestStreak: 14,
    completionRecords: generateCompletionRecords(10),
    enabled: true,
    category: 'diet'
  },
  {
    id: 'habit-5',
    name: '睡前冥想',
    description: '睡前冥想放松身心',
    icon: '🧘',
    target: '每天冥想10分钟',
    currentStreak: 3,
    longestStreak: 6,
    completionRecords: generateCompletionRecords(3),
    enabled: true,
    category: 'mindfulness'
  },
  {
    id: 'habit-6',
    name: '午睡控制',
    description: '午睡时间不超过30分钟',
    icon: '😴',
    target: '午睡时长≤30分钟',
    currentStreak: 8,
    longestStreak: 12,
    completionRecords: generateCompletionRecords(8),
    enabled: true,
    category: 'sleep'
  }
];
