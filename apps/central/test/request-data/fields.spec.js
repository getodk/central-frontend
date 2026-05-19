import useFields from '../../src/request-data/fields';

import createTestContainer from '../util/container';
import testData from '../data';
import { testRequestData } from '../util/request-data';

const { group, repeat, string, int } = testData.fields;

const createResource = (data) => {
  const { requestData } = createTestContainer({
    requestData: testRequestData([useFields], { fields: data })
  });
  return requestData.localResources.fields;
};

describe('useFields()', () => {
  describe('transformResponse()', () => {
    it('splits the path', () => {
      const fields = createResource([string('/g/s')]);
      fields[0].pathElements.should.eql(['g', 's']);
    });

    it('sets the column header', () => {
      const fields = createResource([string('/g/s')]);
      fields[0].header.should.eql('g-s');
    });
  });

  describe('selectable', () => {
    const selectablePaths = (data) =>
      createResource(data).selectable.map(field => field.path);

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
