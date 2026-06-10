import React from 'react';
import { View, Text, Switch } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Reminder } from '@/types/sleep';

interface ReminderItemProps {
  reminder: Reminder;
  onToggle?: (enabled: boolean) => void;
  onClick?: () => void;
}

const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onToggle, onClick }) => {
  const typeIcons: Record<string, string> = {
    bedtime: '🌙',
    wakeup: '⏰',
    screen: '📱',
    abnormal: '⚠️'
  };

  const typeColors: Record<string, string> = {
    bedtime: '#5B67E8',
    wakeup: '#F59E0B',
    screen: '#8B7EF2',
    abnormal: '#EF4444'
  };

  const typeBgColors: Record<string, string> = {
    bedtime: '#EEF2FF',
    wakeup: '#FEF3C7',
    screen: '#EDE9FE',
    abnormal: '#FEE2E2'
  };

  return (
    <View
      className={classnames(styles.card, !reminder.enabled && styles.disabled)}
      onClick={onClick}
    >
      <View
        className={styles.iconWrapper}
        style={{ backgroundColor: typeBgColors[reminder.type] }}
      >
        <Text className={styles.icon}>{typeIcons[reminder.type]}</Text>
      </View>

      <View className={styles.info}>
        <Text className={styles.title}>{reminder.title}</Text>
        <Text className={styles.description}>{reminder.description}</Text>
        <View className={styles.timeRow}>
          <Text className={styles.time} style={{ color: typeColors[reminder.type] }}>
            {reminder.time}
          </Text>
          <Text className={styles.repeat}>
            {reminder.repeat.length === 7 ? '每天' : reminder.repeat.join(' ')}
          </Text>
        </View>
      </View>

      <Switch
        className={styles.switch}
        checked={reminder.enabled}
        color={typeColors[reminder.type]}
        onChange={(e) => {
          e.stopPropagation();
          onToggle?.(e.detail.value);
        }}
      />
    </View>
  );
};

export default ReminderItem;
