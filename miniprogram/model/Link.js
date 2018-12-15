import AV from '../libs/av-weapp-min';

export const LINK = 'Link';

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

  get status() {
    return this.get('status');
  }
  set status(value) {
    this.set('status', value);
  }
}

AV.Object.register(Link, LINK);

export default Link;
