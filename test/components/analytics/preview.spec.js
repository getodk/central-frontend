import { assocPath } from 'ramda';

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
      },
      other: { has_description: 0, description_length: 0 },
      datasets: []
    },
    {
      users: { num_managers: { recent: 1, total: 1 } },
      forms: { num_forms: { recent: 1, total: 1 } },
      submissions: {
        num_submissions_received: { recent: 1, total: 1 },
        num_submissions_from_web_users: { recent: 1, total: 1 }
      },
      other: { has_description: 1, description_length: 40 },
      datasets: [
        {
          id: 1,
          num_properties: 2,
          num_creation_forms: 1,
          num_followup_forms: 1,
          num_entities: { total: 10, recent: 5 },
          num_failed_entities: { total: 2, recent: 1 }
        }
      ]
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
    modal.findAllComponents(AnalyticsMetricsTable).length.should.equal(7);
  });

  it('shows system metrics', async () => {
    const modal = await mockHttpForComponent();
    const table = modal.getComponent(AnalyticsMetricsTable);
    table.props().metrics.should.eql(analyticsPreview.system);
  });

  it('shows the project number and plurailization for a single project', async () => {
    const singleProject = {
      system: { num_admins: { recent: 1, total: 1 } },
      projects: [
        {
          users: { num_managers: { recent: 0, total: 0 } },
          forms: { num_forms: { recent: 0, total: 0 } },
          submissions: {
            num_submissions_received: { recent: 0, total: 0 },
            num_submissions_from_web_users: { recent: 0, total: 0 }
          },
          datasets: [],
          other: { has_description: 1, description_length: 40 }
        }
      ]
    };
    const container = await mockHttp()
      .mount(AnalyticsPreview)
      .request(modal => modal.setProps({ state: true }))
      .respondWithData(() => singleProject);
    const text = container.get('#analytics-preview-project-summary .explanation').text();
    text.should.equal('(Showing the most active Project of 1 Project)');
  });

  it('shows the project number and plurailization for multiple projects', async () => {
    const modal = await mockHttpForComponent();
    const text = modal.get('#analytics-preview-project-summary .explanation').text();
    text.should.equal('(Showing the most active Project of 2 Projects)');
  });

  it('shows metrics for project with most submissions', async () => {
    const modal = await mockHttpForComponent();
    const tables = modal.findAllComponents(AnalyticsMetricsTable);
    const projectMetrics = analyticsPreview.projects[1];
    tables[1].props().metrics.should.eql(projectMetrics.users);
    tables[2].props().metrics.should.eql(projectMetrics.forms);
  });

  it('shows submission metrics split into two tables', async () => {
    const modal = await mockHttpForComponent();
    const tables = modal.findAllComponents(AnalyticsMetricsTable);
    const subMetrics = { num_submissions_from_web_users: { recent: 1, total: 1 } };
    const stateMetrics = { num_submissions_received: { recent: 1, total: 1 } };
    tables[3].props().metrics.should.eql(subMetrics);
    tables[4].props().metrics.should.eql(stateMetrics);
  });

  it('shows other metrics', async () => {
    const modal = await mockHttpForComponent();
    const table = modal.findAllComponents(AnalyticsMetricsTable)[5];
    const subMetrics = { has_description: 1, description_length: 40 };
    table.props().metrics.should.eql(subMetrics);
  });

  it('shows dataset metrics', async () => {
    const modal = await mockHttpForComponent();
    const table = modal.findAllComponents(AnalyticsMetricsTable)[6];
    const subMetrics = {
      num_properties: 2,
      num_creation_forms: 1,
      num_followup_forms: 1,
      num_entities: { total: 10, recent: 5 },
      num_failed_entities: { total: 2, recent: 1 }
    };
    table.props().metrics.should.eql(subMetrics);
  });

  it('does not show dataset metrics if there is no dataset in any project', async () => {
    const component = await mockHttp()
      .mount(AnalyticsPreview)
      .request(modal => modal.setProps({ state: true }))
      .respondWithData(() => assocPath(['projects', 1, 'datasets'], [], analyticsPreview));

    component.find('#analytics-preview-dataset-summary').exists().should.be.false();
    should.not.exist(component.findAllComponents(AnalyticsMetricsTable)[6]);
  });
});
