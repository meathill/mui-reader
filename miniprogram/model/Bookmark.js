import AV from '../libs/av-weapp-min';

export const BOOKMARK = 'Bookmark';
export const STATUS_PENDING = 10;
export const STATUS_READY = 5;
export const STATUS_HEARD = 15;

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

AV.Object.register(Bookmark, BOOKMARK);

export default Bookmark;
