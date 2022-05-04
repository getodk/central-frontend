/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Presenter from './base';

const props = [
  'path',
  'name',
  'type',
  'binary',
  'selectMultiple'
];

export default class Field extends Presenter.define(props) {
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
