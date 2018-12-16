const AV = require('leanengine');
const axios = require('axios');
const cheerio = require('cheerio');
const toMP3 = require('./convertor');
const Link = require("./model/Link");
const Bookmark = require('./model/Bookmark');

AV.Cloud.afterSave('Link', request => {
  const url = request.object.get('url');
  return toMP3(url)
    .then(data => {
      console.log('Oh yeah');
      data.status = Link.STATUS_READY;
      request.object.set(data);
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
      if (link.get('status') === Link.STATUS_READY) {
        request.object.set('status', Bookmark.STATUS_READY)
      }
      request.object.set('link', link);
      return request.object.save();
    });
});

AV.Cloud.define('fetch', async request => {
  const url = request.params.url;
  const content = await axios.get(url);
  const $ = cheerio.load(content.data, {
    decodeEntities: false,
  });
  const title = $('title').text().trim();
  const p = $('#page-content .rich_media_content p')
    .slice(0, 4)
    .map(function () {
      return $(this).text().trim().replace(/[\r\n]/g, '');
    })
    .filter(item => !!item)
    .get();

  return {
    title,
    excerpt: p.join(''),
  };
});
