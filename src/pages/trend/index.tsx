import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import TrendChart from '@/components/TrendChart';
import { useSleepStore } from '@/store/sleepStore';
import type { TrendData } from '@/types/sleep';
import dayjs from 'dayjs';

const TrendPage: React.FC = () => {
  const { records, getAverageScore, getAverageDuration, getTrendData } = useSleepStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[TrendPage] 页面显示');
  });

  const days = timeRange === 'week' ? 7 : 30;
  const trendData = useMemo(() => getTrendData(days), [days, getTrendData]);

  const avgScore = getAverageScore(days);
  const avgDuration = getAverageDuration(days);
  const prevAvgScore = getAverageScore(days * 2) - avgScore;
  const prevAvgDuration = getAverageDuration(days * 2) - avgDuration;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[TrendPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const generateInsights = () => {
    const insights: string[] = [];
    const goodDays = records.slice(0, days).filter(r => r.quality === 'good').length;
    const poorDays = records.slice(0, days).filter(r => r.quality === 'poor').length;

    if (goodDays > days * 0.6) {
      insights.push(`过去${days}天有${goodDays}天睡眠质量良好，继续保持！`);
    }

    if (avgScore >= 75) {
      insights.push(`平均睡眠评分${avgScore}分，睡眠质量整体不错`);
    } else if (avgScore >= 60) {
      insights.push(`平均睡眠评分${avgScore}分，还有提升空间`);
    } else {
      insights.push(`平均睡眠评分${avgScore}分，建议调整作息习惯`);
    }

    if (poorDays > 0) {
      insights.push(`有${poorDays}天睡眠质量较差，需要关注`);
    }

    const lateNights = records.slice(0, days).filter(r => {
      const hour = parseInt(r.bedtime.split(':')[0]);
      return hour >= 1;
    }).length;

    if (lateNights > 0) {
      insights.push(`有${lateNights}天在1点后入睡，建议早睡`);
    }

    if (avgDuration >= 7 && avgDuration <= 9) {
      insights.push(`平均睡眠时长${avgDuration}小时，符合健康标准`);
    } else if (avgDuration < 7) {
      insights.push(`平均睡眠时长${avgDuration}小时，睡眠不足`);
    } else {
      insights.push(`平均睡眠时长${avgDuration}小时，睡眠时间偏长`);
    }

    return insights.slice(0, 4);
  };

  const insights = generateInsights();

  const factors = [
    { icon: '☕', name: '咖啡摄入', impact: -15, color: '#F59E0B' },
    { icon: '🏃', name: '运动时长', impact: 12, color: '#10B981' },
    { icon: '📱', name: '睡前用手机', impact: -18, color: '#6366F1' },
    { icon: '😴', name: '午睡时长', impact: -8, color: '#8B5CF6' },
    { icon: '💡', name: '卧室光线', impact: 10, color: '#EC4899' }
  ];

  const generateCalendar = () => {
    const today = dayjs();
    const startOfMonth = today.startOf('month');
    const firstDayWeekday = startOfMonth.day();
    const daysInMonth = today.daysInMonth();
    const calendar: { day: number; quality?: string; isToday?: boolean }[] = [];

    for (let i = 0; i < firstDayWeekday; i++) {
      calendar.push({ day: 0 });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = today.date(day).format('YYYY-MM-DD');
      const record = records.find(r => r.date === dateStr);
      calendar.push({
        day,
        quality: record?.quality,
        isToday: day === today.date()
      });
    }

    return calendar;
  };

  const calendarDays = generateCalendar();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const calculateRegularity = () => {
    const recentRecords = records.slice(0, 7);
    if (recentRecords.length < 2) return 0;

    const bedTimes = recentRecords.map(r => {
      const [h, m] = r.bedtime.split(':').map(Number);
      return h + m / 60;
    });

    const wakeTimes = recentRecords.map(r => {
      const [h, m] = r.wakeupTime.split(':').map(Number);
      return h * 60 + m;
    });

    const bedVariance = Math.sqrt(
      bedTimes.reduce((a, b) => a + Math.pow(b - bedTimes.reduce((x, y) => x + y) / bedTimes.length, 2), 0) / bedTimes.length
    );

    const wakeVariance = Math.sqrt(
      wakeTimes.reduce((a, b) => a + Math.pow(b - wakeTimes.reduce((x, y) => x + y) / wakeTimes.length, 2), 0) / wakeTimes.length
    );

    const avgVariance = (bedVariance + wakeVariance) / 2;
    return Math.max(0, Math.min(100, Math.round(100 - avgVariance / 3)));
  };

  const regularityScore = calculateRegularity();

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <Text className={styles.greeting}>{getGreeting()}</Text>
            <Text className={styles.title}>睡眠趋势</Text>
          </View>

          <View className={styles.summaryCard}>
            <View className={styles.summaryGrid}>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{avgScore}</Text>
                <Text className={styles.summaryLabel}>平均评分</Text>
                <Text className={classnames(styles.summaryChange, prevAvgScore >= 0 ? 'positive' : 'negative')}>
                  {prevAvgScore >= 0 ? '↑' : '↓'} {Math.abs(prevAvgScore)} 分
                </Text>
              </View>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{avgDuration}h</Text>
                <Text className={styles.summaryLabel}>平均时长</Text>
                <Text className={classnames(styles.summaryChange, prevAvgDuration >= 0 ? 'positive' : 'negative')}>
                  {prevAvgDuration >= 0 ? '↑' : '↓'} {Math.abs(prevAvgDuration).toFixed(1)} h
                </Text>
              </View>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{records.slice(0, days).filter(r => r.quality === 'good').length}</Text>
                <Text className={styles.summaryLabel}>优质睡眠</Text>
                <Text className={styles.summaryChange}>天</Text>
              </View>
              <View className={styles.summaryItem}>
                <Text className={styles.summaryValue}>{regularityScore}</Text>
                <Text className={styles.summaryLabel}>作息规律</Text>
                <Text className={classnames(styles.summaryChange, regularityScore >= 80 ? 'positive' : 'negative')}>
                  {regularityScore >= 80 ? '优秀' : regularityScore >= 60 ? '一般' : '需改善'}
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.toggleSection}>
            <View className={styles.toggleRow}>
              <Button
                className={classnames(styles.toggleBtn, timeRange === 'week' && 'active')}
                onClick={() => setTimeRange('week')}
              >
                近7天
              </Button>
              <Button
                className={classnames(styles.toggleBtn, timeRange === 'month' && 'active')}
                onClick={() => setTimeRange('month')}
              >
                近30天
              </Button>
            </View>
          </View>

          <View className={styles.chartSection}>
            {trendData.length > 0 ? (
              <>
                <TrendChart data={trendData} type="score" />
                <TrendChart data={trendData} type="duration" />
              </>
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📊</Text>
                <Text className={styles.emptyText}>暂无数据，开始记录睡眠吧</Text>
              </View>
            )}
          </View>

          <View className={styles.insightsCard}>
            <Text className={styles.insightsTitle}>
              <Text className={styles.insightsIcon}>💡</Text>
              数据洞察
            </Text>
            {insights.map((insight, index) => (
              <View key={index} className={styles.insightItem}>
                <View className={styles.insightDot} />
                <Text className={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>

          <View className={styles.factorsCard}>
            <Text className={styles.factorsTitle}>影响因素分析</Text>
            {factors.map((factor, index) => (
              <View key={index} className={styles.factorItem}>
                <View className={styles.factorInfo}>
                  <Text className={styles.factorIcon}>{factor.icon}</Text>
                  <Text className={styles.factorName}>{factor.name}</Text>
                </View>
                <View className={styles.factorImpact}>
                  <View className={styles.impactBar}>
                    <View
                      className={styles.impactFill}
                      style={{
                        width: `${Math.abs(factor.impact)}%`,
                        backgroundColor: factor.impact >= 0 ? '#10B981' : '#F87171',
                        marginLeft: factor.impact >= 0 ? 'auto' : 0
                      }}
                    />
                  </View>
                  <Text
                    className={classnames(styles.impactValue, factor.impact >= 0 ? 'positive' : 'negative')}
                  >
                    {factor.impact >= 0 ? '+' : ''}{factor.impact}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className={styles.regularityCard}>
            <View className={styles.regularityHeader}>
              <Text className={styles.regularityTitle}>本月睡眠日历</Text>
              <Text className={styles.regularityScore}>规律度 {regularityScore}%</Text>
            </View>
            <View className={styles.calendarGrid}>
              {weekDays.map((day, index) => (
                <Text key={index} className={styles.calendarHeader}>{day}</Text>
              ))}
              {calendarDays.map((item, index) => (
                <View
                  key={index}
                  className={classnames(
                    styles.calendarDay,
                    item.day === 0 && 'empty',
                    item.quality === 'good' && 'good',
                    item.quality === 'normal' && 'normal',
                    item.quality === 'poor' && 'poor'
                  )}
                >
                  {item.day > 0 && item.day}
                </View>
              ))}
            </View>
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              改善建议
            </Text>
            <Text className={styles.tipsContent}>
              1. 保持规律的作息时间，每天在相同时间入睡和起床{'\n'}
              2. 睡前1小时避免使用电子设备{'\n'}
              3. 下午3点后尽量减少咖啡因摄入{'\n'}
              4. 每天保持30分钟以上的适度运动{'\n'}
              5. 保持卧室温度适宜（18-22°C）
            </Text>
          </View>
        </ScrollView>
    </View>
  );
};

export default TrendPage;
