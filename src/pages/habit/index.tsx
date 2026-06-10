import React, { useState } from 'react';
import { View, Text, ScrollView, Button, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import HabitItem from '@/components/HabitItem';
import { useHabitStore } from '@/store/habitStore';
import type { Habit } from '@/types/sleep';

const categories = [
  { key: 'sleep' as const, name: '睡眠', icon: '😴', color: '#5B67E8' },
  { key: 'exercise' as const, name: '运动', icon: '🏃', color: '#10B981' },
  { key: 'diet' as const, name: '饮食', icon: '🥗', color: '#F59E0B' },
  { key: 'mindfulness' as const, name: '冥想', icon: '🧘', color: '#8B5CF6' }
];

const HabitPage: React.FC = () => {
  const { habits, checkInHabit, addHabit, getTodayCompleted, getTotalHabits, getTotalCheckIns } = useHabitStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    target: '',
    category: 'sleep' as Habit['category'],
    icon: '😴'
  });

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
    checkInHabit(habitId);
  };

  const handleAddHabit = () => {
    setShowAddModal(true);
    setNewHabit({
      name: '',
      description: '',
      target: '',
      category: 'sleep',
      icon: '😴'
    });
  };

  const handleSaveHabit = () => {
    if (!newHabit.name.trim()) {
      Taro.showToast({ title: '请输入习惯名称', icon: 'none' });
      return;
    }
    if (!newHabit.target.trim()) {
      Taro.showToast({ title: '请输入习惯目标', icon: 'none' });
      return;
    }

    const selectedCategory = categories.find(c => c.key === newHabit.category);
    addHabit({
      name: newHabit.name.trim(),
      description: newHabit.description.trim(),
      target: newHabit.target.trim(),
      category: newHabit.category,
      icon: selectedCategory?.icon || '✅'
    });

    setShowAddModal(false);
  };

  const handleCategoryChange = (e: any) => {
    const index = e.detail.value;
    const category = categories[index];
    setNewHabit(prev => ({
      ...prev,
      category: category.key,
      icon: category.icon
    }));
  };

  const completedToday = getTodayCompleted();
  const totalHabits = getTotalHabits();
  const totalStreak = getTotalCheckIns();

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

          {showAddModal && (
            <View className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
              <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <View className={styles.modalHeader}>
                  <Text className={styles.modalTitle}>新增习惯</Text>
                  <Text className={styles.modalClose} onClick={() => setShowAddModal(false)}>✕</Text>
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>习惯名称</Text>
                  <Input
                    className={styles.formInput}
                    placeholder="例如：早睡、跑步、冥想"
                    value={newHabit.name}
                    onInput={(e) => setNewHabit(prev => ({ ...prev, name: e.detail.value }))}
                    maxlength={20}
                  />
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>习惯分类</Text>
                  <Picker
                    mode="selector"
                    range={categories.map(c => `${c.icon} ${c.name}`)}
                    value={categories.findIndex(c => c.key === newHabit.category)}
                    onChange={handleCategoryChange}
                  >
                    <View className={styles.pickerInput}>
                      <Text className={styles.pickerText}>
                        {categories.find(c => c.key === newHabit.category)?.icon}
                        {' '}
                        {categories.find(c => c.key === newHabit.category)?.name}
                      </Text>
                      <Text className={styles.pickerArrow}>›</Text>
                    </View>
                  </Picker>
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>习惯目标</Text>
                  <Input
                    className={styles.formInput}
                    placeholder="例如：每天23:00前睡觉、每天30分钟"
                    value={newHabit.target}
                    onInput={(e) => setNewHabit(prev => ({ ...prev, target: e.detail.value }))}
                    maxlength={50}
                  />
                </View>

                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>习惯描述（可选）</Text>
                  <Input
                    className={styles.formInput}
                    placeholder="简单描述这个习惯的好处"
                    value={newHabit.description}
                    onInput={(e) => setNewHabit(prev => ({ ...prev, description: e.detail.value }))}
                    maxlength={100}
                  />
                </View>

                <View className={styles.modalFooter}>
                  <Button className={classnames(styles.modalBtn, 'cancel')} onClick={() => setShowAddModal(false)}>
                    取消
                  </Button>
                  <Button className={classnames(styles.modalBtn, 'confirm')} onClick={handleSaveHabit}>
                    保存
                  </Button>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
    </View>
  );
};
export default HabitPage;
