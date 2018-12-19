const AV = require('leanengine');

const GLOBAL = 'Global';

class Global extends AV.Object {
  constructor(key, value) {
    super();

    this.key = key;
    this.value = value;
  }

  get key() {
    return this.get('key');
  }
  set key(value) {
    this.set('key', value);
  }

  get value() {
    return this.get('value');
  }
  set value(value) {
    this.set('value', value);
  }
}

Global.Table = GLOBAL;

AV.Object.register(Global, GLOBAL);

module.exports = Global;
