import {confirm, getAuthSetting, getUserInfo, setApp} from './libs/Weixin';
import {LEAN_APP_ID, LEAN_APP_SECRET} from './config/av';
import AV from './libs/av-core-min';
const Adapter = require('./libs/leancloud-adapters-weapp');

AV.setAdapters(Adapter);

App({
  onLaunch: function(options) {
    const {scene = ''} = options;
    setApp(this);

    // 获取用户信息
    const userInfo = getAuthSetting('scope.userInfo')
      .then(enabled => {
        if (enabled) {
          return getUserInfo();
        }
      })
      .catch(() => {
        console.log('Not enabled "getUserInfo".');
      })
      .then(userInfo => {
        this.globalData.userInfo = userInfo;
      });

    // other initialization work goes here
    AV.init({
      appId: LEAN_APP_ID,
      appKey: LEAN_APP_SECRET,
      serverURLs: 'https://api.mui.meathill.com',
    });
    this.globalData.user = AV.User.current();

    Promise.all([userInfo])
      .then(() => {
        if (this.userInfoReadyCallback) {
          this.userInfoReadyCallback();
        } else {
          this.userInfoReadyCallback = true;
        }
      });

    this.globalData.scene = scene;

    // 检查更新
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager();
      updateManager.onUpdateReady(() => {
        confirm('更新提示', '新版本已准备好，是否重启应用？')
          .then(({confirm}) => {
            if (confirm) {
              updateManager.applyUpdate();
            }
          })
          .catch(err => console.error(err));
      });
    }

  },
  userInfoReadyCallback: null,
  globalData: {
    userInfo: null,
    scene: null,
  },
});
