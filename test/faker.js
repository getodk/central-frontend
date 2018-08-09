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
    },

    pastOrFuture: () => {
      if (faker.random.boolean()) return faker.date.past();
      return faker.date.future();
    }
  },
  app: {
    token: () => faker.random.alphaNumeric(64)
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default faker;
