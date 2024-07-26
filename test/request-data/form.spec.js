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
  describe('publicLinks', () => {
    it('counts the number of active public links', () => {
      testData.standardPublicLinks
        .createPast(1)
        .createPast(1, { token: null });
      const requestData = createResources({
        publicLinks: testData.standardPublicLinks.sorted()
      });
      requestData.localResources.publicLinks.activeCount.should.equal(1);
    });
  });

  it('updates form.publicLinks to match publicLinks.activeCount', () => {
    const requestData = createResources({
      form: testData.extendedForms.createPast(1).last()
    });
    requestData.form.publicLinks.should.equal(0);
    testData.standardPublicLinks
      .createPast(1)
      .createPast(1, { token: null });
    setRequestData(requestData, {
      publicLinks: testData.standardPublicLinks.sorted()
    });
    requestData.form.publicLinks.should.equal(1);
  });
});
