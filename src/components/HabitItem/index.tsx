import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Habit } from '@/types/sleep';
import dayjs from 'dayjs';

interface HabitItemProps {
  habit: Habit;
  onToggle?: () => void;
  onEdit?: () => void;
}

const HabitItem: React.FC<HabitItemProps> = ({ habit, onToggle, onEdit }) => {
  const today = dayjs().format('YYYY-MM-DD');
  const isCompletedToday = habit.completionRecords.includes(today);

  const categoryColors: Record<string, string> = {
    sleep: '#5B67E8',
    exercise: '#34D399',
    diet: '#FBBF24',
    mindfulness: '#A78BFA'
  };

  const categoryBgColors: Record<string, string> = {
    sleep: '#EEF2FF',
    exercise: '#D1FAE5',
    diet: '#FEF3C7',
    mindfulness: '#EDE9FE'
  };

  return (
    <View className={styles.card}>
      <View className={styles.header}>
        <View
          className={styles.iconWrapper}
          style={{ backgroundColor: categoryBgColors[habit.category] }}
        >
          <Text className={styles.icon}>{habit.icon}</Text>
        </View>
        <View className={styles.info}>
          <Text className={styles.name}>{habit.name}</Text>
          <Text className={styles.target}>{habit.target}</Text>
        </View>
        <View
          className={classnames(styles.checkBox, isCompletedToday && styles.checked)}
          style={{
            backgroundColor: isCompletedToday ? categoryColors[habit.category] : 'transparent',
            borderColor: categoryColors[habit.category]
          }}
          onClick={onToggle}
        >
          {isCompletedToday && <Text className={styles.checkIcon}>✓</Text>}
        </View>
      </View>

      <View className={styles.stats}>
        <View className={styles.stat}>
          <Text className={styles.statValue} style={{ color: categoryColors[habit.category] }}>
            {habit.currentStreak}
          </Text>
          <Text className={styles.statLabel}>连续天数</Text>
        </View>
        <View className={styles.stat}>
          <Text className={styles.statValue} style={{ color: categoryColors[habit.category] }}>
            {habit.longestStreak}
          </Text>
          <Text className={styles.statLabel}>最长连续</Text>
        </View>
        <View className={styles.stat}>
          <Text className={styles.statValue} style={{ color: categoryColors[habit.category] }}>
            {habit.completionRecords.length}
          </Text>
          <Text className={styles.statLabel}>总完成</Text>
        </View>
      </View>

      <View className={styles.progressBar}>
        <View
          className={styles.progressFill}
          style={{
            width: `${Math.min(100, (habit.currentStreak / 30) * 100)}%`,
            backgroundColor: categoryColors[habit.category]
          }}
        />
      </View>

      {onEdit && (
        <Button className={styles.editBtn} onClick={onEdit}>
          编辑
        </Button>
      )}
    </View>
  );
};

export default HabitItem;
