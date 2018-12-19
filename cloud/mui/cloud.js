const AV = require('leanengine');
const {toMP3, capture, mergeMP3} = require('./convertor');
const Link = require('./model/Link');
const Global = require('./model/Global');
const {generateRandomString} = require("./helper/util");

AV.Cloud.afterSave('Bookmark', async request => {
  const url = request.object.get('url');
  console.log('Added bookmark: ', url);
  const query = new AV.Query('Link')
    .equalTo('url', url);
  let link = await query.first();

  console.log(link);
  if (!link) {
    console.log('Link not exists, should create.');
    link = new Link(url);
    link.from = request.object.get('owner');
    const acl = new AV.ACL();
    acl.setPublicReadAccess(true);
    link.setACL(acl);
    link = await link.save();
  }

  console.log('Link is ready: ', link.id);
  request.object.set('link', link);
  await request.object.save();

  if (link.get('status') === Link.STATUS_NORMAL) {
    const data = await capture(url);
    data.status = Link.STATUS_READY;
    link.set(data);
    await link.save();
  }
  console.log('OK.');
});

AV.Cloud.define('fetch', async request => {
  const url = request.params.url;
  return await capture(url);
});

AV.Cloud.define('toMP3', async () => {
  const startTime = Date.now();
  let query = new AV.Query('Global')
    .equalTo('key', 'queue');
  let lock = await query.first();
  if (lock && lock.get('value')) { // 有另一个队列函数在跑
    console.log('Another job is running, skip this turn.');
    return;
  }

  query = new AV.Query(Link.Table)
    .equalTo('status', Link.STATUS_READY);
  const link = await query.first();
  if (!link) { // 队列为空
    console.log('No link in queue');
    return;
  }

  if (lock) {
    lock.set('value', true);
  } else {
    lock = new Global('queue', true);
  }
  await lock.save();

  const sessionId = link.get('sessionId') || generateRandomString(12);
  let index = link.get('index') || 0;
  let paragraph = link.get('paragraph');

  for (; index < paragraph.length;) {
    const string = paragraph[index];
    await toMP3(sessionId, string, index);
    const seconds = (Date.now() - startTime) / 1000;
    index ++;
    console.log('Running: ', seconds);
    if (seconds >= 12) {
      link.set({
        index,
        sessionId,
      });
      await link.save();
      lock.set('value', false);
      await lock.save();
      console.log(`Job done. Progress: ${index}/${paragraph.length}.`);
      return;
    }
  }

  const file = await mergeMP3(sessionId);
  link.set({
    file,
    status: Link.STATUS_DONE,
  });
  await link.save();

  lock.set('value', false);
  await lock.save();
});
