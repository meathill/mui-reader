const AV = require('leanengine');

const LINK = 'Link';

class Link extends AV.Object {
  constructor(url) {
    super();

    this.url = url;
    this.status = Link.STATUS_NORMAL;
  }

  get url() {
    return this.get('url');
  }
  set url(value) {
    this.set('url', value);
  }

  get from() {
    return this.get('from');
  }
  set from(value) {
    this.set('from', value);
  }

  get status() {
    return this.get('status');
  }
  set status(value) {
    this.set('status', value);
  }
}

Link.STATUS_NORMAL = 0;
Link.STATUS_READY = 1;
Link.STATUS_DONE = 10;
Link.Table = LINK;

AV.Object.register(Link, LINK);

module.exports = Link;
