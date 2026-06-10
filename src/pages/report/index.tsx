import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Button, Canvas } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import ScoreCircle from '@/components/ScoreCircle';
import { useSleepStore } from '@/store/sleepStore';
import { calculateSleepScore } from '@/utils/sleepScore';
import dayjs from 'dayjs';

const ReportPage: React.FC = () => {
  const { records, generateReport, userProfile } = useSleepStore();
  const [activePeriod, setActivePeriod] = useState<'week' | 'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<any>(null);

  useDidShow(() => {
    console.log('[ReportPage] 页面显示');
  });

  const roundRect = (ctx: any, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

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

  const generateReportImage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const query = Taro.createSelectorQuery();
        query.select('#reportCanvas')
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0]) {
              reject(new Error('Canvas not found'));
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');
            const dpr = Taro.getSystemInfoSync().pixelRatio;
            
            canvas.width = 750 * dpr;
            canvas.height = 1200 * dpr;
            ctx.scale(dpr, dpr);

            ctx.fillStyle = '#F8F9FC';
            ctx.fillRect(0, 0, 750, 1200);

            const gradient = ctx.createLinearGradient(0, 0, 750, 200);
            gradient.addColorStop(0, '#5B67E8');
            gradient.addColorStop(1, '#8B5CF6');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 750, 200);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${activePeriod === 'week' ? '周' : '月'}度睡眠报告`, 375, 80);
            
            ctx.font = '24px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillText(`${startDate.format('MM.DD')} - ${endDate.format('MM.DD')}`, 375, 130);
            
            ctx.font = '20px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillText(`报告人: ${userProfile.name}`, 375, 170);

            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 4;
            roundRect(ctx, 40, 220, 670, 180, 20);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#333333';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('平均睡眠评分', 80, 270);

            const score = stats.avgScore;
            const endAngle = (score / 100) * Math.PI * 2 - Math.PI / 2;
            
            ctx.beginPath();
            ctx.arc(580, 310, 60, 0, Math.PI * 2);
            ctx.strokeStyle = '#E5E7EB';
            ctx.lineWidth = 12;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(580, 310, 60, -Math.PI / 2, endAngle);
            ctx.strokeStyle = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.fillStyle = '#333333';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(score.toString(), 580, 320);

            ctx.fillStyle = '#666666';
            ctx.font = '22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`平均时长: ${stats.avgDuration}h`, 80, 320);
            ctx.fillText(`优质睡眠: ${stats.goodDays}/${stats.totalDays}天`, 80, 360);

            const statItems = [
              { label: '平均入睡', value: stats.avgBedtime, icon: '🌙' },
              { label: '平均起床', value: stats.avgWakeup, icon: '☀️' },
              { label: '平均夜醒', value: `${stats.avgNightWakings}次`, icon: '🔄' },
              { label: '平均午睡', value: `${stats.avgNap}min`, icon: '😴' }
            ];

            statItems.forEach((item, index) => {
              const x = 40 + (index % 2) * 345;
              const y = 420 + Math.floor(index / 2) * 120;
              
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = 'rgba(0,0,0,0.08)';
              ctx.shadowBlur = 10;
              ctx.shadowOffsetY = 2;
              roundRect(ctx, x, y, 330, 100, 16);
              ctx.fill();
              ctx.shadowBlur = 0;

              ctx.font = '32px sans-serif';
              ctx.fillText(item.icon, x + 30, y + 65);
              
              ctx.fillStyle = '#333333';
              ctx.font = 'bold 24px sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText(item.value, x + 290, y + 50);
              
              ctx.fillStyle = '#999999';
              ctx.font = '20px sans-serif';
              ctx.fillText(item.label, x + 290, y + 85);
            });

            ctx.fillStyle = '#333333';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('📊 数据洞察', 40, 680);

            insights.slice(0, 3).forEach((insight, index) => {
              const y = 720 + index * 100;
              
              ctx.fillStyle = insight.bgColor || '#F3F4F6';
              roundRect(ctx, 40, y, 670, 80, 12);
              ctx.fill();

              ctx.font = '28px sans-serif';
              ctx.fillText(insight.icon, 60, y + 52);
              
              ctx.fillStyle = '#333333';
              ctx.font = 'bold 22px sans-serif';
              ctx.textAlign = 'left';
              ctx.fillText(insight.title, 110, y + 38);
              
              ctx.fillStyle = '#666666';
              ctx.font = '18px sans-serif';
              ctx.fillText(insight.desc.substring(0, 30) + '...', 110, y + 68);
            });

            ctx.fillStyle = '#5B67E8';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('生成时间: ' + dayjs().format('YYYY-MM-DD HH:mm'), 375, 1100);
            
            ctx.fillStyle = '#999999';
            ctx.font = '18px sans-serif';
            ctx.fillText('睡眠健康管理App - 让好睡眠成为习惯', 375, 1140);

            setTimeout(() => {
              Taro.canvasToTempFilePath({
                canvas,
                success: (res) => {
                  console.log('[Report] 图片生成成功', res.tempFilePath);
                  resolve(res.tempFilePath);
                },
                fail: (err) => {
                  console.error('[Report] 图片生成失败', err);
                  reject(err);
                }
              });
            }, 100);
          });
      } catch (e) {
        console.error('[Report] 生成图片异常', e);
        reject(e);
      }
    });
  };

  const shareImage = async (imagePath: string, title: string) => {
    try {
      await Taro.shareFileMessage({
        filePath: imagePath,
        fileName: title,
        success: () => {
          console.log('[Report] 分享成功');
          Taro.showToast({ title: '分享成功', icon: 'success' });
        },
        fail: (err) => {
          console.warn('[Report] 分享失败，使用预览', err);
          Taro.previewImage({
            urls: [imagePath],
            current: imagePath
          });
        }
      });
    } catch (e) {
      console.warn('[Report] 分享异常，使用预览', e);
      Taro.previewImage({
        urls: [imagePath],
        current: imagePath
      });
    }
  };

  const handleShare = async (type: 'doctor' | 'family') => {
    try {
      setIsGenerating(true);
      const title = type === 'doctor' ? '睡眠报告_医生' : '睡眠报告_家人';
      Taro.showLoading({ title: '正在生成报告...', mask: true });
      
      const imagePath = await generateReportImage();
      Taro.hideLoading();
      
      await shareImage(imagePath, title);
    } catch (e) {
      console.error('[Report] 分享失败', e);
      Taro.hideLoading();
      Taro.showToast({ title: '分享失败，请重试', icon: 'none' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async () => {
    Taro.showActionSheet({
      itemList: ['导出为PDF', '导出为图片', '发送邮件'],
      success: async (res) => {
        try {
          setIsGenerating(true);
          Taro.showLoading({ title: '正在生成报告...', mask: true });
          
          const imagePath = await generateReportImage();
          Taro.hideLoading();
          
          if (res.tapIndex === 0) {
            Taro.showModal({
              title: '提示',
              content: 'PDF导出需要安装相应的PDF阅读器，是否继续？',
              success: async (modalRes) => {
                if (modalRes.confirm) {
                  await shareImage(imagePath, '睡眠报告.pdf');
                }
              }
            });
          } else if (res.tapIndex === 1) {
            Taro.saveImageToPhotosAlbum({
              filePath: imagePath,
              success: () => {
                Taro.showToast({ title: '已保存到相册', icon: 'success' });
              },
              fail: (err) => {
                console.warn('[Report] 保存相册失败，使用预览', err);
                Taro.previewImage({
                  urls: [imagePath],
                  current: imagePath
                });
              }
            });
          } else {
            await shareImage(imagePath, '睡眠报告');
          }
        } catch (e) {
          console.error('[Report] 导出失败', e);
          Taro.hideLoading();
          Taro.showToast({ title: '导出失败，请重试', icon: 'none' });
        } finally {
          setIsGenerating(false);
        }
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

          <View className={styles.canvasContainer}>
            <Canvas
              id="reportCanvas"
              type="2d"
              style={{ width: '750px', height: '1200px' }}
            />
          </View>
        </ScrollView>
    </View>
  );
};

export default ReportPage;
