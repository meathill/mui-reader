const AV = require('leanengine');
const toMP3 = require('./convertor');

/**
 * 一个简单的云代码方法
 */
AV.Cloud.define('hello', function(request) {
  return 'Hello world!';
});

AV.Cloud.afterSave('Link', request => {
  const url = request.object.get('url');
  return toMP3(url)
    .then(() => {
      console.log('Oh yeah');
    });
});
