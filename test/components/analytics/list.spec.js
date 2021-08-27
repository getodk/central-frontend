import { load } from '../../util/http';
import { mockLogin } from '../../util/session';

describe('AnalyticsList', () => {
  beforeEach(mockLogin);

  it('sends the correct initial requests', () =>
    load('/system/analytics').testRequests([
      { url: '/v1/config/analytics' }
    ]));
});
