import AnalyticsMetricsTable from '../../../src/components/analytics/metrics-table.vue';
import AnalyticsPreview from '../../../src/components/analytics/preview.vue';

import { load, mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';

const analyticsPreview = {
  system: { num_admins: { recent: 1, total: 1 } },
  projects: [
    {
      users: { num_managers: { recent: 0, total: 0 } },
      forms: { num_forms: { recent: 0, total: 0 } },
      submissions: {
        num_submissions_received: { recent: 0, total: 0 },
        num_submissions_from_web_users: { recent: 0, total: 0 }
      }
    },
    {
      users: { num_managers: { recent: 1, total: 1 } },
      forms: { num_forms: { recent: 1, total: 1 } },
      submissions: {
        num_submissions_received: { recent: 1, total: 1 },
        num_submissions_from_web_users: { recent: 0, total: 0 }
      }
    }
  ]
};
const mockHttpForComponent = () => mockHttp()
  .mount(AnalyticsPreview)
  .request(modal => modal.setProps({ state: true }))
  .respondWithData(() => analyticsPreview);

describe('AnalyticsPreview', () => {
  beforeEach(mockLogin);

  it('toggles the modal', () =>
    load('/system/analytics', { root: false }).testModalToggles({
      modal: AnalyticsPreview,
      show: '#analytics-form-enabled-true-help a',
      hide: '.btn-primary',
      respond: (series) => series.respondWithData(() => analyticsPreview)
    }));

  it('sends the correct request', () =>
    mockHttpForComponent().testRequests([{ url: '/v1/analytics/preview' }]));

  it('renders the correct number of tables', async () => {
    const modal = await mockHttpForComponent();
    modal.findAllComponents(AnalyticsMetricsTable).length.should.equal(5);
  });

  it('shows system metrics', async () => {
    const modal = await mockHttpForComponent();
    const table = modal.getComponent(AnalyticsMetricsTable);
    table.props().metrics.should.equal(analyticsPreview.system);
  });

  it('shows the number of projects', async () => {
    const modal = await mockHttpForComponent();
    const text = modal.get('#analytics-preview-project-summary .explanation').text();
    text.should.equal('(Showing the most active Project of 2 Projects)');
  });

  it('shows metrics for project with most submissions', async () => {
    const modal = await mockHttpForComponent();
    const tables = modal.findAllComponents(AnalyticsMetricsTable);
    const projectMetrics = analyticsPreview.projects[1];
    tables.at(1).props().metrics.should.equal(projectMetrics.users);
    tables.at(2).props().metrics.should.equal(projectMetrics.forms);
  });

  it('shows submission metrics split into two tables', async () => {
    const modal = await mockHttpForComponent();
    const tables = modal.findAllComponents(AnalyticsMetricsTable);
    const subMetrics = { num_submissions_from_web_users: { recent: 0, total: 0 } };
    const stateMetrics = { num_submissions_received: { recent: 1, total: 1 } };
    tables.at(3).props().metrics.should.eql(subMetrics);
    tables.at(4).props().metrics.should.eql(stateMetrics);
  });
});
