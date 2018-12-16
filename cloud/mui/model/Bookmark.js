const AV = require('leanengine');

const BOOKMARK = 'Bookmark';
const STATUS_PENDING = 10;
const STATUS_READY = 5;
const STATUS_COMPLETE = 15;

class Bookmark extends AV.Object {
  constructor(url) {
    super();

    this.url = url;
    this.status = STATUS_PENDING;
  }

  get url() {
    return this.get('url');
  }
  set url(value) {
    this.set('url', value);
  }

  get status() {
    return this.get('status');
  }
  set status(value) {
    this.set('status', value);
  }

  get owner() {
    return this.get('owner');
  }
  set from(value) {
    this.set('owner', value);
  }
}

Bookmark.STATUS_PENDING = STATUS_PENDING;
Bookmark.STATUS_READY = STATUS_READY;
Bookmark.STATUS_COMPLETE = STATUS_COMPLETE;

AV.Object.register(Bookmark, BOOKMARK);

module.exports = Bookmark;
