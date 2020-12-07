import SubmissionAnalyze from '../../../src/components/submission/analyze.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';
import { trigger } from '../../util/event';

const clickTab = (wrapper, tabText) => {
  for (const a of wrapper.find('#submission-analyze .nav-tabs a')) {
    if (a.text().trim() === tabText)
      return trigger.click(a).then(() => wrapper);
  }
  throw new Error('tab not found');
};

describe('SubmissionAnalyze', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () => {
    testData.extendedForms.createPast(1);
    return load('/projects/1/forms/f/submissions').testModalToggles({
      modal: SubmissionAnalyze,
      show: '#submission-data-access-analyze-button',
      hide: '.btn-primary'
    });
  });

  describe('tool info', () => {
    let modal;
    beforeEach(() => {
      modal = mount(SubmissionAnalyze, {
        propsData: { state: true, baseUrl: '/v1/projects/1/forms/f' }
      });
    });

    const assertContent = (tabText, urlSuffix, helpSubstring) => {
      // Test the text of the active tab.
      const activeTab = modal.first('.nav-tabs li.active');
      activeTab.first('a').text().trim().should.equal(tabText);
      // Test the OData URL.
      const actualURL = modal.first('#submission-analyze-odata-url .selectable').text();
      const baseURL = `${window.location.origin}/v1/projects/1/forms/f.svc`;
      actualURL.should.equal(`${baseURL}${urlSuffix}`);
      // Test the help text.
      const help = modal.first('#submission-analyze-tool-help');
      help.text().iTrim().should.containEql(helpSubstring);
    };

    it('defaults to the Excel/Power BI tab', () => {
      assertContent('Excel/Power BI', '', 'For help using OData with Excel,');
    });

    it('renders the Excel/Power BI tab correctly', () =>
      clickTab(modal, 'R')
        .then(() => clickTab(modal, 'Excel/Power BI'))
        .then(() => {
          assertContent('Excel/Power BI', '', 'For help using OData with Excel,');
        }));

    it('renders the R tab correctly', () =>
      clickTab(modal, 'R').then(() => {
        assertContent('R', '', 'from R,');
      }));

    it('renders the Other tab correctly', () =>
      clickTab(modal, 'Other').then(() => {
        assertContent('Other', '', 'For a full description of our OData support,');
      }));
  });
});
