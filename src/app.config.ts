export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/trend/index',
    'pages/reminder/index',
    'pages/mine/index',
    'pages/habit/index',
    'pages/relax/index',
    'pages/report/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#5B67E8',
    navigationBarTitleText: '睡眠健康',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F8F7FF'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#5B67E8',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '睡眠记录'
      },
      {
        pagePath: 'pages/trend/index',
        text: '趋势分析'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒中心'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
