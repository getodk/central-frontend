import createTestContainer from '../util/container';
import testData from '../data';

describe('requestData.keys', () => {
  describe('selectable', () => {
    const selectablePaths = (fields) => {
      const { requestData } = createTestContainer({
        requestData: { fields }
      });
      return requestData.fields.selectable.value.map(field => field.path);
    };
    const { group, repeat, string, int } = testData.fields;

    it('returns a field outside a group', () => {
      selectablePaths([int('/i')]).should.eql(['/i']);
    });

    it('returns a field inside a group, but not the group itself', () => {
      selectablePaths([group('/g'), int('/g/i')]).should.eql(['/g/i']);
    });

    it('filters out /meta/instanceID', () => {
      const selectable = selectablePaths([
        group('/meta'),
        string('/meta/instanceID'),
        int('/i')
      ]);
      selectable.should.eql(['/i']);
    });

    it('filters out /instanceID', () => {
      selectablePaths([string('/instanceID'), int('/i')]).should.eql(['/i']);
    });

    it('filters out repeat groups', () => {
      const selectable = selectablePaths([
        /* eslint-disable indent */
        int('/int1'),
        repeat('/repeat1'),
          int('/repeat1/int2'),
          repeat('/repeat1/repeat2'),
            int('/repeat1/repeat2/int3'),
        int('/int4'),
        group('/group1'),
          int('/group1/int5'),
          repeat('/group1/repeat3'),
            int('/group1/repeat3/int6'),
          int('/group1/int7')
        /* eslint-enable indent */
      ]);
      selectable.should.eql([
        '/int1',
        '/int4',
        '/group1/int5',
        '/group1/int7'
      ]);
    });

    it('returns an empty array if there are no selectable fields', () => {
      selectablePaths([repeat('/r'), int('/r/i')]).length.should.equal(0);
    });
  });
});