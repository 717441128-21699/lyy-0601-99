import type { SleepRecord, SleepScoreBreakdown } from '@/types/sleep';

export const calculateSleepScore = (record: Omit<SleepRecord, 'score' | 'quality'>): { score: number; breakdown: SleepScoreBreakdown; factors: string[] } => {
  const factors: string[] = [];
  const targetDuration = 8;

  const durationScore = calculateDurationScore(record.duration, targetDuration);
  if (record.duration < 6) factors.push('睡眠时间不足6小时');
  if (record.duration > 9) factors.push('睡眠时间过长');

  const qualityScore = calculateQualityScore(record.nightWakings, record.napDuration);
  if (record.nightWakings > 2) factors.push('夜间醒来次数过多');
  if (record.napDuration > 60) factors.push('午睡时间过长可能影响夜间睡眠');

  const regularityScore = calculateRegularityScore(record.bedtime, record.wakeupTime);
  const bedHour = parseInt(record.bedtime.split(':')[0]);
  if (bedHour >= 1) factors.push('入睡时间较晚，建议23点前入睡');

  const deepSleepScore = calculateDeepSleepScore(record.coffeeIntake, record.exercise);
  if (record.coffeeIntake > 2) factors.push('咖啡摄入过多可能影响深度睡眠');
  if (record.exercise === 0) factors.push('缺乏运动可能影响睡眠质量');

  const score = Math.round(
    durationScore * 0.35 +
    qualityScore * 0.3 +
    regularityScore * 0.2 +
    deepSleepScore * 0.15
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      duration: Math.round(durationScore),
      quality: Math.round(qualityScore),
      regularity: Math.round(regularityScore),
      deepSleep: Math.round(deepSleepScore)
    },
    factors
  };
};

const calculateDurationScore = (actual: number, target: number): number => {
  const diff = Math.abs(actual - target);
  if (diff <= 0.5) return 100;
  if (diff <= 1) return 90;
  if (diff <= 1.5) return 80;
  if (diff <= 2) return 70;
  return Math.max(40, 70 - (diff - 2) * 15);
};

const calculateQualityScore = (nightWakes: number, napDuration: number): number => {
  let score = 100;
  if (nightWakes === 0) score = 100;
  else if (nightWakes === 1) score = 85;
  else if (nightWakes === 2) score = 70;
  else score = Math.max(50, 70 - (nightWakes - 2) * 10);

  if (napDuration > 60) score -= 10;
  if (napDuration > 90) score -= 10;

  return Math.max(50, score);
};

const calculateRegularityScore = (bedTime: string, wakeTime: string): number => {
  const bedHour = parseInt(bedTime.split(':')[0]);
  const bedMin = parseInt(bedTime.split(':')[1]);
  const wakeHour = parseInt(wakeTime.split(':')[0]);
  const wakeMin = parseInt(wakeTime.split(':')[1]);

  const idealBedHour = 23;
  const idealWakeHour = 7;

  const bedDiff = Math.abs((bedHour + bedMin / 60) - (idealBedHour));
  const wakeDiff = Math.abs((wakeHour + wakeMin / 60) - idealWakeHour);

  const bedScore = Math.max(50, 100 - bedDiff * 15);
  const wakeScore = Math.max(50, 100 - wakeDiff * 15);

  return (bedScore + wakeScore) / 2;
};

const calculateDeepSleepScore = (coffeeIntake: number, exerciseDuration: number): number => {
  let score = 85;

  if (coffeeIntake === 0) score += 5;
  else if (coffeeIntake <= 1) score = 85;
  else if (coffeeIntake <= 2) score = 75;
  else score = Math.max(50, 75 - (coffeeIntake - 2) * 10);

  if (exerciseDuration >= 30) score += 10;
  else if (exerciseDuration >= 15) score += 5;
  else if (exerciseDuration === 0) score -= 10;

  return Math.min(100, Math.max(50, score));
};

export const getQualityLabel = (score: number): 'good' | 'normal' | 'poor' => {
  if (score >= 80) return 'good';
  if (score >= 60) return 'normal';
  return 'poor';
};

export const getQualityText = (quality: 'good' | 'normal' | 'poor'): string => {
  const map = {
    good: '睡眠质量优秀',
    normal: '睡眠质量一般',
    poor: '睡眠质量较差'
  };
  return map[quality];
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
