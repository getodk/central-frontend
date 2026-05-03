import { odataLiteral } from '../../src/util/odata';

describe('util/odata', () => {
  describe('odataLiteral()', () => {
    it('returns null for null', () => {
      odataLiteral(null).should.equal('null');
    });

    it('encloses a string in single quotes', () => {
      odataLiteral('foo').should.equal("'foo'");
    });

    it('escapes single quotes', () => {
      odataLiteral("'foo'").should.equal("'''foo'''");
    });
  });
});
