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
      mountComponent().text().should.equal('Download 2 Submissions…');
    });

    describe('submissions are filtered', () => {
      it('shows correct text while first chunk of submissions is loading', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true }
        });
        component.text().should.equal('Download matching Submissions…');
      });

      it('shows correct text after first chunk of submissions has loaded', () => {
        testData.extendedForms.createPast(1, { submissions: 2 });
        const component = mountComponent({
          props: { filtered: true },
          container: {
            requestData: {
              odata: { count: 1 }
            }
          }
        });
        component.text().should.equal('Download 1 matching Submission…');
      });
    });
  });
});
