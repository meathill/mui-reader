const AV = require('leanengine');
const toMP3 = require('./convertor');
const Link = require("./model/Link");

AV.Cloud.afterSave('Link', request => {
  const url = request.object.get('url');
  return toMP3(url)
    .then(file => {
      console.log('Oh yeah');
      request.object.set('file', file);
      return request.object.save();
    })
    .then(() => {
      console.log('OK!');
    });
});

AV.Cloud.afterSave('Bookmark', request => {
  const url = request.object.get('url');
  const query = new AV.Query('Link')
    .equalTo('url', url);
  query.first()
    .catch(() => {
      const link = new Link(url);
      link.from = request.object.get('owner');
      return link.save()
    })
    .then(link => {
      request.object.set('link', link);
      return request.object.save();
    });
});
