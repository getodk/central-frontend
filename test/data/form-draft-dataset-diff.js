import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import Property from '../util/ds-property-enum';


// eslint-disable-next-line import/prefer-default-export
export const formDraftDatasetDiffs = dataStore({
  factory: ({
    isNew,
    properties
  }) => ({
    name: faker.random.alphaNumeric(10),
    isNew,
    properties: properties.map(p => {
      switch (p) {
        case Property.InFormProperty:
          return { name: faker.random.alphaNumeric(10), isNew: false, inForm: true };
        case Property.NewProperty:
          return { name: faker.random.alphaNumeric(10), isNew: true, inForm: true };
        default:
          return { name: faker.random.alphaNumeric(10), isNew: false, inForm: false };
      }
    })
  }),
  sort: comparator((diff1, diff2) => diff1.name < diff2.name)
});



