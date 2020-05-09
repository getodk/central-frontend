/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Base from './base';

const props = [
  'id',
  'name',
  'archived',
  'keyId',
  'createdAt',
  'updatedAt',
  // Extended metadata
  'forms',
  'lastSubmission',
  'appUsers',
  'verbs'
];

export default class Project extends Base(props) {
  constructor(data) {
    super(data);
    this._verbSet = data.verbs != null ? new Set(data.verbs) : null;
  }

  nameWithArchived() {
    return this.archived ? this.t('nameWithArchived', this.object) : this.name;
  }

  permits(verbOrVerbs) {
    return !Array.isArray(verbOrVerbs)
      ? this._verbSet.has(verbOrVerbs)
      : verbOrVerbs.every(verb => this._verbSet.has(verb));
  }
}
