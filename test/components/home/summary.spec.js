import HomeSummary from '../../../src/components/home/summary.vue';
import HomeSummaryItem from '../../../src/components/home/summary/item.vue';

import useProjects from '../../../src/request-data/projects';

import testData from '../../data';
import { mockHttp } from '../../util/http';
import { mockLogin } from '../../util/session';
import { mockRouter } from '../../util/router';
import { testRequestData } from '../../util/request-data';

const mountOptions = () => ({
  container: {
    requestData: testRequestData([useProjects], {
      projects: testData.extendedProjects.sorted()
    }),
    router: mockRouter('/')
  }
});

describe('HomeSummary', () => {
  it('renders four items for a sitewide administrator', () => {
    mockLogin();
    return mockHttp()
      .mount(HomeSummary, mountOptions())
      .respondWithData(() => testData.standardUsers.sorted())
      .afterResponse(component => {
        component.findAllComponents(HomeSummaryItem).length.should.equal(4);
      });
  });

  it('shows the project count', () => {
    mockLogin();
    testData.extendedProjects.createPast(2);
    return mockHttp()
      .mount(HomeSummary, mountOptions())
      .respondWithData(() => testData.standardUsers.sorted())
      .afterResponse(component => {
        component.getComponent(HomeSummaryItem).props().count.should.equal(2);
      });
  });

  it('shows the user count', () => {
    mockLogin();
    return mockHttp()
      .mount(HomeSummary, mountOptions())
      .respondWithData(() => testData.standardUsers.sorted())
      .afterResponse(component => {
        const item = component.findAllComponents(HomeSummaryItem)[1];
        const { to, count } = item.props();
        to.should.equal('/users');
        count.should.equal(1);
      });
  });

  it('does not render user count for a user without a sitewide role', () => {
    mockLogin({ role: 'none' });
    return mockHttp()
      .mount(HomeSummary, mountOptions())
      .afterResponse(component => {
        const items = component.findAllComponents(HomeSummaryItem);
        items.length.should.equal(3);
        for (const item of items)
          should(item.props().to).not.equal('/users');
      });
  });
});
