import AV from '../libs/av-weapp-min';

export const LINK = 'Link';
export const STATUS_PENDING = 10;
export const STATUS_READY = 5;
export const STATUS_HEARD = 15;

class Link extends AV.Object {
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
}

AV.Object.register(Link, LINK);

export default Link;
