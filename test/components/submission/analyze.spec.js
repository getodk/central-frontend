import Selectable from '../../../src/components/selectable.vue';
import SubmissionAnalyze from '../../../src/components/submission/analyze.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mount } from '../../util/lifecycle';

const mountComponent = () => mount(SubmissionAnalyze, {
  props: { state: true },
  container: {
    requestData: { form: testData.extendedForms.last() }
  }
});
const clickTab = (component, tabText) =>
  component.findAll('#submission-analyze .nav-tabs a')
    .find(a => a.text() === tabText)
    .trigger('click');

describe('SubmissionAnalyze', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/submissions', { root: false }).testModalToggles({
      modal: SubmissionAnalyze,
      show: '#submission-data-access-analyze-button',
      hide: '.btn-primary'
    }));

  describe('tool help', () => {
    const assertContent = (modal, tabText, helpSubstring) => {
      modal.get('.nav-tabs li.active a').text().should.equal(tabText);

      const help = modal.get('#submission-analyze-tool-help');
      help.text().should.containEql(helpSubstring);
    };

    it('defaults to the Excel/Power BI tab', () => {
      const modal = mountComponent();
      assertContent(modal, 'Excel/Power BI', 'For help using OData with Excel,');
    });

    it('renders the Excel/Power BI tab correctly', async () => {
      const modal = mountComponent();
      await clickTab(modal, 'R');
      await clickTab(modal, 'Excel/Power BI');
      assertContent(modal, 'Excel/Power BI', 'For help using OData with Excel,');
    });

    it('renders the R tab correctly', async () => {
      const modal = mountComponent();
      await clickTab(modal, 'R');
      assertContent(modal, 'R', 'from R,');
    });

    it('renders the Other tab correctly', async () => {
      const modal = mountComponent();
      await clickTab(modal, 'Other');
      assertContent(modal, 'Other', 'For a full description of our OData support,');
    });
  });

  it('shows the correct URL', () => {
    const text = mountComponent().getComponent(Selectable).text();
    text.should.equal(`${window.location.origin}/v1/projects/1/forms/f.svc`);
  });
});
