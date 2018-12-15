import AV from '../../libs/av-weapp-min';
import {alert, getClipboardData} from '../../libs/Weixin';
import isString from '../../libs/isString';
import {merge} from "../../helper/util";
import Bookmark, {BOOKMARK} from "../../model/Bookmark";
const validUrl = require('../../libs/valid-url');

/* global Page, getApp, wx */

const app = getApp();

Page({
  data: {
    logged: true,
    isLogin: false,
    isSaving: false,

    list: [],
    newUrl: false,
    newUrlOut: false,
  },

  getReady() {
    if (app.globalData.user) {
      this.refresh();
      this.searchClipboard();
    } else {
      this.setData({
        logged: true,
      });
    }
    wx.hideLoading();
  },

  searchClipboard() {
    getClipboardData()
      .then(result => {
        if (!isString(result)) {
          return;
        }
        if (!validUrl.isWebUri(result)) {
          console.log('Not a url');
          return;
        }

        if (this.data.list.find(item => item.url === result)) {
          console.log('Url exists.');
          return;
        }

        this.setData({
          newUrl: result,
        });
      })
      .catch(console.error);
  },
  refresh(createdAt, greater = true) {
    const query = new AV.Query(BOOKMARK)
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
      .then(bookmarks => {
        bookmarks = bookmarks.map(bookmark => ({id: bookmark.id, ...bookmark.toJSON()}));
        const list = merge(this.data.list, bookmarks);
        this.setData({
          list,
        });
      })
      .catch(error => {
        console.error(error.message);
        alert(error.message);
      });
  },
  doAdd() {
    this.setData({
      isSaving: true,
    });
    const bookmark = new Bookmark(this.data.newUrl);
    bookmark.from = app.globalData.user;
    bookmark.save()
      .then(saved => {
        const {list} = this.data;
        list.unshift({
          id: saved.id,
          ...saved.toJSON(),
        });
        this.setData({
          list,
        });
      })
      .then(() => {
        this.setData({
          isSaving: false,
          newUrl: false,
        });
      });
  },
  doCancel() {
    this.setData({
      newUrlOut: true,
    });
    setTimeout(() => {
      this.setData({
        newUrl: false,
      });
    }, 1000);
  },

  onGotUserInfo(event) {
    const {userInfo} = event.detail;
    this.setData({
      isLogin: true,
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
      .then(() => {
        this.setData({
          logged: true,
        });
        this.getReady();
      })
      .catch(error => {
        console.error(error);
        alert(error.message || '登录失败');
      })
      .then(() => {
        this.setData({
          isLogin: false,
        });
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
  onPullDownRefresh() {
    this.refresh();
  },
  onReachBottom() {
    this.refresh(this.data.list[this.data.list.length - 1].createdAt, false);
  }
});
