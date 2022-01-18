import AnalyticsMetricsTable from '../../../src/components/analytics/metrics-table.vue';

import { mount } from '../../util/lifecycle';

describe('AnalyticsMetricsTable', () => {
  it('shows the title', () => {
    const component = mount(AnalyticsMetricsTable, {
      props: {
        title: 'System',
        metrics: { num_admins: { recent: 1, total: 1 } }
      }
    });
    component.get('th').text().should.equal('System');
  });

  it('shows the metric name', () => {
    const component = mount(AnalyticsMetricsTable, {
      props: {
        title: 'System',
        metrics: { num_admins: { recent: 1, total: 1 } }
      }
    });
    component.get('td').text().should.equal('Number of Administrators');
  });

  it('correctly renders a metric with recent data', () => {
    const component = mount(AnalyticsMetricsTable, {
      props: {
        title: 'System',
        metrics: { num_admins: { recent: 1000, total: 2000 } }
      }
    });
    const text = component.findAll('td.metric-value').map(td => td.text());
    text.should.eql(['1,000', '2,000']);
  });

  it('correctly renders a metric without recent data', () => {
    const component = mount(AnalyticsMetricsTable, {
      props: {
        title: 'System',
        metrics: { num_questions_biggest_form: 1000 }
      }
    });
    const td = component.findAll('td.metric-value');
    td.length.should.equal(1);
    td[0].attributes().colspan.should.equal('2');
    td[0].text().should.equal('1,000');
  });

  it('renders a row for each metric', () => {
    const component = mount(AnalyticsMetricsTable, {
      props: {
        title: 'System',
        metrics: {
          num_admins: { recent: 1, total: 1 },
          num_questions_biggest_form: 1
        }
      }
    });
    component.findAll('tbody tr').length.should.equal(2);
  });
});
