import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ScoreCircle from '@/components/ScoreCircle';
import { useSleepStore } from '@/store/sleepStore';
import { calculateSleepScore } from '@/utils/sleepScore';
import dayjs from 'dayjs';

const ReportPage: React.FC = () => {
  const { records, generateReport } = useSleepStore();
  const [activePeriod, setActivePeriod] = useState<'week' | 'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[ReportPage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[ReportPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const periodData = useMemo(() => {
    const days = activePeriod === 'week' ? 7 : 30;
    const endDate = dayjs();
    const startDate = endDate.subtract(days - 1, 'day');

    const periodRecords = records.filter(r => {
      const recordDate = dayjs(r.date);
      return recordDate.isAfter(startDate.subtract(1, 'day')) && recordDate.isBefore(endDate.add(1, 'day'));
    });

    const prevDays = activePeriod === 'week' ? 7 : 30;
    const prevStartDate = startDate.subtract(prevDays, 'day');
    const prevEndDate = startDate.subtract(1, 'day');

    const prevPeriodRecords = records.filter(r => {
      const recordDate = dayjs(r.date);
      return recordDate.isAfter(prevStartDate.subtract(1, 'day')) && recordDate.isBefore(prevEndDate.add(1, 'day'));
    });

    return { periodRecords, prevPeriodRecords, startDate, endDate, prevStartDate, prevEndDate };
  }, [records, activePeriod]);

  const { periodRecords, prevPeriodRecords, startDate, endDate } = periodData;

  const stats = useMemo(() => {
    if (periodRecords.length === 0) {
      return {
        avgScore: 0,
        avgDuration: 0,
        avgBedtime: '--:--',
        avgWakeup: '--:--',
        avgNightWakings: 0,
        avgNap: 0,
        goodDays: 0,
        totalDays: 0,
        scoreCompare: 0,
        durationCompare: 0
      };
    }

    const avgScore = Math.round(periodRecords.reduce((acc, r) => acc + r.score, 0) / periodRecords.length);
    const avgDuration = (periodRecords.reduce((acc, r) => acc + r.duration, 0) / periodRecords.length).toFixed(1);
    const avgNightWakings = (periodRecords.reduce((acc, r) => acc + r.nightWakings, 0) / periodRecords.length).toFixed(1);
    const avgNap = (periodRecords.reduce((acc, r) => acc + (r.napDuration || 0), 0) / periodRecords.length).toFixed(1);
    const goodDays = periodRecords.filter(r => r.quality === 'good').length;

    let avgBedtimeHour = 0, avgBedtimeMin = 0;
    let avgWakeupHour = 0, avgWakeupMin = 0;

    periodRecords.forEach(r => {
      const [bh, bm] = r.bedtime.split(':').map(Number);
      avgBedtimeHour += bh;
      avgBedtimeMin += bm;

      const [wh, wm] = r.wakeupTime.split(':').map(Number);
      avgWakeupHour += wh;
      avgWakeupMin += wm;
    });

    avgBedtimeHour = Math.round(avgBedtimeHour / periodRecords.length);
    avgBedtimeMin = Math.round(avgBedtimeMin / periodRecords.length);
    avgWakeupHour = Math.round(avgWakeupHour / periodRecords.length);
    avgWakeupMin = Math.round(avgWakeupMin / periodRecords.length);

    const avgBedtime = `${avgBedtimeHour.toString().padStart(2, '0')}:${avgBedtimeMin.toString().padStart(2, '0')}`;
    const avgWakeup = `${avgWakeupHour.toString().padStart(2, '0')}:${avgWakeupMin.toString().padStart(2, '0')}`;

    let scoreCompare = 0;
    let durationCompare = 0;

    if (prevPeriodRecords.length > 0) {
      const prevAvgScore = Math.round(prevPeriodRecords.reduce((acc, r) => acc + r.score, 0) / prevPeriodRecords.length);
      const prevAvgDuration = prevPeriodRecords.reduce((acc, r) => acc + r.duration, 0) / prevPeriodRecords.length;

      scoreCompare = avgScore - prevAvgScore;
      durationCompare = parseFloat(avgDuration) - prevAvgDuration;
    }

    return {
      avgScore,
      avgDuration,
      avgBedtime,
      avgWakeup,
      avgNightWakings,
      avgNap,
      goodDays,
      totalDays: periodRecords.length,
      scoreCompare,
      durationCompare
    };
  }, [periodRecords, prevPeriodRecords]);

  const insights = useMemo(() => {
    const result = [];

    if (stats.avgScore >= 80) {
      result.push({
        icon: '🎉',
        bgColor: '#D1FAE5',
        iconColor: '#10B981',
        title: '睡眠质量优秀',
        desc: `您的平均睡眠评分达到${stats.avgScore}分，继续保持良好的作息习惯！`
      });
    } else if (stats.avgScore >= 60) {
      result.push({
        icon: '💪',
        bgColor: '#FEF3C7',
        iconColor: '#F59E0B',
        title: '睡眠质量良好',
        desc: `您的平均睡眠评分为${stats.avgScore}分，还有提升空间，建议调整作息时间。`
      });
    } else {
      result.push({
        icon: '⚠️',
        bgColor: '#FEE2E2',
        iconColor: '#EF4444',
        title: '睡眠质量需要改善',
        desc: `您的平均睡眠评分仅${stats.avgScore}分，建议咨询医生或调整生活习惯。`
      });
    }

    if (parseFloat(stats.avgNap as string) > 60) {
      result.push({
        icon: '😴',
        bgColor: '#EDE9FE',
        iconColor: '#8B5CF6',
        title: '午睡时间过长',
        desc: `您的平均午睡时间为${stats.avgNap}分钟，建议控制在30分钟以内，避免影响夜间睡眠。`
      });
    }

    if (parseFloat(stats.avgNightWakings as string) > 2) {
      result.push({
        icon: '🌙',
        bgColor: '#DBEAFE',
        iconColor: '#3B82F6',
        title: '夜醒次数较多',
        desc: `您平均每晚夜醒${stats.avgNightWakings}次，建议睡前减少液体摄入，保持卧室舒适。`
      });
    }

    if (stats.scoreCompare > 0) {
      result.push({
        icon: '📈',
        bgColor: '#D1FAE5',
        iconColor: '#10B981',
        title: '睡眠质量提升',
        desc: `与上一周期相比，您的睡眠评分提升了${stats.scoreCompare}分，做得很好！`
      });
    } else if (stats.scoreCompare < 0) {
      result.push({
        icon: '📉',
        bgColor: '#FEE2E2',
        iconColor: '#EF4444',
        title: '睡眠质量下降',
        desc: `与上一周期相比，您的睡眠评分下降了${Math.abs(stats.scoreCompare)}分，请注意调整。`
      });
    }

    return result;
  }, [stats]);

  const handleShare = (type: 'doctor' | 'family') => {
    const title = type === 'doctor' ? '分享给医生' : '分享给家人';
    Taro.showToast({ title, icon: 'none' });
  };

  const handleExport = () => {
    Taro.showActionSheet({
      itemList: ['导出为PDF', '导出为图片', '发送邮件'],
      success: (res) => {
        const actions = ['PDF', '图片', '邮件'];
        Taro.showToast({ title: `正在导出${actions[res.tapIndex]}...`, icon: 'loading' });
        setTimeout(() => {
          Taro.showToast({ title: '导出成功', icon: 'success' });
        }, 1500);
      }
    });
  };

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <Text className={styles.headerTitle}>报告分享</Text>
            <Text className={styles.headerDesc}>
              查看您的睡眠趋势，分享给医生或家人
            </Text>
          </View>

          <View className={styles.periodSelector}>
            <View
              className={classnames(styles.periodOption, activePeriod === 'week' && 'active')}
              onClick={() => setActivePeriod('week')}
            >
              本周
            </View>
            <View
              className={classnames(styles.periodOption, activePeriod === 'month' && 'active')}
              onClick={() => setActivePeriod('month')}
            >
              本月
            </View>
          </View>

          <View className={styles.reportCard}>
            <View className={styles.reportHeader}>
              <Text className={styles.reportTitle}>
                {activePeriod === 'week' ? '周' : '月'}度睡眠报告
              </Text>
              <Text className={styles.reportPeriod}>
                {startDate.format('MM.DD')} - {endDate.format('MM.DD')}
              </Text>
            </View>

            <View className={styles.scoreSection}>
              <Text className={styles.scoreLabel}>平均睡眠评分</Text>
              <ScoreCircle score={stats.avgScore} size="large" />
              <View className={classnames(styles.scoreCompare, stats.scoreCompare >= 0 ? 'up' : 'down')}>
                {stats.scoreCompare >= 0 ? '↑' : '↓'} {Math.abs(stats.scoreCompare)}分
                <Text style={{ color: '#666', marginLeft: 8 }}>vs 上一周期</Text>
              </View>
            </View>

            <View className={styles.statsGrid}>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.avgDuration}h</Text>
                <Text className={styles.statName}>平均时长</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.avgBedtime}</Text>
                <Text className={styles.statName}>平均入睡</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.avgWakeup}</Text>
                <Text className={styles.statName}>平均起床</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.goodDays}/{stats.totalDays}</Text>
                <Text className={styles.statName}>优质睡眠</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.avgNightWakings}次</Text>
                <Text className={styles.statName}>平均夜醒</Text>
              </View>
              <View className={styles.statCard}>
                <Text className={styles.statValue}>{stats.avgNap}min</Text>
                <Text className={styles.statName}>平均午睡</Text>
              </View>
            </View>
          </View>

          <View className={styles.insightsSection}>
            <Text className={styles.sectionTitle}>数据洞察</Text>
            <View className={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} className={styles.insightItem}>
                  <View
                    className={styles.insightIcon}
                    style={{ backgroundColor: insight.bgColor, color: insight.iconColor }}
                  >
                    {insight.icon}
                  </View>
                  <View className={styles.insightContent}>
                    <Text className={styles.insightTitle}>{insight.title}</Text>
                    <Text className={styles.insightDesc}>{insight.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.shareSection}>
            <Text className={styles.shareTitle}>
              <Text>📤</Text>
              分享报告
            </Text>
            <View className={styles.shareOptions}>
              <View className={styles.shareOption} onClick={() => handleShare('doctor')}>
                <Text className={styles.shareIcon}>👨‍⚕️</Text>
                <Text className={styles.shareName}>发送医生</Text>
              </View>
              <View className={styles.shareOption} onClick={() => handleShare('family')}>
                <Text className={styles.shareIcon}>👨‍👩‍👧</Text>
                <Text className={styles.shareName}>发送家人</Text>
              </View>
            </View>
          </View>

          <Button className={styles.exportBtn} onClick={handleExport}>
            📥 导出完整报告
          </Button>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              温馨提示
            </Text>
            <Text className={styles.tipsContent}>
              • 定期分享睡眠报告给医生，有助于医生更好地了解您的睡眠状况{'\n'}
              • 建议每周查看一次睡眠报告，及时调整作息习惯{'\n'}
              • 连续3个月的报告可以更全面地反映睡眠健康趋势
            </Text>
          </View>
        </ScrollView>
    </View>
  );
};

export default ReportPage;
