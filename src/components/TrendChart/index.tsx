import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { TrendData } from '@/types/sleep';
import dayjs from 'dayjs';

interface TrendChartProps {
  data: TrendData[];
  type?: 'score' | 'duration';
}

const TrendChart: React.FC<TrendChartProps> = ({ data, type = 'score' }) => {
  const maxValue = type === 'score' ? 100 : 12;
  const chartHeight = 200;

  const getPoints = () => {
    if (data.length === 0) return '';

    const width = 650;
    const padding = 30;
    const usableWidth = width - padding * 2;
    const step = usableWidth / (data.length - 1 || 1);

    return data
      .map((item, index) => {
        const x = padding + index * step;
        const value = type === 'score' ? item.score : item.duration;
        const y = chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  };

  const getAreaPath = () => {
    if (data.length === 0) return '';

    const width = 650;
    const padding = 30;
    const usableWidth = width - padding * 2;
    const step = usableWidth / (data.length - 1 || 1);

    const points = data.map((item, index) => {
      const x = padding + index * step;
      const value = type === 'score' ? item.score : item.duration;
      const y = chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2);
      return { x, y };
    });

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return `M ${firstPoint.x} ${chartHeight - padding} 
            L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}
            L ${lastPoint.x} ${chartHeight - padding} Z`;
  };

  const formatXLabel = (date: string, index: number) => {
    if (data.length <= 7) {
      return dayjs(date).format('DD');
    }
    if (index % 2 === 0) {
      return dayjs(date).format('MM/DD');
    }
    return '';
  };

  const getAverageValue = () => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => {
      return acc + (type === 'score' ? item.score : item.duration);
    }, 0);
    return Math.round((sum / data.length) * 10) / 10;
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.titleSection}>
          <Text className={styles.title}>
            {type === 'score' ? '睡眠评分' : '睡眠时长'}
          </Text>
          <Text className={styles.subtitle}>
            平均 {getAverageValue()}{type === 'score' ? ' 分' : ' 小时'}
          </Text>
        </View>
        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={styles.legendDot} />
            <Text className={styles.legendText}>实际</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={styles.legendLine} />
            <Text className={styles.legendText}>目标</Text>
          </View>
        </View>
      </View>

      <View className={styles.chartWrapper}>
        <svg
          className={styles.chart}
          viewBox={`0 0 650 ${chartHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5B67E8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#5B67E8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="30"
              y1={30 + i * ((chartHeight - 60) / 4)}
              x2="620"
              y2={30 + i * ((chartHeight - 60) / 4)}
              stroke="#EEF2FF"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

          <line
            x1="30"
            y1={chartHeight - 30 - ((type === 'score' ? 80 : 8) / maxValue) * (chartHeight - 60)}
            x2="620"
            y2={chartHeight - 30 - ((type === 'score' ? 80 : 8) / maxValue) * (chartHeight - 60)}
            stroke="#34D399"
            strokeWidth="2"
            strokeDasharray="6,4"
          />

          <path
            d={getAreaPath()}
            fill="url(#areaGradient)"
          />

          <polyline
            points={getPoints()}
            fill="none"
            stroke="#5B67E8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((item, index) => {
            const padding = 30;
            const usableWidth = 650 - padding * 2;
            const step = usableWidth / (data.length - 1 || 1);
            const x = padding + index * step;
            const value = type === 'score' ? item.score : item.duration;
            const y = chartHeight - padding - (value / maxValue) * (chartHeight - padding * 2);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#5B67E8"
                  strokeWidth="3"
                />
                {index % Math.ceil(data.length / 6) === 0 && (
                  <text
                    x={x}
                    y={chartHeight - 5}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="18"
                  >
                    {formatXLabel(item.date, index)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </View>

      <View className={styles.yLabels}>
        <Text className={styles.yLabel}>{maxValue}</Text>
        <Text className={styles.yLabel}>{Math.round(maxValue * 0.75)}</Text>
        <Text className={styles.yLabel}>{Math.round(maxValue * 0.5)}</Text>
        <Text className={styles.yLabel}>{Math.round(maxValue * 0.25)}</Text>
        <Text className={styles.yLabel}>0</Text>
      </View>
    </View>
  );
};

export default TrendChart;
