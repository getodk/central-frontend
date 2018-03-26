/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import fakerPackage from 'faker';



////////////////////////////////////////////////////////////////////////////////
// INITIALIZE

const fakerExtensions = {};

const categoryProxy = (categoryName) => new Proxy({}, {
  get(_, name) {
    const extensionsCategory = fakerExtensions[categoryName];
    return extensionsCategory != null && name in extensionsCategory
      ? extensionsCategory[name]
      : fakerPackage[categoryName][name];
  }
});

const faker = new Proxy({}, {
  get(_, name) {
    return name in fakerPackage || name in fakerExtensions
      ? categoryProxy(name)
      : undefined;
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXTENSIONS

Object.assign(fakerExtensions, {
  date: {
    // Like faker.date.past(), but returns a date on or after the specified
    // date.
    pastSince: (sinceString) => {
      const from = new Date(sinceString);
      const to = new Date();
      to.setTime(to.getTime() - 1000);
      if (from.getTime() > to.getTime()) throw new Error('invalid since date');
      return faker.date.between(from.toISOString(), to.toISOString());
    }
  },
  app: {
    token: () => faker.random.alphaNumeric(64)
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default faker;
