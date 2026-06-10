import type { SleepRecord, TrendData, SleepReport } from '@/types/sleep';
import dayjs from 'dayjs';

const generateMockSleepRecords = (): SleepRecord[] => {
  const records: SleepRecord[] = [];
  const baseDate = dayjs();

  for (let i = 0; i < 30; i++) {
    const date = baseDate.subtract(i, 'day').format('YYYY-MM-DD');
    const bedHour = 22 + Math.floor(Math.random() * 3);
    const bedMin = Math.floor(Math.random() * 60);
    const wakeHour = 6 + Math.floor(Math.random() * 2);
    const wakeMin = Math.floor(Math.random() * 60);

    const sleepDuration = (wakeHour + wakeMin / 60) - (bedHour + bedMin / 60) + 24;
    const nightWakes = Math.floor(Math.random() * 4);
    const napDuration = Math.random() > 0.6 ? Math.floor(Math.random() * 90) : 0;
    const coffeeIntake = Math.floor(Math.random() * 4);
    const exerciseDuration = Math.random() > 0.4 ? Math.floor(Math.random() * 90) : 0;

    const bedTime = `${bedHour.toString().padStart(2, '0')}:${bedMin.toString().padStart(2, '0')}`;
    const wakeTime = `${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}`;

    const baseScore = 60 + Math.floor(Math.random() * 35);
    const quality = baseScore >= 80 ? 'good' : baseScore >= 60 ? 'normal' : 'poor';

    const factors: string[] = [];
    if (sleepDuration < 6) factors.push('睡眠时间不足');
    if (nightWakes > 2) factors.push('夜间易醒');
    if (coffeeIntake > 2) factors.push('咖啡摄入过多');
    if (exerciseDuration === 0) factors.push('缺乏运动');

    records.push({
      id: `sleep-${i}`,
      date,
      bedtime: bedTime,
      wakeupTime: wakeTime,
      duration: Math.round(sleepDuration * 10) / 10,
      nightWakings: nightWakes,
      napDuration,
      coffeeIntake,
      exercise: exerciseDuration,
      score: baseScore,
      quality,
      factors,
      notes: i === 0 ? '昨晚工作较晚，有点疲惫' : undefined
    });
  }

  return records;
};

export const mockSleepRecords: SleepRecord[] = generateMockSleepRecords();

export const mockTrendData: TrendData[] = mockSleepRecords.slice(0, 14).map(record => ({
  date: record.date,
  score: record.score,
  duration: record.duration,
  bedTime: record.bedtime,
  wakeTime: record.wakeupTime
}));

export const mockWeeklyReport: SleepReport = {
  id: 'report-weekly-1',
  type: 'weekly',
  startDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  avgScore: 76,
  avgDuration: 7.2,
  avgBedTime: '23:15',
  avgWakeTime: '06:45',
  improvement: 5,
  insights: [
    '本周睡眠评分比上周提升5分',
    '平均入睡时间提前了15分钟',
    '咖啡摄入量有所减少'
  ],
  recommendations: [
    '建议保持规律的作息时间',
    '周末午睡时间控制在30分钟内',
    '下午4点后避免饮用咖啡'
  ]
};

export const mockMonthlyReport: SleepReport = {
  id: 'report-monthly-1',
  type: 'monthly',
  startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  avgScore: 73,
  avgDuration: 7.0,
  avgBedTime: '23:30',
  avgWakeTime: '06:40',
  improvement: 8,
  insights: [
    '本月睡眠质量整体呈上升趋势',
    '深度睡眠时间有所增加',
    '入睡时间更加规律'
  ],
  recommendations: [
    '继续保持当前的运动习惯',
    '尝试睡前冥想放松',
    '定期监测睡眠质量变化'
  ]
};
