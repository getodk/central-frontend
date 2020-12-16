import { presenterClass } from './base';

const props = [
  'path',
  'name',
  'type',
  'binary'
];

export default class Field extends presenterClass(props) {
  splitPath() {
    if (this._split == null) {
      this._split = this.path.split('/');
      this._split.shift();
    }
    return this._split;
  }

  header() {
    if (this._header == null) this._header = this.splitPath().join('-');
    return this._header;
  }
}
