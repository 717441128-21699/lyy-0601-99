import React, { useState } from 'react';
import { View, Text, ScrollView, Button, Image } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useSleepStore } from '@/store/sleepStore';
import dayjs from 'dayjs';

const MinePage: React.FC = () => {
  const { userProfile, records, appSettings } = useSleepStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[MinePage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[MinePage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const totalRecords = records.length;
  const goodSleepDays = records.filter(r => r.quality === 'good').length;
  const avgScore = totalRecords > 0
    ? Math.round(records.reduce((acc, r) => acc + r.score, 0) / totalRecords)
    : 0;
  const currentStreak = calculateStreak();

  function calculateStreak() {
    let streak = 0;
    const today = dayjs();
    for (let i = 0; i < records.length; i++) {
      const recordDate = dayjs(records[i].date);
      if (recordDate.isSame(today.subtract(i, 'day'), 'day') && records[i].score >= 60) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const quickAccessItems = [
    {
      icon: '🧘',
      name: '放松训练',
      desc: '呼吸放松 · 白噪音',
      bgColor: '#EEF2FF',
      iconColor: '#5B67E8',
      action: () => Taro.navigateTo({ url: '/pages/relax/index' })
    },
    {
      icon: '✅',
      name: '习惯计划',
      desc: '培养健康作息',
      bgColor: '#D1FAE5',
      iconColor: '#10B981',
      action: () => Taro.navigateTo({ url: '/pages/habit/index' })
    },
    {
      icon: '📊',
      name: '报告分享',
      desc: '查看睡眠报告',
      bgColor: '#FEF3C7',
      iconColor: '#F59E0B',
      action: () => Taro.navigateTo({ url: '/pages/report/index' })
    },
    {
      icon: '⚙️',
      name: '设置',
      desc: '个性化设置',
      bgColor: '#EDE9FE',
      iconColor: '#8B5CF6',
      action: () => Taro.navigateTo({ url: '/pages/settings/index' })
    }
  ];

  const settingsItems = [
    { icon: '👤', name: '个人资料', value: '编辑个人信息', action: () => {} },
    { icon: '🎯', name: '睡眠目标', value: `${userProfile.targetSleepDuration}小时/天`, action: () => {} },
    { icon: '🔔', name: '通知设置', value: appSettings.notificationsEnabled ? '已开启' : '已关闭', action: () => {} },
    { icon: '☁️', name: '数据备份', value: appSettings.autoBackup ? '自动备份' : '手动备份', action: () => {} },
    { icon: '📱', name: '关于我们', value: 'v1.0.0', action: () => {} }
  ];

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header} />

          <View className={styles.userCard}>
            <View className={styles.userInfo}>
              <View className={styles.avatar}>
                {userProfile.avatar ? (
                  <Image src={userProfile.avatar} mode="aspectFill" />
                ) : (
                  <Text>{userProfile.name.charAt(0)}</Text>
                )}
              </View>
              <View className={styles.userDetails}>
                <Text className={styles.userName}>{userProfile.name}</Text>
                <Text className={styles.userDesc}>
                  {userProfile.age}岁 · {userProfile.gender === 'male' ? '男' : '女'}
                </Text>
              </View>
              <Button className={styles.editBtn}>编辑</Button>
            </View>

            <View className={styles.statsRow}>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{totalRecords}</Text>
                <Text className={styles.statLabel}>记录天数</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{goodSleepDays}</Text>
                <Text className={styles.statLabel}>优质睡眠</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{avgScore}</Text>
                <Text className={styles.statLabel}>平均评分</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{currentStreak}</Text>
                <Text className={styles.statLabel}>连续达标</Text>
              </View>
            </View>
          </View>

          <View className={styles.quickAccess}>
            <Text className={styles.sectionTitle}>功能入口</Text>
            <View className={styles.quickGrid}>
              {quickAccessItems.map((item, index) => (
                <View key={index} className={styles.quickCard} onClick={item.action}>
                  <View
                    className={styles.quickIcon}
                    style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                  >
                    {item.icon}
                  </View>
                  <Text className={styles.quickName}>{item.name}</Text>
                  <Text className={styles.quickDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.settingsSection}>
            <Text className={styles.sectionTitle}>设置</Text>
            <View className={styles.settingsList}>
              {settingsItems.map((item, index) => (
                <View key={index} className={styles.settingsItem} onClick={item.action}>
                  <View className={styles.settingsIcon} style={{ backgroundColor: '#EEF2FF' }}>
                    {item.icon}
                  </View>
                  <View className={styles.settingsInfo}>
                    <Text className={styles.settingsName}>{item.name}</Text>
                    <Text className={styles.settingsValue}>{item.value}</Text>
                  </View>
                  <Text className={styles.settingsArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              健康小贴士
            </Text>
            <Text className={styles.tipsContent}>
              坚持记录睡眠，养成良好的作息习惯。成年人建议每天保持7-9小时的睡眠时间，睡前避免使用电子设备，保持卧室安静、黑暗和凉爽。
            </Text>
          </View>

          <Text className={styles.versionInfo}>睡眠健康 v1.0.0</Text>
        </ScrollView>
    </View>
  );
};

export default MinePage;
