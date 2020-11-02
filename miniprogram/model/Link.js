import AV from '../libs/av-core-min';

export const LINK = 'Link';
export const STATUS_NORMAL = 0;
export const STATUS_READY = 1;
export const STATUS_DONE = 10;

class Link extends AV.Object {
  constructor(url) {
    super();

    this.url = url;
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
}

AV.Object.register(Link, LINK);

export default Link;
