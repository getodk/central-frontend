/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
export default class Form {
  constructor(form) {
    this._form = form;
  }

  get xmlFormId() { return this._form.xmlFormId; }
  get name() { return this._form.name; }
  get version() { return this._form.version; }
  get xml() { return this._form.xml; }
  get hash() { return this._form.hash; }
  get state() { return this._form.state; }
  get createdBy() { return this._form.createdBy; }
  get createdAt() { return this._form.createdAt; }
  get updatedAt() { return this._form.updatedAt; }

  // Extended metadata
  get submissions() { return this._form.submissions; }
  get lastSubmission() { return this._form.lastSubmission; }

  nameOrId() { return this.name != null ? this.name : this.xmlFormId; }

  updatedOrCreatedAt() {
    return this.updatedAt != null ? this.updatedAt : this.createdAt;
  }
}
