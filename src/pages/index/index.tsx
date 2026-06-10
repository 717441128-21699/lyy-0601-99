import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Picker, Switch, Button, Textarea } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import ScoreCircle from '@/components/ScoreCircle';
import SleepCard from '@/components/SleepCard';
import { useSleepStore } from '@/store/sleepStore';
import { calculateSleepScore, getQualityLabel } from '@/utils/sleepScore';
import type { SleepRecord, SleepScoreBreakdown } from '@/types/sleep';
import dayjs from 'dayjs';

const SleepRecordPage: React.FC = () => {
  const {
    records,
    userProfile,
    isRecording,
    startRecording,
    stopRecording,
    saveRecord,
    getAverageScore,
    getAverageDuration
  } = useSleepStore();

  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    bedtime: '23:00',
    wakeupTime: '07:00',
    nightWakings: 0,
    napDuration: 0,
    coffeeIntake: 1,
    exercise: 30,
    notes: ''
  });

  const [scoreBreakdown, setScoreBreakdown] = useState<SleepScoreBreakdown | null>(null);
  const [previewScore, setPreviewScore] = useState<number | null>(null);

  const todayRecord = records.find(r => r.date === formData.date);
  const recentRecords = records.slice(0, 7);

  useEffect(() => {
    if (showModal) {
      calculatePreviewScore();
    }
  }, [formData, showModal]);

  useDidShow(() => {
    console.log('[SleepRecordPage] 页面显示');
  });

  const calculatePreviewScore = useCallback(() => {
    const bedHour = parseInt(formData.bedtime.split(':')[0]);
    const bedMin = parseInt(formData.bedtime.split(':')[1]);
    const wakeHour = parseInt(formData.wakeupTime.split(':')[0]);
    const wakeMin = parseInt(formData.wakeupTime.split(':')[1]);

    let duration = (wakeHour + wakeMin / 60) - (bedHour + bedMin / 60);
    if (duration <= 0) duration += 24;
    duration = Math.round(duration * 10) / 10;

    const result = calculateSleepScore({
      ...formData,
      duration
    });

    setScoreBreakdown(result.breakdown);
    setPreviewScore(result.score);
  }, [formData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[SleepRecordPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleQuickAction = (action: string) => {
    console.log('[SleepRecordPage] 快捷操作', { action });
    switch (action) {
      case 'relax':
        Taro.navigateTo({ url: '/pages/relax/index' });
        break;
      case 'reminder':
        Taro.switchTab({ url: '/pages/reminder/index' });
        break;
      case 'habit':
        Taro.navigateTo({ url: '/pages/habit/index' });
        break;
      case 'report':
        Taro.navigateTo({ url: '/pages/report/index' });
        break;
      default:
        break;
    }
  };

  const handleStartRecord = () => {
    if (isRecording) {
      const duration = stopRecording();
      Taro.showToast({
        title: `记录结束，时长${duration}小时`,
        icon: 'success'
      });
    } else {
      startRecording();
      Taro.showToast({
        title: '开始记录睡眠',
        icon: 'success'
      });
    }
  };

  const handleSubmit = () => {
    const bedHour = parseInt(formData.bedtime.split(':')[0]);
    const bedMin = parseInt(formData.bedtime.split(':')[1]);
    const wakeHour = parseInt(formData.wakeupTime.split(':')[0]);
    const wakeMin = parseInt(formData.wakeupTime.split(':')[1]);

    let duration = (wakeHour + wakeMin / 60) - (bedHour + bedMin / 60);
    if (duration <= 0) duration += 24;
    duration = Math.round(duration * 10) / 10;

    try {
      saveRecord({
        date: formData.date,
        bedtime: formData.bedtime,
        wakeupTime: formData.wakeupTime,
        duration,
        nightWakings: formData.nightWakings,
        napDuration: formData.napDuration,
        coffeeIntake: formData.coffeeIntake,
        exercise: formData.exercise,
        notes: formData.notes
      });

      Taro.showToast({
        title: '记录保存成功',
        icon: 'success'
      });
      setShowModal(false);
    } catch (error) {
      console.error('[SleepRecordPage] 保存记录失败', error);
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      });
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getGreeting = () => {
    const hour = dayjs().hour();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const getDimensionColor = (score: number) => {
    if (score >= 80) return '#34D399';
    if (score >= 60) return '#FBBF24';
    return '#F87171';
  };

  const dimensions = scoreBreakdown ? [
    { name: '睡眠时长', icon: '⏱️', score: scoreBreakdown.duration },
    { name: '睡眠质量', icon: '💤', score: scoreBreakdown.quality },
    { name: '作息规律', icon: '📅', score: scoreBreakdown.regularity },
    { name: '深度睡眠', icon: '🌙', score: scoreBreakdown.deepSleep }
  ] : todayRecord ? [
    { name: '睡眠时长', icon: '⏱️', score: Math.round(todayRecord.duration / 8 * 100) },
    { name: '睡眠质量', icon: '💤', score: todayRecord.nightWakings <= 1 ? 90 : todayRecord.nightWakings <= 2 ? 70 : 50 },
    { name: '作息规律', icon: '📅', score: getAverageScore(7) },
    { name: '深度睡眠', icon: '🌙', score: todayRecord.coffeeIntake <= 1 ? 85 : 65 }
  ] : [
    { name: '睡眠时长', icon: '⏱️', score: 0 },
    { name: '睡眠质量', icon: '💤', score: 0 },
    { name: '作息规律', icon: '📅', score: 0 },
    { name: '深度睡眠', icon: '🌙', score: 0 }
  ];

  return (
    <View className={styles.page}>
      <ScrollView
        scrollY
        refresherEnabled
        refresherTriggered={isRefreshing}
        onRefresherRefresh={handleRefresh}
      >
          <View className={styles.header}>
            <View className={styles.headerTop}>
              <View className={styles.greeting}>
                <Text className={styles.greetingText}>{getGreeting()}</Text>
                <Text className={styles.userName}>{userProfile.name}</Text>
              </View>
              <Text className={styles.dateText}>
                {dayjs().format('MM月DD日 dddd')}
              </Text>
            </View>

            <View className={styles.scoreSection}>
              <Text className={styles.scoreLabel}>今日睡眠评分</Text>
              <ScoreCircle
                score={todayRecord ? todayRecord.score : (previewScore || 0)}
                size="large"
                showLabel={true}
              />
            </View>
          </View>

          <View className={styles.timeCard}>
            <View className={styles.timeRow}>
              <View className={styles.timeItem}>
                <Text className={styles.timeLabel}>入睡时间</Text>
                <Text className={styles.timeValue}>
                  {todayRecord ? todayRecord.bedtime : '--:--'}
                </Text>
              </View>
              <View className={styles.timeConnector}>
                <View className={styles.timeBar} />
                <View className={styles.durationBadge}>
                  {todayRecord ? `${todayRecord.duration}h` : '--h'}
                </View>
                <View className={styles.timeBar} />
              </View>
              <View className={styles.timeItem}>
                <Text className={styles.timeLabel}>起床时间</Text>
                <Text className={styles.timeValue}>
                  {todayRecord ? todayRecord.wakeupTime : '--:--'}
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.quickActions}>
            <Text className={styles.quickActionsTitle}>快捷功能</Text>
            <ScrollView scrollX className={styles.quickScroll}>
              {[
                { icon: '🧘', text: '放松训练', action: 'relax' },
                { icon: '⏰', text: '提醒设置', action: 'reminder' },
                { icon: '✅', text: '习惯打卡', action: 'habit' },
                { icon: '📊', text: '查看报告', action: 'report' }
              ].map((item, index) => (
                <View
                  key={index}
                  className={styles.quickItem}
                  onClick={() => handleQuickAction(item.action)}
                >
                  <Text className={styles.quickIcon}>{item.icon}</Text>
                  <Text className={styles.quickText}>{item.text}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View className={styles.scoreAnalysis}>
            <Text className={styles.sectionTitle}>评分分析</Text>
            <View className={styles.scoreDimensions}>
              {dimensions.map((dim, index) => (
                <View key={index} className={styles.dimensionRow}>
                  <Text className={styles.dimensionIcon}>{dim.icon}</Text>
                  <View className={styles.dimensionInfo}>
                    <Text className={styles.dimensionName}>{dim.name}</Text>
                    <View className={styles.dimensionBar}>
                      <View
                        className={styles.dimensionFill}
                        style={{
                          width: `${dim.score}%`,
                          backgroundColor: getDimensionColor(dim.score)
                        }}
                      />
                    </View>
                  </View>
                  <Text className={styles.dimensionScore}>{dim.score}</Text>
                </View>
              ))}
            </View>
          </View>

          {todayRecord && todayRecord.factors.length > 0 && (
            <View className={styles.factorsSection}>
              <View className={styles.factorsCard}>
                <Text className={styles.sectionTitle}>影响因素</Text>
                <View className={styles.factorsList}>
                  {todayRecord.factors.map((factor, index) => (
                    <Text key={index} className={styles.factorTag}>
                      {factor}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View className={styles.historySection}>
            <View className={styles.historyHeader}>
              <Text className={styles.sectionTitle}>历史记录</Text>
              <Text className={styles.seeMore}>查看全部</Text>
            </View>
            {recentRecords.length > 0 ? (
              recentRecords.map((record) => (
                <SleepCard
                  key={record.id}
                  record={record}
                  compact={true}
                  onClick={() => {
                    console.log('[SleepRecordPage] 点击历史记录', { recordId: record.id });
                  }}
                />
              ))
            ) : (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>📝</Text>
                <Text className={styles.emptyText}>暂无睡眠记录，开始记录吧</Text>
              </View>
            )}
          </View>
      </ScrollView>

      <View
        className={styles.floatingBtn}
        onClick={() => setShowModal(true)}
      >
        <Text className={styles.floatingBtnIcon}>
          {isRecording ? '⏹️' : '➕'}
        </Text>
      </View>

      {showModal && (
        <View className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>记录睡眠</Text>
              <View className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <Text>✕</Text>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>日期</Text>
              <Picker
                mode="date"
                value={formData.date}
                onChange={(e) => updateFormField('date', e.detail.value)}
              >
                <View className={styles.timeDisplay}>{formData.date}</View>
              </Picker>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>睡眠时间</Text>
              <View className={styles.pickerRow}>
                <View className={styles.pickerItem}>
                  <Text className={styles.formLabel} style={{ fontSize: 24 }}>入睡</Text>
                  <Picker
                    mode="time"
                    value={formData.bedtime}
                    onChange={(e) => updateFormField('bedtime', e.detail.value)}
                  >
                    <View className={styles.timeDisplay}>{formData.bedtime}</View>
                  </Picker>
                </View>
                <View className={styles.pickerItem}>
                  <Text className={styles.formLabel} style={{ fontSize: 24 }}>起床</Text>
                  <Picker
                    mode="time"
                    value={formData.wakeupTime}
                    onChange={(e) => updateFormField('wakeupTime', e.detail.value)}
                  >
                    <View className={styles.timeDisplay}>{formData.wakeupTime}</View>
                  </Picker>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>夜间醒来次数</Text>
              <View className={styles.counterRow}>
                <View>
                  <Text className={styles.counterValue}>{formData.nightWakings}</Text>
                  <Text className={styles.counterUnit}>次</Text>
                </View>
                <View className={styles.counterControls}>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('nightWakings', Math.max(0, formData.nightWakings - 1))}
                  >
                    -
                  </Button>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('nightWakings', formData.nightWakings + 1)}
                  >
                    +
                  </Button>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>午睡时长</Text>
              <View className={styles.counterRow}>
                <View>
                  <Text className={styles.counterValue}>{formData.napDuration}</Text>
                  <Text className={styles.counterUnit}>分钟</Text>
                </View>
                <View className={styles.counterControls}>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('napDuration', Math.max(0, formData.napDuration - 15))}
                  >
                    -
                  </Button>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('napDuration', formData.napDuration + 15)}
                  >
                    +
                  </Button>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>咖啡摄入</Text>
              <View className={styles.counterRow}>
                <View>
                  <Text className={styles.counterValue}>{formData.coffeeIntake}</Text>
                  <Text className={styles.counterUnit}>杯</Text>
                </View>
                <View className={styles.counterControls}>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('coffeeIntake', Math.max(0, formData.coffeeIntake - 1))}
                  >
                    -
                  </Button>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('coffeeIntake', formData.coffeeIntake + 1)}
                  >
                    +
                  </Button>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>运动时长</Text>
              <View className={styles.counterRow}>
                <View>
                  <Text className={styles.counterValue}>{formData.exercise}</Text>
                  <Text className={styles.counterUnit}>分钟</Text>
                </View>
                <View className={styles.counterControls}>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('exercise', Math.max(0, formData.exercise - 15))}
                  >
                    -
                  </Button>
                  <Button
                    className={styles.counterBtn}
                    onClick={() => updateFormField('exercise', formData.exercise + 15)}
                  >
                    +
                  </Button>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注</Text>
              <Textarea
                className={styles.inputField}
                placeholder="记录一下今天的睡眠感受..."
                value={formData.notes}
                onInput={(e) => updateFormField('notes', e.detail.value)}
                maxlength={200}
              />
            </View>

            {previewScore !== null && (
              <View style={{ marginTop: 32, textAlign: 'center' }}>
                <Text style={{ fontSize: 28, color: '#64748B' }}>预计评分</Text>
                <View style={{ marginTop: 16 }}>
                  <ScoreCircle score={previewScore} size="medium" showLabel={true} />
                </View>
              </View>
            )}

            <Button className={styles.submitBtn} onClick={handleSubmit}>
              保存记录
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default SleepRecordPage;
