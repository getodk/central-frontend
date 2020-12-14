import Field from '../../src/presenters/field';

import testData from '../data';

describe('Field', () => {
  it('splits the path', () => {
    const field = new Field(testData.fields.string('/g/s'));
    field.splitPath().should.eql(['g', 's']);
  });

  it('returns the path formatted for a column header', () => {
    const field = new Field(testData.fields.string('/g/s'));
    field.header().should.equal('g-s');
  });
});
