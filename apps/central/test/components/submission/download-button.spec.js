import SubmissionDownloadButton from '../../../src/components/submission/download-button.vue';

import createTestContainer from '../../util/container';
import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';
import { testRequestData } from '../../util/request-data';

const mountComponent = (options = undefined) => {
  const merged = mergeMountOptions(options, {
    container: {
      requestData: testRequestData(['odata'], {
        form: testData.extendedForms.last()
      })
    }
  });
  merged.container = createTestContainer(merged.container);
  if (merged.props == null) merged.props = {};
  merged.props.formVersion = merged.container.requestData.form;
  return mount(SubmissionDownloadButton, merged);
};

describe('SubmissionDownloadButton', () => {
  describe('text', () => {
    it('shows the correct text if the submissions are not filtered', () => {
      testData.extendedForms.createPast(1, { submissions: 2 });
      mountComponent().find('.btn-primary').text().should.equal('Download');
    });

    describe('submissions are filtered', () => {
      it('show the dropdown menu', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true }
        });
        component.find('.btn-primary').attributes()['data-toggle'].should.be.eql('dropdown');
      });

      it('shows correct text while first chunk of submissions is loading for the first button', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true }
        });
        component.find('li:nth-of-type(1)').text().should.equal('Download all Submissions matching the filter');
      });

      it('shows correct text after first chunk of submissions has loaded for the first button', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true },
          container: {
            requestData: {
              odata: { count: 1 }
            }
          }
        });
        component.find('li:nth-of-type(1)').text().should.equal('Download 1 Submission matching the filter');
      });

      it('shows correct text while first chunk of submissions is loading for the second button', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true }
        });
        component.find('li:nth-of-type(2)').text().should.equal('Download all 2 Submissions');
      });
    });
  });
});
