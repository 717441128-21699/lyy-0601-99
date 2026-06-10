import React, { useState } from 'react';
import { View, Text, ScrollView, Button, Switch } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useSleepStore } from '@/store/sleepStore';

const SettingsPage: React.FC = () => {
  const { appSettings, updateAppSettings } = useSleepStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[SettingsPage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[SettingsPage] 下拉刷新');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleToggleSetting = (key: keyof typeof appSettings) => {
    updateAppSettings({ [key]: !appSettings[key] });
    Taro.showToast({
      title: appSettings[key] ? '已关闭' : '已开启',
      icon: 'none'
    });
  };

  const handleTargetSleepDuration = () => {
    Taro.showActionSheet({
      itemList: ['6小时', '7小时', '8小时', '9小时'],
      success: (res) => {
        const durations = [6, 7, 8, 9];
        updateAppSettings({ targetSleepDuration: durations[res.tapIndex] });
        Taro.showToast({ title: '已更新', icon: 'success' });
      }
    });
  };

  const handleThemeChange = () => {
    Taro.showActionSheet({
      itemList: ['浅色模式', '深色模式', '跟随系统'],
      success: (res) => {
        const themes = ['light', 'dark', 'system'];
        updateAppSettings({ theme: themes[res.tapIndex] as 'light' | 'dark' | 'system' });
        Taro.showToast({ title: '已更新', icon: 'success' });
      }
    });
  };

  const handleLanguageChange = () => {
    Taro.showActionSheet({
      itemList: ['简体中文', 'English'],
      success: (res) => {
        const languages = ['zh-CN', 'en-US'];
        updateAppSettings({ language: languages[res.tapIndex] as 'zh-CN' | 'en-US' });
        Taro.showToast({ title: '已更新', icon: 'success' });
      }
    });
  };

  const handleClearData = () => {
    Taro.showModal({
      title: '确认清除数据',
      content: '清除后所有睡眠记录将被删除，此操作不可恢复。',
      confirmColor: '#F87171',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '数据已清除', icon: 'success' });
        }
      }
    });
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出登录',
      content: '退出后将无法同步数据，确定要退出吗？',
      confirmColor: '#5B67E8',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  };

  const getThemeLabel = () => {
    switch (appSettings.theme) {
      case 'light': return '浅色模式';
      case 'dark': return '深色模式';
      case 'system': return '跟随系统';
      default: return '跟随系统';
    }
  };

  const getLanguageLabel = () => {
    switch (appSettings.language) {
      case 'zh-CN': return '简体中文';
      case 'en-US': return 'English';
      default: return '简体中文';
    }
  };

  const settingsGroups = [
    {
      title: '个性化设置',
      items: [
        {
          icon: '🎯',
          bgColor: '#EEF2FF',
          iconColor: '#5B67E8',
          name: '睡眠目标',
          desc: '每日期望睡眠时间',
          value: `${appSettings.targetSleepDuration}小时`,
          action: handleTargetSleepDuration
        },
        {
          icon: '🎨',
          bgColor: '#EDE9FE',
          iconColor: '#8B5CF6',
          name: '主题模式',
          desc: '调整应用显示主题',
          value: getThemeLabel(),
          action: handleThemeChange
        },
        {
          icon: '🌐',
          bgColor: '#DBEAFE',
          iconColor: '#3B82F6',
          name: '语言设置',
          desc: '选择应用语言',
          value: getLanguageLabel(),
          action: handleLanguageChange
        }
      ]
    },
    {
      title: '通知设置',
      items: [
        {
          icon: '🔔',
          bgColor: '#FEF3C7',
          iconColor: '#F59E0B',
          name: '推送通知',
          desc: '接收睡眠提醒和报告',
          toggle: true,
          toggleKey: 'notificationsEnabled' as const
        },
        {
          icon: '🌙',
          bgColor: '#E0E7FF',
          iconColor: '#6366F1',
          name: '就寝提醒',
          desc: '睡前提醒放松准备',
          toggle: true,
          toggleKey: 'bedtimeReminderEnabled' as const
        },
        {
          icon: '⏰',
          bgColor: '#D1FAE5',
          iconColor: '#10B981',
          name: '起床闹钟',
          desc: '每日智能唤醒服务',
          toggle: true,
          toggleKey: 'wakeupAlarmEnabled' as const
        },
        {
          icon: '⚠️',
          bgColor: '#FEE2E2',
          iconColor: '#EF4444',
          name: '异常提醒',
          desc: '连续睡眠不佳时警告',
          toggle: true,
          toggleKey: 'abnormalReminderEnabled' as const
        }
      ]
    },
    {
      title: '数据管理',
      items: [
        {
          icon: '☁️',
          bgColor: '#DBEAFE',
          iconColor: '#3B82F6',
          name: '自动备份',
          desc: '云端自动备份睡眠数据',
          toggle: true,
          toggleKey: 'autoBackup' as const
        },
        {
          icon: '📊',
          bgColor: '#FCE7F3',
          iconColor: '#EC4899',
          name: '数据统计',
          desc: '允许匿名数据统计',
          toggle: true,
          toggleKey: 'dataAnalytics' as const
        },
        {
          icon: '🔒',
          bgColor: '#E0E7FF',
          iconColor: '#6366F1',
          name: '隐私保护',
          desc: '查看隐私政策和协议',
          action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
        },
        {
          icon: '❓',
          bgColor: '#FEF3C7',
          iconColor: '#F59E0B',
          name: '帮助与反馈',
          desc: '常见问题和意见反馈',
          action: () => Taro.showToast({ title: '功能开发中', icon: 'none' })
        }
      ]
    }
  ];

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <Text className={styles.headerTitle}>设置</Text>
            <Text className={styles.headerDesc}>
              个性化您的睡眠健康助手
            </Text>
          </View>

          {settingsGroups.map((group, groupIndex) => (
            <View key={groupIndex} className={styles.settingsSection}>
              <Text className={styles.sectionTitle}>{group.title}</Text>
              <View className={styles.settingsCard}>
                {group.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    className={styles.settingsItem}
                    onClick={item.action}
                  >
                    <View
                      className={styles.settingsIcon}
                      style={{ backgroundColor: item.bgColor, color: item.iconColor }}
                    >
                      {item.icon}
                    </View>
                    <View className={styles.settingsInfo}>
                      <Text className={styles.settingsName}>{item.name}</Text>
                      <Text className={styles.settingsDesc}>{item.desc}</Text>
                    </View>
                    {item.toggle ? (
                      <View className={styles.switchRow}>
                        <Switch
                          checked={appSettings[item.toggleKey!]}
                          color="#5B67E8"
                          onChange={() => handleToggleSetting(item.toggleKey!)}
                        />
                      </View>
                    ) : (
                      <View className={styles.switchRow}>
                        {item.value && <Text className={styles.settingsValue}>{item.value}</Text>}
                        <Text className={styles.settingsArrow}>›</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Button className={styles.dangerBtn} onClick={handleClearData}>
            🗑️ 清除所有数据
          </Button>

          <Button
            className={styles.dangerBtn}
            style={{ backgroundColor: '#EEF2FF', color: '#5B67E8' }}
            onClick={handleLogout}
          >
            🚪 退出登录
          </Button>

          <View className={styles.aboutSection}>
            <Text className={styles.appName}>睡眠健康</Text>
            <Text className={styles.appVersion}>v1.0.0</Text>
            <Text className={styles.appDesc}>
              科学睡眠，健康生活{'\n'}
              让每一天都从好睡眠开始
            </Text>
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              温馨提示
            </Text>
            <Text className={styles.tipsContent}>
              • 开启通知可以及时收到睡眠提醒{'\n'}
              • 自动备份功能防止数据丢失{'\n'}
              • 如有任何问题，请联系客服支持{'\n'}
              • 版本更新会带来更多新功能
            </Text>
          </View>
        </ScrollView>
    </View>
  );
};

export default SettingsPage;
