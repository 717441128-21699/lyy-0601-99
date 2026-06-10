import type { Reminder } from '@/types/sleep';

export const mockReminders: Reminder[] = [
  {
    id: 'reminder-1',
    type: 'bedtime',
    title: '就寝提醒',
    description: '准备开始睡前放松，迎接美好的睡眠',
    time: '22:30',
    enabled: true,
    repeat: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    sound: '轻柔铃声',
    vibration: true
  },
  {
    id: 'reminder-2',
    type: 'wakeup',
    title: '起床闹钟',
    description: '早安！美好的一天开始了',
    time: '07:00',
    enabled: true,
    repeat: ['周一', '周二', '周三', '周四', '周五'],
    sound: '自然鸟鸣',
    vibration: true
  },
  {
    id: 'reminder-3',
    type: 'screen',
    title: '睡前屏幕关闭提示',
    description: '睡前30分钟，请关闭电子设备',
    time: '23:00',
    enabled: true,
    repeat: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    sound: '静音',
    vibration: false
  },
  {
    id: 'reminder-4',
    type: 'abnormal',
    title: '异常睡眠连续提醒',
    description: '当连续3天睡眠评分低于60分时提醒',
    time: '09:00',
    enabled: true,
    repeat: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    sound: '提示音',
    vibration: true
  }
];

export const mockWhiteNoises = [
  {
    id: 'noise-1',
    name: '雨声',
    icon: '🌧️',
    description: '舒缓的下雨声，帮助放松身心',
    duration: 60,
    category: '自然',
    isPlaying: false
  },
  {
    id: 'noise-2',
    name: '海浪',
    icon: '🌊',
    description: '海浪拍岸的声音，让人心旷神怡',
    duration: 60,
    category: '自然',
    isPlaying: false
  },
  {
    id: 'noise-3',
    name: '森林',
    icon: '🌲',
    description: '森林中的鸟鸣虫叫，回归自然',
    duration: 60,
    category: '自然',
    isPlaying: false
  },
  {
    id: 'noise-4',
    name: '白噪音',
    icon: '📻',
    description: '均匀的白噪音，屏蔽外界干扰',
    duration: 60,
    category: '声音',
    isPlaying: false
  },
  {
    id: 'noise-5',
    name: '钢琴',
    icon: '🎹',
    description: '轻柔的钢琴曲，宁静致远',
    duration: 45,
    category: '音乐',
    isPlaying: false
  },
  {
    id: 'noise-6',
    name: '冥想',
    icon: '🧘',
    description: '冥想引导音乐，深度放松',
    duration: 30,
    category: '音乐',
    isPlaying: false
  }
];

export const mockBedtimeItems = [
  {
    id: 'bedtime-1',
    text: '刷牙洗脸',
    completed: true,
    category: 'essential' as const
  },
  {
    id: 'bedtime-2',
    text: '放下手机',
    completed: false,
    category: 'essential' as const
  },
  {
    id: 'bedtime-3',
    text: '阅读15分钟',
    completed: false,
    category: 'optional' as const
  },
  {
    id: 'bedtime-4',
    text: '喝一杯温水',
    completed: true,
    category: 'optional' as const
  },
  {
    id: 'bedtime-5',
    text: '冥想放松',
    completed: false,
    category: 'optional' as const
  }
];
