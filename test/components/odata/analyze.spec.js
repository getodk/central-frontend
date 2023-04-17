import Selectable from '../../../src/components/selectable.vue';
import OdataAnalyze from '../../../src/components/odata/analyze.vue';

import testData from '../../data';
import { load } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(OdataAnalyze, mergeMountOptions(options, {
    props: { state: true, odataUrl: '' }
  }));
const clickTab = (component, tabText) =>
  component.findAll('#odata-analyze .nav-tabs a')
    .find(a => a.text() === tabText)
    .trigger('click');

describe('OdataAnalyze', () => {
  beforeEach(() => {
    mockLogin();
    testData.extendedForms.createPast(1);
  });

  it('toggles the modal', () =>
    load('/projects/1/forms/f/submissions', { root: false }).testModalToggles({
      modal: OdataAnalyze,
      show: '#odata-data-access-analyze-button',
      hide: '.btn-primary'
    }));

  describe('tool help', () => {
    const assertContent = (modal, tabText, helpSubstring) => {
      modal.get('.nav-tabs li.active a').text().should.equal(tabText);

      const help = modal.get('#odata-analyze-tool-help');
      help.text().should.containEql(helpSubstring);
    };

    it('defaults to the Power BI tab', () => {
      const modal = mountComponent();
      assertContent(modal, 'Power BI or Excel', 'For help using OData with Power BI,');
    });

    it('renders the Power BI tab correctly', async () => {
      const modal = mountComponent();
      await clickTab(modal, 'R');
      await clickTab(modal, 'Power BI or Excel');
      assertContent(modal, 'Power BI or Excel', 'For help using OData with Power BI,');
    });

    it('renders the Python tab correctly', async () => {
      const modal = mountComponent();
      await clickTab(modal, 'Python');
      assertContent(modal, 'Python', 'from Python,');
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

  it('shows the correct odata URL set from prop', () => {
    const component = mountComponent({ props: { odataUrl: '/path/to/odata.svc' } });
    const text = component.getComponent(Selectable).text();
    text.should.equal('/path/to/odata.svc');
  });

  it('shows the correct URL from form submission page', async () => {
    const component = await load('/projects/1/forms/f/submissions', {
      root: false
    });
    const text = component.getComponent(Selectable).text();
    text.should.equal(`${window.location.origin}/v1/projects/1/forms/f.svc`);
  });
});
