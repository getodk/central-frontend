import fakerPackage from 'faker';
import { DateTime } from 'luxon';



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
// UNIQUE RESULTS

const uniqueResults = [];

// Returns a function that invokes `callback` until it returns a value that has
// not been seen before.
const uniqueResult = (callback) => {
  const results = new Set();
  uniqueResults.push(results);
  return (...args) => {
    let result;
    do {
      result = callback(...args);
    } while (results.has(result));
    results.add(result);
    return result;
  };
};

export const clearUniqueFakerResults = () => {
  for (const results of uniqueResults)
    results.clear();
};



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
    },

    timestamps: (inPast, sinceStrings = undefined) => {
      if (!inPast)
        return { createdAt: new Date().toISOString(), updatedAt: null };
      const sinceDateTimes = sinceStrings != null
        ? sinceStrings.filter(s => s != null).map(s => DateTime.fromISO(s))
        : [];
      const createdAt = sinceDateTimes.length !== 0
        ? faker.date.pastSince(DateTime.max(...sinceDateTimes).toISO()).toISOString()
        : faker.date.past().toISOString();
      const updatedAt = faker.random.boolean()
        ? faker.date.pastSince(createdAt).toISOString()
        : null;
      return { createdAt, updatedAt };
    }
  },
  internet: {
    uniqueEmail: uniqueResult(() => faker.internet.email())
  },
  central: {
    token: uniqueResult(() => faker.random.alphaNumeric(64)),
    xmlFormId: uniqueResult(() => `a${faker.random.alphaNumeric(8)}`)
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default faker;
