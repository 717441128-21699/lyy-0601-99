import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button, Picker, Switch, Input } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ReminderItem from '@/components/ReminderItem';
import { useReminderStore } from '@/store/reminderStore';
import type { Reminder } from '@/types/sleep';
import dayjs from 'dayjs';

const ReminderPage: React.FC = () => {
  const { reminders, toggleReminder, addReminder, updateReminder } = useReminderStore();
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    type: 'bedtime' as Reminder['type'],
    title: '',
    description: '',
    time: '22:30',
    repeat: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    sound: '轻柔铃声',
    vibration: true,
    enabled: true
  });

  useDidShow(() => {
    console.log('[ReminderPage] 页面显示');
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('[ReminderPage] 下拉刷新');
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

  const getNextReminder = () => {
    const now = dayjs();
    const currentTime = now.hour() * 60 + now.minute();

    let nextReminder: Reminder | null = null;
    let minDiff = Infinity;

    reminders.filter(r => r.enabled).forEach(reminder => {
      const [h, m] = reminder.time.split(':').map(Number);
      const reminderTime = h * 60 + m;
      let diff = reminderTime - currentTime;
      if (diff < 0) diff += 24 * 60;

      if (diff < minDiff) {
        minDiff = diff;
        nextReminder = reminder;
      }
    });

    return nextReminder;
  };

  const nextReminder = getNextReminder();

  const reminderTypes = [
    { type: 'bedtime' as const, icon: '🌙', name: '就寝提醒' },
    { type: 'wakeup' as const, icon: '⏰', name: '起床闹钟' },
    { type: 'screen' as const, icon: '📱', name: '屏幕关闭' },
    { type: 'abnormal' as const, icon: '⚠️', name: '异常提醒' }
  ];

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const handleOpenModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFormData({
        type: reminder.type,
        title: reminder.title,
        description: reminder.description,
        time: reminder.time,
        repeat: [...reminder.repeat],
        sound: reminder.sound || '轻柔铃声',
        vibration: reminder.vibration ?? true,
        enabled: reminder.enabled
      });
    } else {
      setEditingReminder(null);
      const defaultType = reminderTypes[0];
      setFormData({
        type: defaultType.type,
        title: defaultType.name,
        description: defaultType.type === 'bedtime' ? '准备开始睡前放松' : defaultType.type === 'wakeup' ? '美好的一天开始了' : '',
        time: '22:30',
        repeat: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        sound: '轻柔铃声',
        vibration: true,
        enabled: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReminder(null);
  };

  const handleToggleRepeat = (day: string) => {
    setFormData(prev => {
      const newRepeat = prev.repeat.includes(day)
        ? prev.repeat.filter(d => d !== day)
        : [...prev.repeat, day];
      return { ...prev, repeat: newRepeat };
    });
  };

  const handleSubmit = () => {
    try {
      if (editingReminder) {
        updateReminder(editingReminder.id, formData);
        Taro.showToast({ title: '提醒已更新', icon: 'success' });
      } else {
        addReminder(formData);
        Taro.showToast({ title: '提醒已添加', icon: 'success' });
      }
      handleCloseModal();
    } catch (error) {
      console.error('[ReminderPage] 保存提醒失败', error);
      Taro.showToast({ title: '保存失败', icon: 'error' });
    }
  };

  const handleTypeChange = (type: Reminder['type']) => {
    const typeInfo = reminderTypes.find(t => t.type === type);
    setFormData(prev => ({
      ...prev,
      type,
      title: typeInfo?.name || '',
      description: type === 'bedtime' ? '准备开始睡前放松' : type === 'wakeup' ? '美好的一天开始了' : type === 'screen' ? '请关闭电子设备' : '连续睡眠质量不佳'
    }));
  };

  const enabledReminders = reminders.filter(r => r.enabled);
  const disabledReminders = reminders.filter(r => !r.enabled);

  return (
    <View className={styles.page}>
      <ScrollView scrollY refresherEnabled refresherTriggered={isRefreshing} onRefresherRefresh={handleRefresh}>
          <View className={styles.header}>
            <View className={styles.headerContent}>
              <View className={styles.headerText}>
                <Text className={styles.greeting}>{getGreeting()}</Text>
                <Text className={styles.title}>提醒中心</Text>
              </View>
              {nextReminder && (
                <View className={styles.nextReminder}>
                  <Text className={styles.nextLabel}>下一个提醒</Text>
                  <Text className={styles.nextTime}>{nextReminder.time}</Text>
                  <Text className={styles.nextTitle}>{nextReminder.title}</Text>
                </View>
              )}
            </View>
          </View>

          <View className={styles.quickAdd}>
            <Button className={styles.addBtn} onClick={() => handleOpenModal()}>
              <Text className={styles.addIcon}>➕</Text>
              添加新提醒
            </Button>
          </View>

          <View className={styles.reminderList}>
            {enabledReminders.length > 0 && (
              <>
                <View className={styles.sectionHeader}>
                  <Text className={styles.sectionTitle}>已开启的提醒</Text>
                  <Text className={styles.sectionCount}>{enabledReminders.length}个</Text>
                </View>
                {enabledReminders.map(reminder => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={() => toggleReminder(reminder.id)}
                    onClick={() => handleOpenModal(reminder)}
                  />
                ))}
              </>
            )}

            {disabledReminders.length > 0 && (
              <>
                <View className={styles.sectionHeader} style={{ marginTop: 32 }}>
                  <Text className={styles.sectionTitle}>已关闭的提醒</Text>
                  <Text className={styles.sectionCount}>{disabledReminders.length}个</Text>
                </View>
                {disabledReminders.map(reminder => (
                  <ReminderItem
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={() => toggleReminder(reminder.id)}
                    onClick={() => handleOpenModal(reminder)}
                  />
                ))}
              </>
            )}

            {reminders.length === 0 && (
              <View className={styles.emptyState}>
                <Text className={styles.emptyIcon}>⏰</Text>
                <Text className={styles.emptyText}>暂无提醒，点击上方按钮添加</Text>
              </View>
            )}
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsTitle}>
              <Text>💡</Text>
              温馨提示
            </Text>
            <Text className={styles.tipsContent}>
              • 就寝提醒会在睡前提醒您开始放松准备{'\n'}
              • 起床闹钟支持设置重复和自定义铃声{'\n'}
              • 屏幕关闭提示帮助您减少睡前使用手机{'\n'}
              • 异常提醒会在连续睡眠质量不佳时发出警告
            </Text>
          </View>
        </ScrollView>

      {showModal && (
        <View className={styles.modalOverlay} onClick={handleCloseModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>
                {editingReminder ? '编辑提醒' : '添加提醒'}
              </Text>
              <View className={styles.closeBtn} onClick={handleCloseModal}>
                <Text>✕</Text>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>提醒类型</Text>
              <View className={styles.typeSelector}>
                {reminderTypes.map(type => (
                  <View
                    key={type.type}
                    className={classnames(styles.typeOption, formData.type === type.type && 'active')}
                    onClick={() => handleTypeChange(type.type)}
                  >
                    <Text className={styles.typeIcon}>{type.icon}</Text>
                    <Text className={styles.typeName}>{type.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>提醒时间</Text>
              <Picker
                mode="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.detail.value }))}
              >
                <View className={styles.timePicker}>{formData.time}</View>
              </Picker>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>重复</Text>
              <View className={styles.repeatSelector}>
                {weekDays.map(day => (
                  <View
                    key={day}
                    className={classnames(styles.repeatDay, formData.repeat.includes(day) && 'active')}
                    onClick={() => handleToggleRepeat(day)}
                  >
                    {day.replace('周', '')}
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>标题</Text>
              <Input
                className={styles.inputField}
                placeholder="请输入提醒标题"
                value={formData.title}
                onInput={(e) => setFormData(prev => ({ ...prev, title: e.detail.value }))}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>描述</Text>
              <Input
                className={styles.inputField}
                placeholder="请输入提醒描述"
                value={formData.description}
                onInput={(e) => setFormData(prev => ({ ...prev, description: e.detail.value }))}
              />
            </View>

            <View className={styles.formGroup}>
              <View className={styles.switchRow}>
                <Text className={styles.switchLabel}>震动</Text>
                <Switch
                  checked={formData.vibration}
                  color="#5B67E8"
                  onChange={(e) => setFormData(prev => ({ ...prev, vibration: e.detail.value }))}
                />
              </View>
              <View className={styles.switchRow}>
                <Text className={styles.switchLabel}>启用提醒</Text>
                <Switch
                  checked={formData.enabled}
                  color="#5B67E8"
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.detail.value }))}
                />
              </View>
            </View>

            <Button className={styles.submitBtn} onClick={handleSubmit}>
              {editingReminder ? '保存修改' : '添加提醒'}
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ReminderPage;
