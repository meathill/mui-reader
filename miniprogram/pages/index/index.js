import AV, {Cloud} from '../../libs/av-core-min';
import {alert, getClipboardData} from '../../libs/Weixin';
import isString from '../../libs/isString';
import {merge, toMinute} from '../../helper/util';
import Bookmark, {BOOKMARK} from '../../model/Bookmark';
import {STATUS_NORMAL, STATUS_READY} from '../../model/Link';
import getSource from '../../filter/source';

const validUrl = require('../../libs/valid-url');

const app = getApp();

Page({
  data: {
    STATUS_READY,

    logged: true,
    isLogin: false,
    isSaving: false,
    isPlaying: false,

    list: [],
    current: -1,
    newUrl: false,
    newUrlOut: false,
  },

  getReady() {
    if (app.globalData.user) {
      this.refresh()
        .then(() => {
          this.searchClipboard();
        });
    } else {
      this.setData({
        logged: false,
      });
    }
    wx.hideLoading();
  },

  searchClipboard() {
    getClipboardData()
      .then(result => {
        if (!result || !isString(result)) {
          throw new Error('Clipboard is empty');
        }
        if (!validUrl.isWebUri(result)) {
          throw new Error('Not a url');
        }

        if (this.data.list.find(item => item.url === result)) {
          throw new Error('Url exists.');
        }

        this.setData({
          newUrl: result,
        });
        return result;
      })
      .then(url => {
        return Cloud.run('fetch', {
          url,
        });
      })
      .then(article => {
        this.setData({
          newArticle: article,
        });
      })
      .catch(console.log);
  },
  refresh(createdAt, greater = true) {
    const query = new AV.Query(BOOKMARK)
      .descending('status')
      .descending('createdAt')
      .include(['link']);
    if (createdAt) {
      if (greater) {
        query.greaterThan('createdAt', createdAt);
      } else {
        query.lessThan('createdAt', createdAt);
      }
    }
    query.limit(10);
    return query.find()
      .then(bookmarks => {
        bookmarks = bookmarks.map(bookmark => {
          return {
            id: bookmark.id,
            ...bookmark.toJSON(),
            percent: 0,
            audioCurrent: '00:00',
            audioDurationText: '00:00',
            isPlayed: false,
            source: getSource(bookmark.get('url')),
          };
        });
        const list = merge(this.data.list, bookmarks);
        this.setData({
          list,
        });
        wx.stopPullDownRefresh();
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
          link: {
            ...this.data.newArticle,
            status: STATUS_NORMAL,
          },
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
    this.audioContext = wx.getBackgroundAudioManager();
    this.audioContext.onPlay(this.onPlay.bind(this));
    this.audioContext.onPause(this.onPause.bind(this));
    this.audioContext.onTimeUpdate(this.onTimeUpdate.bind(this));
    this.audioContext.onEnded(this.onEnded.bind(this));
  },
  onShow() {
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
  },

  // 播放相关
  doActive(event) {
    if (this.data.isPlaying) {
      return;
    }
    const {currentTarget: {dataset: {index}}} = event;
    const {list} = this.data;
    if (!list[index].link || !list[index].link.file) {
      return;
    }
    const current = this.data.list.find(item => item.isActive);
    if (current) {
      current.isActive = false;
    } else if (current !== list[index]) {
      list[index].isActive = true;
    }
    this.setData({
      list,
    });
  },
  doPlay(event) {
    const {target: {dataset: {index}}} = event;
    const {list} = this.data;
    if (list[index].isPlayed) {
      this.audioContext.play();
    } else {
      this.audioContext.src = list[index].link.file.url;
      this.audioContext.title = list[index].link.title || list[index].url;
    }
    list[index].isPlaying = true;
    this.setData({
      current: index,
      list,
    });
  },
  doPause(event) {
    this.audioContext.pause();
    const {target: {dataset: {index}}} = event;
    const {list} = this.data;
    list[index].isPlaying = false;
    this.setData({
      list,
    });
  },
  onPlay() {
    this.setData({
      isPlaying: true,
    });
  },
  onPause() {
    this.setData({
      isPlaying: false,
    });
  },
  onStop() {
    const {list, current} = this.data;
    list[current] = Object.assign(list[current], {
      percent: 0,
      audioCurrent: '00:00',
      audioDurationText: '00:00',
      isPlayed: false,
    });
    this.setData({
      isPlaying: false,
      list,
      current: -1,
    });
  },
  onTimeUpdate() {
    if (!this.data.isPlaying) {
      return;
    }
    const {list, current} = this.data;
    list[current] = Object.assign(list[current], {
      audioCurrent: toMinute(this.audioContext.currentTime),
      audioDurationText: toMinute(this.audioContext.duration),
      percent: this.audioContext.currentTime / this.audioContext.duration * 100 >> 0,
      isPlayed: true,
    });
    this.setData({
      list,
    });
  },
  onEnded() {
    this.setData({
      isPlaying: false,
    });
    const {list, current} = this.data;
    list[current].isComplete = true;
    this.setData({
      list,
    });
  },
});
