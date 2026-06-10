import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useReminderStore } from '@/store/reminderStore';
// 全局样式
import './app.scss';

function App(props) {
  const { init, stopNoise } = useReminderStore();

  useEffect(() => {
    init();
    console.log('[App] 应用初始化完成');
  }, []);

  // 对应 onShow
  useDidShow(() => {
    console.log('[App] 应用显示');
  });

  // 对应 onHide
  useDidHide(() => {
    stopNoise();
    console.log('[App] 应用隐藏，停止白噪音');
  });

  return props.children;
}

export default App;
