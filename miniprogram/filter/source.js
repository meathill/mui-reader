const map = {
  'mp.weixin.qq.com': '微信公众号',
};

export default function getSource(url) {
  url = url.replace(/^https?:\/\//, '');
  url = url.substring(0, url.indexOf('/'));
  return url in map ? map[url] : url;
}
