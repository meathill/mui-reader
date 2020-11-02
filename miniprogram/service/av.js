import AV from '../libs/av-core-min';

export function login(userInfo, app) {
  return AV.User.loginWithWeapp()
    .then(user => {
      if (!user.get('nickName')) {
        user.set(userInfo);
        return user.save();
      }
      return user;
    })
    .then(user => {
      const userInfo = user.toJSON();
      app.globalData.user = user;
      app.globalData.userInfo = userInfo;
      return userInfo;
    })
    .catch(error => {
      console.error(error);
      alert(error.message || '登录失败，请稍后重试');
    });
}
