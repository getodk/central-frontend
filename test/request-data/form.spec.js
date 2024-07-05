import useForm from '../../src/request-data/form';

import createTestContainer from '../util/container';
import testData from '../data';
import { setRequestData, testRequestData } from '../util/request-data';

const createResources = (data = {}) => {
  const { requestData } = createTestContainer({
    requestData: testRequestData([useForm], data)
  });
  return requestData;
};

describe('useForm()', () => {
  it('updates form.publicLinks to match publicLinks.length', () => {
    const requestData = createResources({
      form: testData.extendedForms.createPast(1).last()
    });
    requestData.form.publicLinks.should.equal(0);
    setRequestData(requestData, {
      publicLinks: testData.standardPublicLinks.createPast(1).sorted()
    });
    requestData.form.publicLinks.should.equal(1);
  });
});
