import { last } from 'ramda';

// eslint-disable-next-line import/prefer-default-export
export const fields = {};
const types = [
  'structure',
  'repeat',
  'string',
  'int',
  'decimal',
  'date',
  'time',
  'dateTime',
  'geopoint',
  'binary'
];
for (const type of types) {
  fields[type] = (path) => ({
    path,
    name: last(path.split('/')),
    type,
    binary: type === 'binary' ? true : null
  });
}
fields.group = fields.structure;
