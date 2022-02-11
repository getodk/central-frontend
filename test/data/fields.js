import { last, map } from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const fields = map(
  (props) => (path) => ({
    path,
    name: last(path.split('/')),
    binary: null,
    selectMultiple: null,
    ...props
  }),
  {
    group: { type: 'structure' },
    repeat: { type: 'repeat' },
    int: { type: 'int' },
    decimal: { type: 'decimal' },
    string: { type: 'string' },
    selectMultiple: { type: 'string', selectMultiple: true },
    date: { type: 'date' },
    time: { type: 'time' },
    dateTime: { type: 'dateTime' },
    geopoint: { type: 'geopoint' },
    binary: { type: 'binary', binary: true }
  }
);
