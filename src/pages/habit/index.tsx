import React, { useState } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import HabitItem from '@/components/HabitItem';
import { mockHabits } from '@/data/mockHabit';
import type { Habit } from '@/types/sleep';

const HabitPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[HabitPage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[HabitPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleToggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(habit => {
      if (habit.id !== habitId) return habit;

      const alreadyCompleted = habit.completionRecords.includes(today);
      const newRecords = alreadyCompleted
        ? habit.completionRecords.filter(d => d !== today)
        : [...habit.completionRecords, today];

      return {
        ...habit,
        completionRecords: newRecords,
        currentStreak: alreadyCompleted
          ? habit.currentStreak - 1
          : habit.currentStreak + 1
      };
    }));
  };

  const handleAddHabit = () => {
    Taro.showToast({ title: '添加习惯功能开发中', icon: 'none' });
  };

  const completedToday = habits.filter(h =>
    h.completionRecords.includes(new Date().toISOString().split('T')[0])
  ).length;
  const totalHabits = habits.length;
  const totalStreak = habits.reduce((acc, h) => acc + h.currentStreak, 0);

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <Text className={styles.headerTitle}>习惯计划</Text>
            <Text className={styles.headerDesc}>
              每天进步一点点，坚持养成好习惯
            </Text>
          </View>

          <View className={styles.statsCard}>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{completedToday}/{totalHabits}</Text>
              <Text className={styles.statsLabel}>今日完成</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{totalHabits}</Text>
              <Text className={styles.statsLabel}>习惯总数</Text>
            </View>
            <View className={styles.statsItem}>
              <Text className={styles.statsValue}>{totalStreak}</Text>
              <Text className={styles.statsLabel}>累计打卡</Text>
            </View>
          </View>

          <View className={styles.habitSection}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>我的习惯</Text>
              <Button className={styles.addBtn} onClick={handleAddHabit}>
                + 新增
              </Button>
            </View>

            {habits.length > 0 ? (
              <View className={styles.habitList}>
                {habits.map(habit => (
                  <HabitItem
                    key={habit.id}
                    habit={habit}
                    onToggle={() => handleToggleHabit(habit.id)}
                  />
                ))}
              </View>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>✅</Text>
                <Text className={styles.emptyText}>暂无习惯，点击上方按钮添加</Text>
              </View>
            )}
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              习惯养成小贴士
            </Text>
            <Text className={styles.tipsContent}>
              • 选择1-2个习惯开始，不要贪多{'\n'}
              • 设置固定的时间和地点执行习惯{'\n'}
              • 连续21天坚持，习惯将自动养成{'\n'}
              • 每天打卡记录，保持动力和责任感
            </Text>
          </View>
        </ScrollView>
    </View>
  );
};
export default HabitPage;
