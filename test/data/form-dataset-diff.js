import faker from 'faker';
import { comparator } from 'ramda';

import { dataStore } from './data-store';
import Property from '../util/ds-property-enum';

// eslint-disable-next-line import/prefer-default-export
export const formDatasetDiffs = dataStore({
  factory: ({
    properties
  }) => ({
    name: faker.random.alphaNumeric(10),
    properties: properties.map(p => {
      switch (p) {
        case Property.InFormProperty:
          return { name: faker.random.alphaNumeric(10), inForm: true };
        case Property.NewProperty:
          return { name: faker.random.alphaNumeric(10), inForm: true };
        default:
          return { name: faker.random.alphaNumeric(10), inForm: false };
      }
    })
  }),
  sort: comparator((dataset1, dataset2) => dataset1.name < dataset2.name)
});
