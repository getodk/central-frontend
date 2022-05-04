/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Field from './field';
import Form from './form';
import Project from './project';
import User from './user';

// This function subclasses the presenter classes, adding a static method named
// from() to each subclass. The from() method will create a new presenter
// object, similar to the constructor, but it will also automatically pass in
// the `i18n` object.
export default (i18n) => {
  const classes = {};
  for (const klass of [Field, Form, Project, User]) {
    const subclass = class extends klass {};
    // eslint-disable-next-line new-cap
    subclass.from = (data) => new subclass(data, i18n);
    classes[klass.name] = subclass;
  }
  return classes;
};
