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
  console.log('Added bookmark: ', url);
  const query = new AV.Query('Link')
    .equalTo('url', url);
  query.first()
    .then(link => {
      if (!link) {
        console.log('Link not exists, should create.');
        const link = new Link(url);
        link.from = request.object.get('owner');
        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        link.setACL(acl);
        return link.save();
      }
      return link;
    })
    .then(link => {
      console.log('Link is ready: ', link.id);
      if (link.get('status') === Link.STATUS_READY) {
        request.object.set('status', Bookmark.STATUS_READY)
      }
      request.object.set('link', link);
      request.object.save();
      if (link.get('status') === Link.STATUS_NORMAL) {
        return toMP3(link.get('url'))
          .then(data => {
            console.log('Oh yeah', data);
            data.status = Link.STATUS_READY;
            link.set(data);
            request.object.set('status', Bookmark.STATUS_READY);
            return Promise.all([
              link.save(),
              request.object.save(),
            ]);
          });
      }
    })
    .then(p => {
      console.log('OK. ', p ? 'And ready.' : '');
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
