import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { SleepRecord } from '@/types/sleep';
import ScoreCircle from '@/components/ScoreCircle';
import dayjs from 'dayjs';

interface SleepCardProps {
  record: SleepRecord;
  compact?: boolean;
  onClick?: () => void;
}

const SleepCard: React.FC<SleepCardProps> = ({ record, compact = false, onClick }) => {
  const formatDate = (dateStr: string) => {
    const date = dayjs(dateStr);
    const today = dayjs();
    if (date.isSame(today, 'day')) return '今天';
    if (date.isSame(today.subtract(1, 'day'), 'day')) return '昨天';
    return date.format('MM月DD日');
  };

  const getWeekDay = (dateStr: string) => {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[dayjs(dateStr).day()];
  };

  return (
    <View
      className={classnames(styles.card, compact && styles.compact)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <View className={styles.dateInfo}>
          <Text className={styles.date}>{formatDate(record.date)}</Text>
          <Text className={styles.weekday}>{getWeekDay(record.date)}</Text>
        </View>
        <ScoreCircle score={record.score} size="small" showLabel={false} />
      </View>

      <View className={styles.timeSection}>
        <View className={styles.timeItem}>
          <Text className={styles.timeLabel}>入睡</Text>
          <Text className={styles.timeValue}>{record.bedtime}</Text>
        </View>
        <View className={styles.timeDivider}>
          <View className={styles.timeBar} />
          <Text className={styles.duration}>{record.duration}h</Text>
          <View className={styles.timeBar} />
        </View>
        <View className={styles.timeItem}>
          <Text className={styles.timeLabel}>起床</Text>
          <Text className={styles.timeValue}>{record.wakeupTime}</Text>
        </View>
      </View>

      {!compact && (
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>💤</Text>
            <Text className={styles.statLabel}>夜醒</Text>
            <Text className={styles.statValue}>{record.nightWakings}次</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>😴</Text>
            <Text className={styles.statLabel}>午睡</Text>
            <Text className={styles.statValue}>{record.napDuration}min</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>☕</Text>
            <Text className={styles.statLabel}>咖啡</Text>
            <Text className={styles.statValue}>{record.coffeeIntake}杯</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statIcon}>🏃</Text>
            <Text className={styles.statLabel}>运动</Text>
            <Text className={styles.statValue}>{record.exercise}min</Text>
          </View>
        </View>
      )}

      {!compact && record.factors.length > 0 && (
        <View className={styles.factorsSection}>
          <Text className={styles.factorsTitle}>影响因素</Text>
          <View className={styles.factorsList}>
            {record.factors.map((factor, index) => (
              <Text key={index} className={styles.factorTag}>
                {factor}
              </Text>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default SleepCard;
