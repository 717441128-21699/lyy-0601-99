import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Button, Slider } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockWhiteNoises, mockBedtimeItems } from '@/data/mockReminder';
import type { WhiteNoise, BedtimeItem } from '@/types/sleep';
import { useReminderStore } from '@/store/reminderStore';

const RelaxPage: React.FC = () => {
  const { currentNoise, playingNoise, playNoise, stopNoise } = useReminderStore();
  const [activeTab, setActiveTab] = useState<'breathing' | 'noise' | 'bedtime'>('breathing');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('点击开始');
  const [breathingTime, setBreathingTime] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [volume, setVolume] = useState(50);
  const [bedtimeItems, setBedtimeItems] = useState<BedtimeItem[]>(mockBedtimeItems);

  useDidShow(() => {
    console.log('[RelaxPage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[RelaxPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const breathingPhases = ['吸气...', '保持...', '呼气...', '保持...'];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let phaseInterval: ReturnType<typeof setInterval>;

    if (isBreathing) {
      phaseInterval = setInterval(() => {
        setBreathingPhase(prev => {
          const currentIndex = breathingPhases.indexOf(prev);
          return breathingPhases[(currentIndex + 1) % breathingPhases.length];
        });
      }, 2000);

      interval = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          if (newTime >= breathingTime * 60) {
            setIsBreathing(false);
            setBreathingPhase('训练完成！');
            return prev;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (phaseInterval) clearInterval(phaseInterval);
    };
  }, [isBreathing, breathingTime]);

  const handleToggleBreathing = () => {
    if (isBreathing) {
      setIsBreathing(false);
      setBreathingPhase('已暂停');
    } else {
      setIsBreathing(true);
      setBreathingPhase('吸气...');
      setElapsedTime(0);
    }
  };

  const handleResetBreathing = () => {
    setIsBreathing(false);
    setBreathingPhase('点击开始');
    setElapsedTime(0);
  };

  const handleToggleNoise = (noise: WhiteNoise) => {
    if (playingNoise && currentNoise?.id === noise.id) {
      stopNoise();
    } else {
      playNoise(noise);
      Taro.showToast({ title: `正在播放: ${noise.name}`, icon: 'none' });
    }
  };

  const handleToggleBedtimeItem = (itemId: string) => {
    setBedtimeItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { key: 'breathing' as const, name: '呼吸放松' },
    { key: 'noise' as const, name: '白噪音' },
    { key: 'bedtime' as const, name: '睡前清单' }
  ];

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <Text className={styles.headerTitle}>放松训练</Text>
            <Text className={styles.headerDesc}>
              放松身心，准备进入甜美的梦乡
            </Text>
          </View>

          <View className={styles.tabBar}>
            {tabs.map(tab => (
              <View
                key={tab.key}
                className={classnames(styles.tabItem, activeTab === tab.key && 'active')}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.name}
              </View>
            ))}
          </View>

          {activeTab === 'breathing' && (
            <View className={styles.breathingSection}>
              <View className={classnames(styles.breathingCircle, !isBreathing && 'paused')}>
                <View style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <Text className={styles.breathingText}>
                    {formatTime(elapsedTime)}
                  </Text>
                  <Text className={styles.breathingPhase}>{breathingPhase}</Text>
                </View>
              </View>

              <View className={styles.breathingControls}>
                <Button
                  className={classnames(styles.controlBtn, 'primary')}
                  onClick={handleToggleBreathing}
                >
                  {isBreathing ? '暂停' : '开始训练'}
                </Button>
                <Button
                  className={classnames(styles.controlBtn, 'secondary')}
                  onClick={handleResetBreathing}
                >
                  重置
                </Button>
              </View>

              <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Text style={{ fontSize: 28, color: '#666' }}>训练时长</Text>
                <View className={styles.timerSelect}>
                  {[1, 3, 5, 10].map(min => (
                    <Button
                      key={min}
                      className={classnames(styles.timerOption, breathingTime === min && 'active')}
                      onClick={() => setBreathingTime(min)}
                      disabled={isBreathing}
                    >
                      {min}分钟
                    </Button>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'noise' && (
            <>
              <View className={styles.noiseSection}>
                <Text className={styles.sectionTitle}>白噪音</Text>
                <View className={styles.noiseGrid}>
                  {mockWhiteNoises.map(noise => (
                    <View
                      key={noise.id}
                      className={classnames(styles.noiseCard, currentNoise?.id === noise.id && playingNoise && 'active')}
                      onClick={() => handleToggleNoise(noise)}
                    >
                      <View className={styles.noiseIcon}>{noise.icon}</View>
                      <Text className={styles.noiseName}>{noise.name}</Text>
                      <Text className={styles.noiseDesc}>{noise.description}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {playingNoise && currentNoise && (
                <View className={styles.volumeControl}>
                  <View className={styles.volumeRow}>
                    <Text className={styles.volumeIcon}>🔊</Text>
                    <Slider
                      className={styles.volumeSlider}
                      min={0}
                      max={100}
                      value={volume}
                      activeColor="#5B67E8"
                      backgroundColor="#E5E7EB"
                      blockColor="#5B67E8"
                      onChanging={(e) => setVolume(e.detail.value)}
                    />
                    <Text className={styles.volumeValue}>{volume}%</Text>
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'bedtime' && (
            <View className={styles.bedtimeSection}>
              <Text className={styles.sectionTitle}>睡前清单</Text>
              <View className={styles.bedtimeList}>
                {bedtimeItems.map(item => (
                  <View
                    key={item.id}
                    className={styles.bedtimeItem}
                    onClick={() => handleToggleBedtimeItem(item.id)}
                  >
                    <View className={classnames(styles.bedtimeCheckbox, item.completed && 'checked')}>
                      {item.completed && '✓'}
                    </View>
                    <Text className={classnames(styles.bedtimeText, item.completed && 'checked')}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
    </View>
  );
};

export default RelaxPage;
