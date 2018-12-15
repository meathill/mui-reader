import AV from '../../libs/av-weapp-min';
import {alert} from '../../libs/Weixin';

/* global Page, getApp, wx */

const app = getApp();

Page({
  data: {
    logged: false,
    list: null,
  },

  getReady() {
    if (app.globalData.user) {
      this.setData({
        logged: true,
      });
      this.refresh();
    }
    wx.hideLoading();
  },

  refresh(createdAt, greater = true) {
    const query = new AV.Query('link')
      .descending('status')
      .descending('createdAt');
    if (createdAt) {
      if (greater) {
        query.greaterThan('createdAt', createdAt);
      } else {
        query.lessThan('createdAt', createdAt);
      }
    }
    query.limit(1);
    return query.find()
      .then(links => {
        return links.map(link => link.toJSON());
      })
      .catch(error => {
        console.error(error.message);
        alert(error.message);
      });
  },

  onLoad() {
    wx.showLoading({
      title: '加载中',
      mask: true,
    });

    if (app.userInfoReadyCallback) {
      this.getReady();
    } else {
      app.userInfoReadyCallback = () => {
        this.getReady();
      };
    }
  },

  onGotUserInfo(event) {
    const {userInfo} = event.detail;
    this.setData({
      logged: true,
    });

    app.globalData.userInfo = userInfo;
    AV.User.loginWithWeapp()
      .then(me => {
        app.globalData.user = me;
        if (!me.get('nickName')) {
          me.set(userInfo);
          return me.save();
        }
        return me;
      })
      .catch(error => {
        console.error(error);
        alert(error.message || '登录失败');
      });
  }

});
