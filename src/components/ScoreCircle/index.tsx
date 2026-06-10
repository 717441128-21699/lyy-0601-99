import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { getQualityText } from '@/utils/sleepScore';

interface ScoreCircleProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score, size = 'medium', showLabel = true }) => {
  const quality = score >= 80 ? 'good' : score >= 60 ? 'normal' : 'poor';
  const progress = (score / 100) * 100;
  const circumference = 2 * Math.PI * 88;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const sizeClass = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large
  }[size];

  const qualityColor = {
    good: '#34D399',
    normal: '#FBBF24',
    poor: '#F87171'
  }[quality];

  return (
    <View className={classnames(styles.container, sizeClass)}>
      <View className={styles.circleWrapper}>
        <svg className={styles.svg} viewBox="0 0 200 200">
          <circle
            className={styles.bgCircle}
            cx="100"
            cy="100"
            r="88"
            stroke="#EEF2FF"
            strokeWidth="12"
            fill="none"
          />
          <circle
            className={styles.progressCircle}
            cx="100"
            cy="100"
            r="88"
            stroke={qualityColor}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <View className={styles.content}>
          <Text className={styles.score}>{score}</Text>
          {showLabel && (
            <Text className={styles.label} style={{ color: qualityColor }}>
              {getQualityText(quality)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export default ScoreCircle;
