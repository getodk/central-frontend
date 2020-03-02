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
  random: {
    hash: (length) => {
      if (length < 1) throw new RangeError('invalid length');
      let result = '';
      for (let i = 0; i < length; i += 1)
        result += faker.random.number({ max: 15 }).toString(16);
      return result;
    }
  }
});



////////////////////////////////////////////////////////////////////////////////
// EXPORT

export default faker;
